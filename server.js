import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import dbConnect from './src/lib/db.ts';
import { DocumentModel } from './src/models/Document.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory store of active documents
const docs = new Map();

const getDoc = (documentId) => {
  if (docs.has(documentId)) {
    return docs.get(documentId);
  }
  const ydoc = new Y.Doc();
  docs.set(documentId, ydoc);

  // Load from DB if exists
  dbConnect().then(async () => {
    try {
      const dbDoc = await DocumentModel.findById(documentId);
      if (dbDoc && dbDoc.content) {
        Y.applyUpdate(ydoc, dbDoc.content);
      }
    } catch (err) {
      console.error('Error loading doc from DB:', err);
    }
  });

  return ydoc;
};

const saveDocToDB = async (documentId, ydoc) => {
  try {
    await dbConnect();
    const update = Y.encodeStateAsUpdate(ydoc);
    await DocumentModel.findByIdAndUpdate(documentId, {
      content: Buffer.from(update),
      updatedAt: new Date()
    });
  } catch (err) {
    console.error('Error saving doc to DB:', err);
  }
};

/**
 * Determine a user's role on a document.
 * Returns 'owner' | 'editor' | 'viewer' | null (no access)
 */
const getUserRole = async (documentId, userId) => {
  try {
    await dbConnect();
    const doc = await DocumentModel.findById(documentId).lean();
    if (!doc) return null;

    // Unauthenticated users get viewer access on legacy docs without an owner
    if (!userId) {
      return doc.owner ? null : 'viewer';
    }

    // Owner
    if (doc.owner && doc.owner.toString() === userId) {
      return 'owner';
    }

    // Check collaborators array
    const collab = (doc.collaborators || []).find(
      (c) => c.user && c.user.toString() === userId
    );
    if (collab) return collab.role; // 'editor' | 'viewer'

    // Legacy docs without an owner – treat all auth'd users as editors
    if (!doc.owner) return 'editor';

    return null; // No access
  } catch (err) {
    console.error('Error fetching user role:', err);
    return null;
  }
};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // ─── JWT Authentication middleware ───────────────────────────────────────
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) {
      // Allow unauthenticated connections (viewer-only on legacy docs)
      socket.data.userId = null;
      socket.data.userEmail = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.data.userId = payload.id;
      socket.data.userEmail = payload.email;
      next();
    } catch {
      // Token present but invalid → reject
      return next(new Error('Invalid or expired access token'));
    }
  });

  io.on('connection', async (socket) => {
    const { documentId } = socket.handshake.query;
console.log(socket)
    if (!documentId) {
      socket.disconnect();
      return;
    }

    // Determine this user's role for the document
    const role = await getUserRole(documentId, socket.data.userId);

    if (role === null) {
      // No access at all
      socket.emit('error', { message: 'You do not have access to this document' });
      socket.disconnect();
      return;
    }

    // Attach role for use in event handlers
    socket.data.role = role;

    socket.join(documentId);

    const ydoc = getDoc(documentId);

    // Send current state to newly connected client
    const stateVector = Y.encodeStateVector(ydoc);
    socket.emit('sync-step-1', stateVector);
    // Also emit the user's role so the client can adapt its UI
    socket.emit('user-role', { role });

    socket.on('sync-step-1', (stateVector) => {
      const update = Y.encodeStateAsUpdate(ydoc, new Uint8Array(stateVector));
      socket.emit('sync-step-2', update);
    });

    socket.on('sync-step-2', (update) => {
      // VIEWERS cannot push state updates
      if (socket.data.role === 'viewer') {
        socket.emit('error', { message: 'Viewers cannot edit this document' });
        return;
      }
      Y.applyUpdate(ydoc, new Uint8Array(update));
      socket.to(documentId).emit('sync-update', update);
      saveDocToDB(documentId, ydoc);
    });

    socket.on('sync-update', (update) => {
      // VIEWERS cannot push state updates
      if (socket.data.role === 'viewer') {
        socket.emit('error', { message: 'Viewers cannot edit this document' });
        return;
      }
      Y.applyUpdate(ydoc, new Uint8Array(update));
      socket.to(documentId).emit('sync-update', update);
      saveDocToDB(documentId, ydoc);
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
