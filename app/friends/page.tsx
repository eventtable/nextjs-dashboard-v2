'use client';

import { useState } from 'react';
import { Activity, UserPlus, Key, AlertCircle, CheckCircle } from 'lucide-react';

export default function FriendsPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Konto erfolgreich erstellt! Du kannst dich jetzt anmelden.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch {
      setStatus('error');
      setMessage('Netzwerkfehler');
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
          <p className="text-[#f0b90b] font-semibold">Freunde-Registrierung</p>
        </div>
        <div className="glass-card rounded-2xl p-8 border border-[#1a1f37]">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-[#f0b90b]" />
            <h2 className="text-xl font-bold text-white">Mit Einladungscode registrieren</h2>
          </div>
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-5 text-sm">
              <CheckCircle className="w-4 h-4" />{message}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4" />{message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'inviteCode', label: 'Einladungscode', icon: Key, type: 'text', placeholder: 'Deinen Code hier eingeben' },
              { key: 'name', label: 'Name', icon: UserPlus, type: 'text', placeholder: 'Dein Name' },
              { key: 'email', label: 'E-Mail', type: 'email', placeholder: 'deine@email.de' },
              { key: 'password', label: 'Passwort', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(({ inviteCode, name, email, password } as any)[key])}
                  onChange={(e) => {
                    if (key === 'inviteCode') setInviteCode(e.target.value);
                    if (key === 'name') setName(e.target.value);
                    if (key === 'email') setEmail(e.target.value);
                    if (key === 'password') setPassword(e.target.value);
                  }}
                  required
                  className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] transition-colors"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d4a017] text-black font-semibold py-3 rounded-lg transition-colors">
              Konto erstellen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
