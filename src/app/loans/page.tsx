'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const ADMIN_ROLES = ['secretary', 'chairperson', 'treasurer'];
const LOAN_STATUSES = ['pending', 'verified', 'approved', 'rejected', 'active', 'paid', 'late'];

export default function LoansPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', referees: [] as string[] });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        setRole(profile?.role || null);
        if (ADMIN_ROLES.includes(profile?.role)) {
          fetchAllLoans();
          fetchProfiles();
        } else {
          fetchMyLoans(data.user.id);
          fetchProfiles();
        }
      }
    });
  }, []);

  async function fetchAllLoans() {
    setLoading(true);
    const { data } = await supabase.from('loans').select('*, profiles(full_name)').order('applied_at', { ascending: false });
    setLoans(data || []);
    setLoading(false);
  }

  async function fetchMyLoans(userId: string) {
    setLoading(true);
    const { data } = await supabase.from('loans').select('*').eq('member_id', userId).order('applied_at', { ascending: false });
    setLoans(data || []);
    setLoading(false);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
    setProfiles(data || []);
  }

  async function handleApplyLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.amount || form.referees.length === 0) return;
    setLoading(true);
    await supabase.from('loans').insert({
      member_id: user.id,
      amount: form.amount,
      referees: form.referees,
      created_by: user.id
    });
    setForm({ amount: '', referees: [] });
    fetchMyLoans(user.id);
    setLoading(false);
  }

  async function handleVerifyLoan(id: string) {
    if (!user) return;
    setLoading(true);
    await supabase.from('loans').update({
      status: 'verified',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    }).eq('id', id);
    fetchAllLoans();
    setLoading(false);
  }

  async function handleApproveLoan(id: string) {
    if (!user) return;
    setLoading(true);
    await supabase.from('loans').update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    }).eq('id', id);
    fetchAllLoans();
    setLoading(false);
  }

  async function handleRejectLoan(id: string) {
    const reason = prompt('Enter rejection reason:');
    if (!user || !reason) return;
    setLoading(true);
    await supabase.from('loans').update({
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    }).eq('id', id);
    fetchAllLoans();
    setLoading(false);
  }

  async function handleDisburseLoan(id: string) {
    if (!user) return;
    const amount = prompt('Enter disbursed amount:');
    if (!amount) return;
    setLoading(true);
    await supabase.from('loans').update({
      status: 'active',
      disbursed_by: user.id,
      disbursed_at: new Date().toISOString(),
      disbursed_amount: amount,
    }).eq('id', id);
    fetchAllLoans();
    setLoading(false);
  }

  const isAdmin = ADMIN_ROLES.includes(role || '');
  const isSecretary = role === 'secretary';
  const isChairperson = role === 'chairperson';
  const isTreasurer = role === 'treasurer';

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>Loans Management</h2>
      {!isAdmin && (
        <form onSubmit={handleApplyLoan} style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 32 }}>
          <label>
            Amount
            <input type="number" min={1} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ width: 120, padding: 8, marginTop: 4 }} required />
          </label>
          <label>
            Referees
            <select multiple value={form.referees} onChange={e => setForm(f => ({ ...f, referees: Array.from(e.target.selectedOptions, o => o.value) }))} style={{ width: 200, padding: 8, marginTop: 4 }} required>
              {profiles.filter(p => p.id !== user?.id).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </label>
          <button type="submit" style={{ padding: '10px 24px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Apply for Loan</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            {isAdmin && <th style={{ padding: 8, border: '1px solid #eee' }}>Member</th>}
            <th style={{ padding: 8, border: '1px solid #eee' }}>Amount</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Status</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Applied At</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Referees</th>
            {isSecretary && <th style={{ padding: 8, border: '1px solid #eee' }}>Actions</th>}
            {isChairperson && <th style={{ padding: 8, border: '1px solid #eee' }}>Actions</th>}
            {isTreasurer && <th style={{ padding: 8, border: '1px solid #eee' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loans.map(l => (
            <tr key={l.id}>
              {isAdmin && <td style={{ padding: 8, border: '1px solid #eee' }}>{l.profiles?.full_name || l.member_id}</td>}
              <td style={{ padding: 8, border: '1px solid #eee' }}>{l.amount}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{l.status}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{l.applied_at ? new Date(l.applied_at).toLocaleString() : ''}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{Array.isArray(l.referees) ? l.referees.map((r: string) => {
                const p = profiles.find(p => p.id === r);
                return p ? p.full_name : r;
              }).join(', ') : ''}</td>
              {isSecretary && (
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  {l.status === 'pending' && (
                    <button onClick={() => handleVerifyLoan(l.id)} style={{ padding: '6px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Verify</button>
                  )}
                </td>
              )}
              {isChairperson && (
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  {l.status === 'verified' && (
                    <>
                      <button onClick={() => handleApproveLoan(l.id)} style={{ padding: '6px 12px', background: 'green', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', marginRight: 8 }}>Approve</button>
                      <button onClick={() => handleRejectLoan(l.id)} style={{ padding: '6px 12px', background: 'red', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Reject</button>
                    </>
                  )}
                  {l.status === 'rejected' && l.rejection_reason && (
                    <span style={{ color: 'red' }}>Reason: {l.rejection_reason}</span>
                  )}
                </td>
              )}
              {isTreasurer && (
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  {l.status === 'approved' && (
                    <button onClick={() => handleDisburseLoan(l.id)} style={{ padding: '6px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Disburse</button>
                  )}
                  {l.status === 'active' && l.disbursed_amount && (
                    <span style={{ color: 'green' }}>Disbursed: {l.disbursed_amount}</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
} 