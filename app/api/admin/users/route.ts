import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, isAdmin: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    await prisma.$disconnect();
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [] });
  }
}
