import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DocumentModel } from '@/models/Document';
import { VersionModel } from '@/models/Version';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const versions = await VersionModel.find({ documentId: id }).sort({ createdAt: -1 });
    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await req.json();
    await dbConnect();
    
    // Get the current document state
    const document = await DocumentModel.findById(id);
    if (!document || !document.content) {
      return NextResponse.json({ error: 'Document not found or empty' }, { status: 404 });
    }

    // Create a new version
    const newVersion = new VersionModel({
      documentId: id,
      name: name || `Version ${new Date().toLocaleString()}`,
      content: document.content
    });

    await newVersion.save();
    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
