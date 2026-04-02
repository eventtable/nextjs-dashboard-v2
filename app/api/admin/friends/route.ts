import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      select: { id: true, email: true, name: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const friends = users.map((u: typeof users[number]) => ({
      ...u,
      permissions: { canViewDepot: true, canViewML: false },
    }));
    return NextResponse.json({ friends });
  } catch {
    return NextResponse.json({ friends: [] });
  }
}
