import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  name: string;
  folderId: mongoose.Types.ObjectId | null;
  size: number;
  type: string;
  uploadedAt: Date;
  isFavorite: boolean;
  isDeleted: boolean;
  tags: string[];
  filename: string;
  isShared: boolean;
  shareId: string | null;
  shareExpiresAt: Date | null;
}

const FileSchema: Schema = new Schema({
  name: { type: String, required: true },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  isFavorite: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  filename: { type: String, required: true },
  isShared: { type: Boolean, default: false },
  shareId: { type: String, default: null },
  shareExpiresAt: { type: Date, default: null },
});

export default mongoose.model<IFile>('File', FileSchema);
