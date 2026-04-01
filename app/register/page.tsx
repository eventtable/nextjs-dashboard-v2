'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, User, Key, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/login?registered=1');
      } else {
        setError(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-8 h-8 text-[#f0b90b]" />
            <span className="text-2xl font-bold text-white">Aktien-Börsenprofi</span>
          </div>
          <p className="text-[#f0b90b] font-semibold">Matrix 2.0</p>
        </div>
        <div className="glass-card rounded-2xl p-8 border border-[#1a1f37]">
          <h2 className="text-xl font-bold text-white mb-6">Registrieren</h2>
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: 'Name', icon: User, type: 'text', placeholder: 'Dein Name' },
              { key: 'email', label: 'E-Mail', icon: Mail, type: 'email', placeholder: 'email@example.com' },
              { key: 'password', label: 'Passwort', icon: Lock, type: 'password', placeholder: '••••••••' },
              { key: 'inviteCode', label: 'Einladungscode', icon: Key, type: 'text', placeholder: 'Invite-Code (optional)' },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={key !== 'inviteCode'}
                    className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] transition-colors"
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full bg-[#f0b90b] hover:bg-[#d4a017] disabled:bg-gray-600 text-black font-semibold py-3 rounded-lg transition-colors">
              {loading ? 'Registrieren...' : 'Konto erstellen'}
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-4">
            Bereits registriert?{' '}
            <Link href="/login" className="text-[#f0b90b] hover:underline">Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
