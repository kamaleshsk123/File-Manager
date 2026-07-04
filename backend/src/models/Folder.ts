import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parentFolderId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  isFavorite: boolean;
  isDeleted: boolean;
  tags: string[];
  isShared: boolean;
  shareId: string | null;
  shareExpiresAt: Date | null;
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  parentFolderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  createdAt: { type: Date, default: Date.now },
  isFavorite: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  isShared: { type: Boolean, default: false },
  shareId: { type: String, default: null },
  shareExpiresAt: { type: Date, default: null },
});

export default mongoose.model<IFolder>('Folder', FolderSchema);
