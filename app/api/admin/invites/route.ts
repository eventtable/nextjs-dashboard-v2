import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomBytes } from 'crypto';

async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
}

function requireAdmin(session: any) {
  return (session?.user as any)?.isAdmin === true;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  const prisma = await getPrisma();
  try {
    const invites = await prisma.inviteCode.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ invites });
  } catch (e) {
    return NextResponse.json({ error: 'Datenbankfehler', invites: [] }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const maxUses = Number(body.maxUses) || 1;
    // Cryptographically secure 8-char uppercase code
    const code = randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
    const prisma = await getPrisma();
    try {
      const invite = await prisma.inviteCode.create({
        data: { code, maxUses, createdBy: (session?.user as any)?.email ?? 'admin' },
      });
      return NextResponse.json({ invite });
    } finally {
      await prisma.$disconnect();
    }
  } catch (e) {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}

// Deactivate an invite code
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });
  const prisma = await getPrisma();
  try {
    await prisma.inviteCode.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
