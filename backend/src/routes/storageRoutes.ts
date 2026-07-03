import { Router, Request, Response } from 'express';
import File from '../models/File';

const router = Router();

// GET /api/storage — returns used bytes and file count
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await File.aggregate([
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$size' },
          totalFiles: { $count: {} },
        },
      },
    ]);

    const data = result[0] || { totalBytes: 0, totalFiles: 0 };

    res.json({
      usedBytes: data.totalBytes,
      totalFiles: data.totalFiles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage stats' });
  }
});

export default router;
