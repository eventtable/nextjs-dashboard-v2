import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  const prisma = await getPrisma();
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, isAdmin: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [] });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const { id, isActive, isAdmin } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });

    const data: Record<string, boolean> = {};
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (typeof isAdmin  === 'boolean') data.isAdmin  = isAdmin;

    const prisma = await getPrisma();
    try {
      const user = await prisma.user.update({ where: { id }, data });
      return NextResponse.json({ user });
    } finally {
      await prisma.$disconnect();
    }
  } catch {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}
