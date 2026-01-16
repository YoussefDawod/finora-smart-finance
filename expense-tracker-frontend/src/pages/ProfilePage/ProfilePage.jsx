/**
 * @fileoverview ProfilePage Component
 * @description Benutzerprofil-Verwaltung
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { MainLayout } from '@/components/layout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <MainLayout>
      <section style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1>Profil</h1>
        <p>Verwalten Sie Ihre Benutzerdaten.</p>

        <div style={{ marginTop: 24 }}>
          <div><strong>Name:</strong> {user?.name}</div>
          <div><strong>Email:</strong> {user?.email}</div>
        </div>
      </section>
    </MainLayout>
  );
}
