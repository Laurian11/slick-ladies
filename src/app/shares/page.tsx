'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const SHARE_PRICE = 25000;
const ADMIN_ROLES = ['secretary', 'treasurer', 'chairperson'];

export default function SharesPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ member_id: '', num_shares: 1 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        setRole(profile?.role || null);
        if (ADMIN_ROLES.includes(profile?.role)) {
          fetchAllShares();
          fetchProfiles();
        } else {
          fetchMyShares(data.user.id);
        }
      }
    });
  }, []);

  async function fetchAllShares() {
    setLoading(true);
    const { data } = await supabase.from('shares').select('*, profiles(full_name)').order('purchase_date', { ascending: false });
    setShares(data || []);
    setLoading(false);
  }

  async function fetchMyShares(userId: string) {
    setLoading(true);
    const { data } = await supabase.from('shares').select('*').eq('member_id', userId).order('purchase_date', { ascending: false });
    setShares(data || []);
    setLoading(false);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
    setProfiles(data || []);
  }

  async function handleAddShare(e: React.FormEvent) {
    e.preventDefault();
    if (!form.member_id || !form.num_shares) return;
    setLoading(true);
    await supabase.from('shares').insert({
      member_id: form.member_id,
      num_shares: form.num_shares,
      amount: form.num_shares * SHARE_PRICE,
      created_by: user.id
    });
    setForm({ member_id: '', num_shares: 1 });
    fetchAllShares();
    setLoading(false);
  }

  const isAdmin = ADMIN_ROLES.includes(role || '');

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>Shares Management</h2>
      {isAdmin && (
        <form onSubmit={handleAddShare} style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 32 }}>
          <label>
            Member
            <select value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))} style={{ width: 180, padding: 8, marginTop: 4 }} required>
              <option value="">Select member</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </label>
          <label>
            Number of Shares
            <input type="number" min={1} value={form.num_shares} onChange={e => setForm(f => ({ ...f, num_shares: Number(e.target.value) }))} style={{ width: 120, padding: 8, marginTop: 4 }} required />
          </label>
          <button type="submit" style={{ padding: '10px 24px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Add Share</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            {isAdmin && <th style={{ padding: 8, border: '1px solid #eee' }}>Member</th>}
            <th style={{ padding: 8, border: '1px solid #eee' }}>Number of Shares</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Amount (TZS)</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Purchase Date</th>
          </tr>
        </thead>
        <tbody>
          {shares.map(s => (
            <tr key={s.id}>
              {isAdmin && <td style={{ padding: 8, border: '1px solid #eee' }}>{s.profiles?.full_name || s.member_id}</td>}
              <td style={{ padding: 8, border: '1px solid #eee' }}>{s.num_shares}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{s.amount.toLocaleString()}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{s.purchase_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
} 