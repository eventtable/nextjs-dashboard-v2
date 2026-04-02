import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET — load user's depot positions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { depot: true },
  });

  if (!user) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });

  const positions = user.depot?.positions ? JSON.parse(user.depot.positions) : [];
  return NextResponse.json({ positions });
}

// POST — save full positions array
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const body = await req.json();
  const positions = body.positions ?? [];

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });

  await prisma.depot.upsert({
    where: { userId: user.id },
    update: { positions: JSON.stringify(positions) },
    create: { userId: user.id, positions: JSON.stringify(positions) },
  });

  return NextResponse.json({ ok: true });
}
