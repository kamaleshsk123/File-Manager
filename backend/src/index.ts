import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import folderRoutes from './routes/folderRoutes';
import fileRoutes from './routes/fileRoutes';
import storageRoutes from './routes/storageRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/docvault';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/storage', storageRoutes);

app.get('/', (req, res) => {
  res.send('DocVault API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
