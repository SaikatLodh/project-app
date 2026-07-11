import mongoose from 'mongoose';

const CollaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer',
    },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document',
  },
  content: {
    type: Buffer, // Yjs updates binary format
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // false to allow legacy docs without owner
    default: null,
  },
  collaborators: {
    type: [CollaboratorSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

export const DocumentModel =
  mongoose.models.Document || mongoose.model('Document', DocumentSchema);
