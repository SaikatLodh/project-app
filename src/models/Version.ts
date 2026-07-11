import mongoose from 'mongoose';

const VersionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  content: {
    type: Buffer, // Yjs snapshot state vector binary
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const VersionModel = mongoose.models.Version || mongoose.model('Version', VersionSchema);
