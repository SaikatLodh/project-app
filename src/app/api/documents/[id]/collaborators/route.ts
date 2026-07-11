import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { DocumentModel } from '@/models/Document';
import { UserModel } from '@/models/User';
import { getTokenFromRequest, verifyAccessToken } from '@/lib/auth';

/**
 * GET /api/documents/[id]/collaborators
 * Returns the list of collaborators for a document (owner only).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const doc = await DocumentModel.findById(id)
      .populate('collaborators.user', 'fullName email profilePicture')
      .lean();

    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.owner?.toString() !== payload.id) {
      return NextResponse.json({ error: 'Only the owner can view collaborators' }, { status: 403 });
    }

    return NextResponse.json({ collaborators: doc.collaborators });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/collaborators
 * Body: { email: string, role: 'editor' | 'viewer' }
 * Adds or updates a collaborator (owner only).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, role } = await req.json();

    if (!email || !['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Email and role (editor|viewer) are required' }, { status: 400 });
    }

    await dbConnect();

    const doc = await DocumentModel.findById(id);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.owner?.toString() !== payload.id) {
      return NextResponse.json({ error: 'Only the owner can manage collaborators' }, { status: 403 });
    }

    const targetUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return NextResponse.json({ error: 'User with that email not found' }, { status: 404 });
    }

    if (targetUser._id.toString() === payload.id) {
      return NextResponse.json({ error: 'You are the owner – you cannot add yourself as a collaborator' }, { status: 400 });
    }

    // Update existing or push new collaborator
    const existingIdx = doc.collaborators.findIndex(
      (c: any) => c.user.toString() === targetUser._id.toString()
    );

    if (existingIdx >= 0) {
      doc.collaborators[existingIdx].role = role;
    } else {
      doc.collaborators.push({ user: targetUser._id, role });
    }

    await doc.save();

    return NextResponse.json({ message: `${targetUser.fullName} added as ${role}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]/collaborators
 * Body: { email: string }
 * Removes a collaborator (owner only).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await dbConnect();

    const doc = await DocumentModel.findById(id);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.owner?.toString() !== payload.id) {
      return NextResponse.json({ error: 'Only the owner can remove collaborators' }, { status: 403 });
    }

    const targetUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    doc.collaborators = doc.collaborators.filter(
      (c: any) => c.user.toString() !== targetUser._id.toString()
    );
    await doc.save();

    return NextResponse.json({ message: 'Collaborator removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
