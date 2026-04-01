import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, inviteCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Check invite code if provided
    if (inviteCode) {
      const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
      if (!invite || !invite.isActive || invite.usedCount >= invite.maxUses) {
        await prisma.$disconnect();
        return NextResponse.json({ error: 'Ungültiger oder abgelaufener Einladungscode' }, { status: 400 });
      }
      // Increment usage
      await prisma.inviteCode.update({
        where: { code: inviteCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.$disconnect();
      return NextResponse.json({ error: 'E-Mail bereits registriert' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name: name || null, password: hashedPassword, isAdmin: false, isActive: true },
    });

    await prisma.$disconnect();
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
}
