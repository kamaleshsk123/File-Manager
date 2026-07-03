import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parentFolderId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  isFavorite: boolean;
  isDeleted: boolean;
  tags: string[];
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  parentFolderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  createdAt: { type: Date, default: Date.now },
  isFavorite: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
});

export default mongoose.model<IFolder>('Folder', FolderSchema);
