import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import File from './models/File';

// Polyfill crypto for older Node versions
if (typeof global.crypto === 'undefined') {
  // @ts-ignore
  global.crypto = crypto;
}

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/docvault';
const uploadDir = path.join(__dirname, '../uploads');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Get all files from DB where filename is missing or empty
    const filesToMigrate = await File.find({
      $or: [
        { filename: { $exists: false } },
        { filename: '' },
        { filename: null }
      ]
    });

    console.log(`Found ${filesToMigrate.length} files in DB needing migration.`);

    if (filesToMigrate.length === 0) {
      console.log('No files need migration.');
      process.exit(0);
    }

    // 2. Read physical files in upload directory
    if (!fs.existsSync(uploadDir)) {
      console.error(`Upload directory does not exist: ${uploadDir}`);
      process.exit(1);
    }
    const physicalFiles = fs.readdirSync(uploadDir);
    console.log(`Found ${physicalFiles.length} physical files on disk.`);

    let migratedCount = 0;

    // 3. Match and update
    for (const dbFile of filesToMigrate) {
      // Find a physical file on disk that ends with `-${dbFile.name}`
      const match = physicalFiles.find(name => name.endsWith(`-${dbFile.name}`));

      if (match) {
        dbFile.filename = match;
        await dbFile.save();
        console.log(`Migrated: "${dbFile.name}" -> filename: "${match}"`);
        migratedCount++;
      } else {
        console.log(`No physical file match found for "${dbFile.name}"`);
      }
    }

    console.log(`Migration complete. Successfully migrated ${migratedCount}/${filesToMigrate.length} files.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
