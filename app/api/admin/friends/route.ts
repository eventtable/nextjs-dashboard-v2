import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Friends = all registered (non-admin) DB users
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      select: { id: true, email: true, name: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    await prisma.$disconnect();
    // Map to the shape the frontend expects
    const friends = users.map(u => ({
      ...u,
      permissions: { canViewDepot: true, canViewML: false },
    }));
    return NextResponse.json({ friends });
  } catch {
    return NextResponse.json({ friends: [] });
  }
}
