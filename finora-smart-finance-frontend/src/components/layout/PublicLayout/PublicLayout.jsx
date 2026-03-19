import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PublicNav from './PublicNav';
import Footer from '@/components/layout/Footer/Footer';
import BrandingBackground from '@/components/common/BrandingBackground/BrandingBackground';
import styles from './PublicLayout.module.scss';

export default function PublicLayout({ children, variant = 'product' }) {
  const showBackground = true;

  // Setzt Aurora-Gradient als tatsächlichen html-Hintergrund — identisches Muster
  // wie page-dashboard. Macht body/#root transparent, sodass var(--bg) nicht durchscheint.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('page-public-product');
    return () => root.classList.remove('page-public-product');
  }, [variant]);

  return (
    <div className={`${styles.layout} ${styles[variant]}`}>
      <PublicNav />
      {showBackground && <BrandingBackground />}
      <main className={styles.main}>{children || <Outlet />}</main>
      <Footer isMobile />
    </div>
  );
}
