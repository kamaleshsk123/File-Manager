import { Router, Request, Response } from 'express';
import File from '../models/File';
import Folder from '../models/Folder';

const router = Router();

// Retrieve public shared item by shareId
router.get('/:type/:shareId', async (req: Request, res: Response) => {
  try {
    const { type, shareId } = req.params;

    if (type === 'file') {
      const file = await File.findOne({ shareId, isShared: true, isDeleted: false });
      if (!file) return res.status(404).json({ error: 'Shared file not found or sharing has been disabled' });

      // Check expiration if present
      if (file.shareExpiresAt && new Date() > file.shareExpiresAt) {
        return res.status(410).json({ error: 'Share link has expired' });
      }

      return res.json(file);
    } else if (type === 'folder') {
      const folder = await Folder.findOne({ shareId, isShared: true, isDeleted: false });
      if (!folder) return res.status(404).json({ error: 'Shared folder not found or sharing has been disabled' });

      // Check expiration if present
      if (folder.shareExpiresAt && new Date() > folder.shareExpiresAt) {
        return res.status(410).json({ error: 'Share link has expired' });
      }

      // Fetch all immediate files and subfolders within this shared folder
      const childFolders = await Folder.find({ parentFolderId: folder._id, isDeleted: false });
      const childFiles = await File.find({ folderId: folder._id, isDeleted: false });

      return res.json({
        folder,
        contents: {
          folders: childFolders,
          files: childFiles
        }
      });
    }

    return res.status(400).json({ error: 'Invalid share type' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve shared item' });
  }
});

// Retrieve public shared subfolder by ID (verifying descendant of a shared root)
router.get('/folder/node/:folderId', async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;
    
    // Verify this folder is indeed a descendant of a shared folder
    let current = await Folder.findById(folderId);
    let authorized = false;
    while (current) {
      if (current.isShared && (!current.shareExpiresAt || new Date() < current.shareExpiresAt)) {
        authorized = true;
        break;
      }
      if (!current.parentFolderId) break;
      current = await Folder.findById(current.parentFolderId);
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const childFolders = await Folder.find({ parentFolderId: folderId, isDeleted: false });
    const childFiles = await File.find({ folderId: folderId, isDeleted: false });

    res.json({
      folders: childFolders,
      files: childFiles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve subfolder contents' });
  }
});

// Retrieve public shared file by ID (verifying descendant of a shared root)
router.get('/file/node/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    if (!file || file.isDeleted) return res.status(404).json({ error: 'File not found' });

    // If file is shared itself
    if (file.isShared && (!file.shareExpiresAt || new Date() < file.shareExpiresAt)) {
      return res.json(file);
    }

    // If not directly shared, verify if any parent folder is shared
    if (file.folderId) {
      let current = await Folder.findById(file.folderId);
      let authorized = false;
      while (current) {
        if (current.isShared && (!current.shareExpiresAt || new Date() < current.shareExpiresAt)) {
          authorized = true;
          break;
        }
        if (!current.parentFolderId) break;
        current = await Folder.findById(current.parentFolderId);
      }
      if (authorized) {
        return res.json(file);
      }
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

export default router;
