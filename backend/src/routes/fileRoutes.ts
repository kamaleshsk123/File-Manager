import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import File from '../models/File';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Upload file — must be BEFORE the /:folderId route to avoid conflict
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folderId } = req.body;

    const fileRecord = new File({
      name: req.file.originalname,
      folderId: folderId === 'null' || !folderId ? null : folderId,
      size: req.file.size,
      type: req.file.mimetype,
    });

    await fileRecord.save();
    res.status(201).json(fileRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
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

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
