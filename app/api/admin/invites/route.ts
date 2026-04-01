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
    const invites = await prisma.inviteCode.findMany({ orderBy: { createdAt: 'desc' } });
    await prisma.$disconnect();
    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json({ invites: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const { maxUses = 5 } = await req.json();
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const invite = await prisma.inviteCode.create({
      data: { code, maxUses, createdBy: (session?.user as any)?.email ?? 'admin' },
    });
    await prisma.$disconnect();
    return NextResponse.json({ invite });
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}
