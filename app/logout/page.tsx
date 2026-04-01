'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/login' });
  }, []);
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <p className="text-gray-400">Abmelden...</p>
    </div>
  );
}
