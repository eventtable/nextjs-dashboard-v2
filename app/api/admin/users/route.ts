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
      select: { id: true, email: true, name: true, isAdmin: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body?.id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });

    const data: Record<string, boolean> = {};
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (typeof body.isAdmin  === 'boolean') data.isAdmin  = body.isAdmin;

    const user = await prisma.user.update({ where: { id: body.id }, data });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}
