/**
 * @fileoverview SkeletonTableRow - Wiederverwendbares Table-Row-Skeleton
 * @description Für TransactionList und andere Tabellen-Layouts
 * 
 * @module components/common/Skeleton/SkeletonTableRow
 */

import { memo } from 'react';
import Skeleton from './Skeleton';
import styles from './SkeletonTableRow.module.scss';

/**
 * Table Row Skeleton für Listen
 * @param {number} [columns=5] - Anzahl der Spalten
 * @param {boolean} [hasIcon=true] - Icon/Avatar in erster Spalte
 * @param {number} [count=1] - Anzahl der Zeilen
 * @param {'compact'|'normal'|'spacious'} [density='normal'] - Zeilenhöhe
 */
const SkeletonTableRow = memo(({
  columns = 5,
  hasIcon = true,
  count = 1,
  density = 'normal',
  className = '',
}) => {
  const heights = {
    compact: '40px',
    normal: '56px',
    spacious: '72px',
  };
  
  const rowHeight = heights[density];
  
  // Spaltenbreiten-Verteilung (prozentual)
  const getColumnWidth = (index, total) => {
    if (index === 0 && hasIcon) return '15%';
    if (index === total - 1) return '10%'; // Actions
    return `${60 / (total - 2)}%`;
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {Array.from({ length: count }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className={`${styles.row} ${styles[density]}`}
          style={{ minHeight: rowHeight }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className={styles.cell}
              style={{ width: getColumnWidth(colIndex, columns) }}
            >
              {colIndex === 0 && hasIcon ? (
                <div className={styles.iconCell}>
                  <Skeleton variant="circle" width="36px" height="36px" />
                  <Skeleton width="80px" height="14px" variant="text" />
                </div>
              ) : colIndex === columns - 1 ? (
                <Skeleton width="60px" height="28px" variant="rect" />
              ) : (
                <Skeleton 
                  width={colIndex === 1 ? '120px' : '70px'} 
                  height="16px" 
                  variant="text" 
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

SkeletonTableRow.displayName = 'SkeletonTableRow';

export default SkeletonTableRow;
