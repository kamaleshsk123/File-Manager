import { Router, Request, Response } from 'express';
import Folder from '../models/Folder';
import File from '../models/File';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
// archiver@5.x is CommonJS - must use require()
const archiver = createRequire(__filename)('archiver');
import crypto from 'crypto';

const router = Router();

// Get filtered folders
router.get('/filter/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    let folders: any[] = [];

    switch (type) {
      case 'trash':
        folders = await Folder.find({ isDeleted: true });
        break;
      case 'favorites':
        folders = await Folder.find({ isFavorite: true, isDeleted: false });
        break;
      case 'all':
        folders = await Folder.find({ isDeleted: false });
        break;
      case 'recent':
        folders = await Folder.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(20);
        break;
      default:
        folders = [];
    }

    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch filtered folders' });
  }
});

// Get root folders (no parentId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const folders = await Folder.find({ parentFolderId: null, isDeleted: false });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get folders by parentId
router.get('/:parentId', async (req: Request, res: Response) => {
  try {
    const { parentId } = req.params;
    const folders = await Folder.find({ parentFolderId: parentId, isDeleted: false });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, parentFolderId } = req.body;
    const folder = new Folder({ name, parentFolderId: parentFolderId || null });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Rename folder
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to rename folder' });
  }
});

// Toggle Favorite
router.put('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    folder.isFavorite = !folder.isFavorite;
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Move to Trash (Soft Delete)
router.put('/:id/trash', async (req: Request, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    folder.isDeleted = true;
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move to trash' });
  }
});

// Restore from Trash
router.put('/:id/restore', async (req: Request, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    folder.isDeleted = false;
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore folder' });
  }
});

// Delete folder (Permanent)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Only permanently delete if it's already in the trash
    const folder = await Folder.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!folder) {
      // If not in trash, soft delete instead
      const softFolder = await Folder.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
      if (!softFolder) return res.status(404).json({ error: 'Folder not found' });
      return res.json({ message: 'Folder moved to trash', softDeleted: true });
    }

    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Folder permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Enable sharing or update sharing details
router.put('/:id/share', async (req: Request, res: Response) => {
  try {
    const { expiresInHours } = req.body;
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    folder.isShared = true;
    if (!folder.shareId) {
      folder.shareId = crypto.randomBytes(8).toString('hex');
    }

    if (expiresInHours && expiresInHours > 0) {
      folder.shareExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    } else {
      folder.shareExpiresAt = null;
    }

    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to share folder' });
  }
});

// Disable sharing
router.delete('/:id/share', async (req: Request, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    folder.isShared = false;
    folder.shareId = null;
    folder.shareExpiresAt = null;

    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable folder sharing' });
  }
});

// Move folder
router.put('/:id/move', async (req: Request, res: Response) => {
  try {
    const { targetFolderId } = req.body;
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    
    if (targetFolderId === folder._id.toString()) {
        return res.status(400).json({ error: 'Cannot move folder into itself' });
    }

    folder.parentFolderId = targetFolderId === 'null' || !targetFolderId ? null : targetFolderId;
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move folder' });
  }
});

// Copy folder (shallow)
router.post('/:id/copy', async (req: Request, res: Response) => {
  try {
    const { targetFolderId } = req.body;
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const newFolder = new Folder({
      name: `Copy of ${folder.name}`,
      parentFolderId: targetFolderId === 'null' || !targetFolderId ? null : targetFolderId,
    });

    await newFolder.save();
    res.status(201).json(newFolder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to copy folder' });
  }
});

// Download folder as ZIP
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const rootFolder = await Folder.findById(req.params.id);
    if (!rootFolder) return res.status(404).json({ error: 'Folder not found' });

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${rootFolder.name}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.on('error', (err: any) => {
      console.error('Archive error:', err);
    });

    const db = mongoose.connection.db;
    const bucket = db ? new GridFSBucket(db, { bucketName: 'uploads' }) : null;
    const uploadDir = path.join(__dirname, '../../uploads');

    // Helper to recursively append contents
    const appendFolder = async (folderId: string, currentPath: string) => {
        const files = await File.find({ folderId, isDeleted: false });
        for (const file of files) {
            const filePath = `${currentPath}${file.name}`;
            if (ObjectId.isValid(file.filename) && bucket) {
                // GridFS File
                const stream = bucket.openDownloadStream(new ObjectId(file.filename));
                archive.append(stream, { name: filePath });
            } else {
                // Legacy local disk file
                const localPath = path.join(uploadDir, file.filename);
                if (fs.existsSync(localPath)) {
                    archive.append(fs.createReadStream(localPath), { name: filePath });
                }
            }
        }

        const subFolders = await Folder.find({ parentFolderId: folderId, isDeleted: false });
        for (const subFolder of subFolders) {
            // Create an explicit directory entry for the subfolder
            archive.append(Buffer.alloc(0), { name: `${currentPath}${subFolder.name}/` });
            await appendFolder(subFolder.id, `${currentPath}${subFolder.name}/`);
        }
    };

    // Begin recursion
    await appendFolder(rootFolder.id, `${rootFolder.name}/`);
    await archive.finalize();

  } catch (error) {
    console.error('Folder download failed:', error);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate folder zip' });
    }
  }
});

export default router;
