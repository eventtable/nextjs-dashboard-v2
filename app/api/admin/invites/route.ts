import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

function requireAdmin(session: any) {
  return (session?.user as any)?.isAdmin === true;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const invites = await prisma.inviteCode.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json({ error: 'Datenbankfehler', invites: [] }, { status: 500 });
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
    const code = randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
    const invite = await prisma.inviteCode.create({
      data: { code, maxUses, createdBy: (session?.user as any)?.email ?? 'admin' },
    });
    return NextResponse.json({ invite });
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });
  try {
    await prisma.inviteCode.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
