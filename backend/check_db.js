const { webcrypto } = require('crypto');
if (!global.crypto) {
  global.crypto = webcrypto;
}

require('dotenv').config();
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const FolderSchema = new Schema({
  name: { type: String },
  shareId: { type: String },
  isShared: { type: Boolean },
  isDeleted: { type: Boolean }
}, { strict: false });

const Folder = mongoose.model('Folder', FolderSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to Atlas.');
  const folder = await Folder.findOne({ name: 'TankIQ Mobile Design' });
  console.log('Folder info:', folder);
  mongoose.disconnect();
}

run();
