import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });

    const { name, email, password, inviteCode } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
    }

    // Check invite code if provided
    if (inviteCode) {
      const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
      if (!invite || !invite.isActive || invite.usedCount >= invite.maxUses) {
        return NextResponse.json({ error: 'Ungültiger oder abgelaufener Einladungscode' }, { status: 400 });
      }
      await prisma.inviteCode.update({
        where: { code: inviteCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'E-Mail bereits registriert' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name: name || null, password: hashedPassword, isAdmin: false, isActive: true },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
}
