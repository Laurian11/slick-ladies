'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const ADMIN_ROLES = ['chairperson', 'secretary', 'treasurer'];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<any>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        setRole(profile?.role || null);
        if (ADMIN_ROLES.includes(profile?.role)) {
          await fetchAdminWidgets();
        } else {
          await fetchMemberWidgets(data.user.id);
        }
      }
      setLoading(false);
    });
  }, []);

  async function fetchMemberWidgets(userId: string) {
    const [{ data: shares }, { data: loans }, { data: penalties }, { data: jamii }] = await Promise.all([
      supabase.from('shares').select('num_shares, amount').eq('member_id', userId),
      supabase.from('loans').select('amount, status').eq('member_id', userId),
      supabase.from('penalties').select('amount, status').eq('member_id', userId),
      supabase.from('jamii_contributions').select('amount, status, month_year').eq('member_id', userId)
    ]);
    setWidgets({
      shares: shares?.reduce((acc, s) => acc + (s.amount || 0), 0) || 0,
      num_shares: shares?.reduce((acc, s) => acc + (s.num_shares || 0), 0) || 0,
      outstandingLoan: loans?.filter(l => l.status === 'active').reduce((acc, l) => acc + (l.amount || 0), 0) || 0,
      penalties: penalties?.filter(p => p.status !== 'paid').reduce((acc, p) => acc + (p.amount || 0), 0) || 0,
      jamiiUnpaid: jamii?.filter(j => j.status !== 'paid').length || 0
    });
  }

  async function fetchAdminWidgets() {
    const [{ data: shares }, { data: loans }, { data: penalties }, { data: jamii }] = await Promise.all([
      supabase.from('shares').select('amount'),
      supabase.from('loans').select('amount, status'),
      supabase.from('penalties').select('amount, status'),
      supabase.from('jamii_contributions').select('amount, status')
    ]);
    setWidgets({
      totalShares: shares?.reduce((acc, s) => acc + (s.amount || 0), 0) || 0,
      activeLoans: loans?.filter(l => l.status === 'active').length || 0,
      outstandingDebt: loans?.filter(l => l.status === 'active').reduce((acc, l) => acc + (l.amount || 0), 0) || 0,
      unpaidPenalties: penalties?.filter(p => p.status !== 'paid').reduce((acc, p) => acc + (p.amount || 0), 0) || 0,
      unpaidJamii: jamii?.filter(j => j.status !== 'paid').length || 0
    });
  }

  if (loading) return <main style={{ padding: 32 }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>Dashboard</h2>
      {ADMIN_ROLES.includes(role || '') ? (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Widget title="Total Shares (TZS)" value={widgets.totalShares?.toLocaleString()} />
          <Widget title="Active Loans" value={widgets.activeLoans} />
          <Widget title="Outstanding Debt (TZS)" value={widgets.outstandingDebt?.toLocaleString()} />
          <Widget title="Unpaid Penalties (TZS)" value={widgets.unpaidPenalties?.toLocaleString()} />
          <Widget title="Unpaid Jamii Contributions" value={widgets.unpaidJamii} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Widget title="My Shares (TZS)" value={widgets.shares?.toLocaleString()} />
          <Widget title="Number of Shares" value={widgets.num_shares} />
          <Widget title="Outstanding Loan (TZS)" value={widgets.outstandingLoan?.toLocaleString()} />
          <Widget title="Unpaid Penalties (TZS)" value={widgets.penalties?.toLocaleString()} />
          <Widget title="Unpaid Jamii Contributions" value={widgets.jamiiUnpaid} />
        </div>
      )}
    </main>
  );
}

function Widget({ title, value }: { title: string; value: any }) {
  return (
    <div style={{ flex: 1, minWidth: 180, background: '#f5faff', border: '1px solid #cce0ff', borderRadius: 8, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#0070f3', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
} 