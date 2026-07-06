import { Router, Request, Response } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import File from '../models/File';
import crypto from 'crypto';

const router = Router();

// Ensure uploads directory exists (for legacy local files)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'text/markdown', 'text/x-markdown'];
const ALLOWED_EXTENSIONS = ['.pdf', '.md'];

// Use memory storage for multer since we'll stream to GridFS
const storage = multer.memoryStorage();

// Reject any file that is not .pdf or .md
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isExt  = ALLOWED_EXTENSIONS.includes(ext);
  if (isMime || isExt) {
    cb(null, true);
  } else {
    cb(new Error(`Only .pdf and .md files are allowed. Received: ${file.originalname}`));
  }
};

// Allow up to 20 files at once
const upload = multer({ storage, fileFilter, limits: { files: 20, fileSize: 50 * 1024 * 1024 } });

// Upload files (multiple) — only .pdf and .md allowed
router.post('/upload', upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { folderId } = req.body;
    const resolvedFolderId = folderId === 'null' || !folderId ? null : folderId;

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection not established');
    }
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Save all files to DB in parallel
    const saved = await Promise.all(
      files.map(async (file) => {
        // Upload to GridFS
        const uploadStream = bucket.openUploadStream(file.originalname, {
            metadata: { contentType: file.mimetype }
        });
        
        return new Promise<any>((resolve, reject) => {
            uploadStream.on('error', reject);
            uploadStream.on('finish', async () => {
                // Save metadata record
                const fileRecord = new File({
                    name: file.originalname,
                    folderId: resolvedFolderId,
                    size: file.size,
                    type: file.mimetype,
                    filename: uploadStream.id.toString(), // Use GridFS file ID as filename for retrieval
                });
                await fileRecord.save();
                resolve(fileRecord);
            });
            uploadStream.end(file.buffer);
        });
      })
    );

    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to upload file(s)' });
  }
});

// Download file
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const forceDownload = req.query.attachment === '1';
    res.set('Content-Type', file.type || 'application/octet-stream');
    res.set('Content-Disposition', `${forceDownload ? 'attachment' : 'inline'}; filename="${file.name}"`);

    if (ObjectId.isValid(file.filename)) {
        // GridFS File
        const db = mongoose.connection.db;
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const downloadStream = bucket.openDownloadStream(new ObjectId(file.filename));
        
        downloadStream.on('error', () => {
            res.status(404).json({ error: 'Physical file not found in GridFS' });
        });

        downloadStream.pipe(res);
    } else {
        // Legacy Disk File
        const filePath = path.join(uploadDir, file.filename);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Physical file not found on disk' });
        }
        res.sendFile(filePath, { headers: { 'Content-Disposition': `inline; filename="${file.name}"` } });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get filtered files
router.get('/filter/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    let files: any[] = [];

    switch (type) {
      case 'trash':
        files = await File.find({ isDeleted: true });
        break;
      case 'favorites':
        files = await File.find({ isFavorite: true, isDeleted: false });
        break;
      case 'all':
        files = await File.find({ isDeleted: false });
        break;
      case 'recent':
        files = await File.find({ isDeleted: false }).sort({ uploadedAt: -1 }).limit(20);
        break;
      case 'documents':
        files = await File.find({
          isDeleted: false,
          type: { $in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] }
        });
        break;
      default:
        files = [];
    }

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch filtered files' });
  }
});

// Get files in root (no folderId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await File.find({ folderId: null, isDeleted: false });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get files by folderId
router.get('/:folderId', async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;
    const files = await File.find({ folderId, isDeleted: false });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Rename file
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const file = await File.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// Toggle Favorite
router.put('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    file.isFavorite = !file.isFavorite;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Move to Trash (Soft Delete)
router.put('/:id/trash', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    file.isDeleted = true;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move to trash' });
  }
});

// Restore from Trash
router.put('/:id/restore', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    file.isDeleted = false;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore file' });
  }
});

// Delete file (Permanent)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Only permanently delete if it's already in the trash
    const file = await File.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!file) {
      // If not in trash, soft delete instead
      const softFile = await File.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
      if (!softFile) return res.status(404).json({ error: 'File not found' });
      return res.json({ message: 'File moved to trash', softDeleted: true });
    }

    if (ObjectId.isValid(file.filename)) {
        // Delete physical file from GridFS
        const db = mongoose.connection.db;
        if (db) {
            const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
            try {
                await bucket.delete(new ObjectId(file.filename));
            } catch (err) {
                console.error('GridFS delete error (file might not exist):', err);
            }
        }
    } else {
        // Delete physical file from local disk
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
    }

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Enable sharing or update sharing details
router.put('/:id/share', async (req: Request, res: Response) => {
  try {
    const { expiresInHours } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.isShared = true;
    if (!file.shareId) {
      file.shareId = crypto.randomBytes(8).toString('hex');
    }

    if (expiresInHours && expiresInHours > 0) {
      file.shareExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    } else {
      file.shareExpiresAt = null;
    }

    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to share file' });
  }
});

// Disable sharing
router.delete('/:id/share', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.isShared = false;
    file.shareId = null;
    file.shareExpiresAt = null;

    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable file sharing' });
  }
});

// Move file
router.put('/:id/move', async (req: Request, res: Response) => {
  try {
    const { targetFolderId } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.folderId = targetFolderId === 'null' || !targetFolderId ? null : targetFolderId;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move file' });
  }
});

// Copy file
router.post('/:id/copy', async (req: Request, res: Response) => {
  try {
    const { targetFolderId } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (ObjectId.isValid(file.filename)) {
        // GridFS File Copy
        const db = mongoose.connection.db;
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const downloadStream = bucket.openDownloadStream(new ObjectId(file.filename));
        const uploadStream = bucket.openUploadStream(`Copy of ${file.name}`, {
            metadata: { contentType: file.type }
        });

        downloadStream.pipe(uploadStream);

        uploadStream.on('finish', async () => {
            const newFile = new File({
                name: `Copy of ${file.name}`,
                folderId: targetFolderId === 'null' || !targetFolderId ? null : targetFolderId,
                size: file.size,
                type: file.type,
                filename: uploadStream.id.toString(), // New GridFS ID
            });
            await newFile.save();
            res.status(201).json(newFile);
        });
        
        downloadStream.on('error', (err) => res.status(500).json({ error: 'Failed to read original file from GridFS' }));
        uploadStream.on('error', (err) => res.status(500).json({ error: 'Failed to write copied file to GridFS' }));

    } else {
        // Legacy Disk File Copy
        const newFilename = `${Date.now()}-copy-${file.name}`;
        const srcPath = path.join(uploadDir, file.filename);
        const destPath = path.join(uploadDir, newFilename);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
        }

        const newFile = new File({
            name: `Copy of ${file.name}`,
            folderId: targetFolderId === 'null' || !targetFolderId ? null : targetFolderId,
            size: file.size,
            type: file.type,
            filename: fs.existsSync(srcPath) ? newFilename : file.filename,
        });

        await newFile.save();
        res.status(201).json(newFile);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to copy file' });
  }
});

export default router;
