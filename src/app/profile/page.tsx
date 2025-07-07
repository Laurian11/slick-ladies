'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const ROLES = ['member', 'secretary', 'treasurer', 'chairperson'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', phone: '', national_id: '', status: '', role: 'member' });
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchProfile(data.user.id);
    });
  }, []);

  async function fetchProfile(userId: string) {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        national_id: data.national_id || '',
        status: data.status || '',
        role: data.role || 'member',
      });
      setIsAdmin(data.role === 'chairperson' || data.role === 'secretary');
    }
    setLoading(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const updates = { ...form, id: user.id };
    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) fetchProfile(user.id);
    setLoading(false);
  }

  if (!user) return <main style={{ padding: 32 }}>Please log in to view your profile.</main>;
  if (loading) return <main style={{ padding: 32 }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>My Profile</h2>
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          Full Name
          <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </label>
        <label>
          Phone
          <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </label>
        <label>
          National ID
          <input type="text" value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </label>
        <label>
          Status
          <input type="text" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </label>
        <label>
          Role
          {isAdmin ? (
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 4 }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : (
            <input type="text" value={form.role} readOnly style={{ width: '100%', padding: 8, marginTop: 4, background: '#f5f5f5' }} />
          )}
        </label>
        <button type="submit" style={{ padding: '10px 0', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Update Profile</button>
      </form>
    </main>
  );
} 