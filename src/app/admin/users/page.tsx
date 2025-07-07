'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const ROLES = ['member', 'secretary', 'treasurer', 'chairperson'];

export default function AdminUsersPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchMyProfile(data.user.id);
    });
  }, []);

  async function fetchMyProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data && (data.role === 'chairperson' || data.role === 'secretary')) {
      setIsAdmin(true);
      fetchAllUsers();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }

  async function fetchAllUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    setUsers(data || []);
    setLoading(false);
  }

  async function handleUpdate(id: string, field: string, value: string) {
    setLoading(true);
    await supabase.from('profiles').update({ [field]: value }).eq('id', id);
    fetchAllUsers();
  }

  if (!user) return <main style={{ padding: 32 }}>Please log in as an admin to view this page.</main>;
  if (loading) return <main style={{ padding: 32 }}>Loading...</main>;
  if (!isAdmin) return <main style={{ padding: 32 }}>You do not have permission to view this page.</main>;

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>All Users</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Full Name</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Email</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Role</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Status</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Phone</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>National ID</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{u.full_name}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{u.email || u.id}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>
                <select value={u.role} onChange={e => handleUpdate(u.id, 'role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>
                <select value={u.status} onChange={e => handleUpdate(u.id, 'status', e.target.value)}>
                  {['active', 'inactive', 'suspended'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{u.phone}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{u.national_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
} 