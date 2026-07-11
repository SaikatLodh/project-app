import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DocumentModel } from '@/models/Document';
import { getTokenFromRequest, verifyAccessToken } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const document = await DocumentModel.findOne({ _id: id, isDeleted: { $ne: true } }).select('_id title createdAt updatedAt owner');
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ document });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const doc = await DocumentModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only the owner can delete
    if (doc.owner?.toString() !== payload.id) {
      return NextResponse.json({ error: 'You do not have permission to delete this document' }, { status: 403 });
    }

    await DocumentModel.findByIdAndUpdate(id, { isDeleted: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title } = body;
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    await dbConnect();

    const doc = await DocumentModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Owner or collaborator (editor role) can edit
    const isOwner = doc.owner?.toString() === payload.id;
    const isEditor = doc.collaborators?.some(
      (c: any) => c.user?.toString() === payload.id && c.role === 'editor'
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'You do not have permission to edit this document' }, { status: 403 });
    }

    const updated = await DocumentModel.findByIdAndUpdate(
      id,
      { title: title.trim(), updatedAt: new Date() },
      { new: true }
    ).select('_id title updatedAt');

    return NextResponse.json({ document: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

