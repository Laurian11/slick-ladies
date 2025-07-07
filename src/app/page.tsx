'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        {/* Placeholder logo as SVG */}
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" stroke="#0070f3" strokeWidth="4" fill="#e6f0fa" />
          <text x="50%" y="54%" textAnchor="middle" fill="#0070f3" fontSize="32" fontFamily="Arial" dy=".3em">SL</text>
        </svg>
      </div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0070f3', marginBottom: '0.5rem' }}>Slick Laids</h1>
      <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '2rem' }}>Your cooperative share and loan management system.</p>
      {user ? (
        <>
          <p style={{ color: '#0070f3', marginBottom: '1rem' }}>Welcome, {user.email}!</p>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1.5rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </>
      ) : (
        <a href="/auth" style={{ padding: '0.5rem 1.5rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>Login / Sign Up</a>
      )}
    </main>
  );
} 