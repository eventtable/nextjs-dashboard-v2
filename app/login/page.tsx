'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('E-Mail oder Passwort falsch.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-8 h-8 text-[#f0b90b]" />
            <span className="text-2xl font-bold text-white">Aktien-Börsenprofi</span>
          </div>
          <p className="text-[#f0b90b] font-semibold">Matrix 2.0</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-[#1a1f37]">
          <h2 className="text-xl font-bold text-white mb-6">Anmelden</h2>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] transition-colors"
                  placeholder="frank@dashboard.local"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f0b90b] hover:bg-[#d4a017] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
