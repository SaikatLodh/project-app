import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { DocumentModel } from '@/models/Document';
import { getTokenFromRequest, verifyAccessToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    await dbConnect();

    // If authenticated, show docs they own or collaborate on
    // If not (shouldn't happen since middleware guards this), show nothing
    const query: Record<string, any> = { isDeleted: { $ne: true } };

    if (payload) {
      query.$or = [
        { owner: payload.id },
        { 'collaborators.user': payload.id },
        { owner: null }, // legacy docs with no owner
      ];
    } else {
      query.owner = null; // only legacy docs for unauthenticated
    }

    const documents = await DocumentModel.find(query)
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt owner collaborators')
      .lean();

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = verifyAccessToken(getTokenFromRequest(req) || '');
    await dbConnect();

    const newDoc = new DocumentModel({
      title: body.title || 'Untitled Document',
      owner: payload?.id || null,
    });

    await newDoc.save();
    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
