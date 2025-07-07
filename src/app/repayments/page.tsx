'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const ADMIN_ROLES = ['treasurer', 'chairperson', 'secretary'];
const STATUS_OPTIONS = ['pending', 'verified', 'rejected'];

export default function RepaymentsPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ loan_id: '', amount: '', receipt_url: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        setRole(profile?.role || null);
        if (ADMIN_ROLES.includes(profile?.role)) {
          fetchAllRepayments();
        } else {
          fetchMyRepayments(data.user.id);
          fetchMyLoans(data.user.id);
        }
      }
    });
    // eslint-disable-next-line
  }, []);

  async function fetchAllRepayments() {
    setLoading(true);
    const { data } = await supabase.from('loan_repayments').select('*, loans(amount), profiles(full_name)').order('paid_at', { ascending: false });
    setRepayments(data || []);
    setLoading(false);
  }

  async function fetchMyRepayments(userId: string) {
    setLoading(true);
    const { data } = await supabase.from('loan_repayments').select('*, loans(amount)').eq('member_id', userId).order('paid_at', { ascending: false });
    setRepayments(data || []);
    setLoading(false);
  }

  async function fetchMyLoans(userId: string) {
    const { data } = await supabase.from('loans').select('id, amount, status').eq('member_id', userId).eq('status', 'active');
    setLoans(data || []);
  }

  async function handleUploadRepayment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.loan_id || !form.amount || !form.receipt_url) return;
    setUploading(true);
    await supabase.from('loan_repayments').insert({
      loan_id: form.loan_id,
      member_id: user.id,
      amount: form.amount,
      receipt_url: form.receipt_url
    });
    setForm({ loan_id: '', amount: '', receipt_url: '' });
    fetchMyRepayments(user.id);
    setUploading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    setLoading(true);
    await supabase.from('loan_repayments').update({
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    }).eq('id', id);
    fetchAllRepayments();
    setLoading(false);
  }

  const isAdmin = ADMIN_ROLES.includes(role || '');

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>Loan Repayments</h2>
      {!isAdmin && (
        <form onSubmit={handleUploadRepayment} style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 32 }}>
          <label>
            Loan
            <select value={form.loan_id} onChange={e => setForm(f => ({ ...f, loan_id: e.target.value }))} style={{ width: 200, padding: 8, marginTop: 4 }} required>
              <option value="">Select loan</option>
              {loans.map(l => <option key={l.id} value={l.id}>Loan {l.id.slice(0, 6)} - {l.amount}</option>)}
            </select>
          </label>
          <label>
            Amount
            <input type="number" min={1} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ width: 120, padding: 8, marginTop: 4 }} required />
          </label>
          <label>
            Receipt URL
            <input type="text" value={form.receipt_url} onChange={e => setForm(f => ({ ...f, receipt_url: e.target.value }))} style={{ width: 200, padding: 8, marginTop: 4 }} required />
          </label>
          <button type="submit" style={{ padding: '10px 24px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Repayment'}</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            {isAdmin && <th style={{ padding: 8, border: '1px solid #eee' }}>Member</th>}
            <th style={{ padding: 8, border: '1px solid #eee' }}>Loan</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Amount</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Receipt</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Paid At</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {repayments.map(r => (
            <tr key={r.id}>
              {isAdmin && <td style={{ padding: 8, border: '1px solid #eee' }}>{r.profiles?.full_name || r.member_id}</td>}
              <td style={{ padding: 8, border: '1px solid #eee' }}>{r.loan_id}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{r.amount}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{r.receipt_url ? <a href={r.receipt_url} target="_blank" rel="noopener noreferrer">View</a> : '-'}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{r.paid_at}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>
                {isAdmin ? (
                  <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  r.status
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
} 