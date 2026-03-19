/**
 * @fileoverview AuroraCanvas Component
 * @description Fixed gradient background with optional ambient mesh blobs.
 * Mesh is disabled on mobile and when prefers-reduced-motion is set.
 */

import { useMotion } from '@/hooks/useMotion';
import styles from './AuroraCanvas.module.scss';

export default function AuroraCanvas() {
  const { shouldAnimate } = useMotion();

  return (
    <div className={styles.canvas} aria-hidden="true">
      {shouldAnimate && (
        <>
          <div className={`${styles.blob} ${styles.blob1}`} />
          <div className={`${styles.blob} ${styles.blob2}`} />
          <div className={`${styles.blob} ${styles.blob3}`} />
        </>
      )}
    </div>
  );
}
