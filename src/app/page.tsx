import dbConnect from '@/lib/db';
import { DocumentModel } from '@/models/Document';
import { DashboardClient } from '@/components/Dashboard/DashboardClient';
import { getCurrentUserFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getDocuments(userId: string | null) {
  try {
    await dbConnect();

    const query: Record<string, any> = { isDeleted: { $ne: true } };

    if (userId) {
      query.$or = [
        { owner: userId },
        { 'collaborators.user': userId },
      ];
    } else {
      // Not logged in — return nothing
      return [];
    }

    const docs = await DocumentModel.find(query)
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt owner')
      .limit(50)
      .lean();

    return JSON.parse(JSON.stringify(docs));
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUserFromCookies();
  const documents = await getDocuments(currentUser?.id ?? null);
  return <DashboardClient initialDocuments={documents} currentUserId={currentUser?.id ?? null} />;
}

