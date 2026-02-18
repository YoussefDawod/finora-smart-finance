/**
 * @fileoverview SkeletonChart - Wiederverwendbares Chart-Skeleton
 * @description Für DashboardCharts (Pie, Bar, Line)
 * 
 * @module components/common/Skeleton/SkeletonChart
 */

import { memo } from 'react';
import Skeleton from './Skeleton';
import styles from './SkeletonChart.module.scss';

/**
 * Chart Skeleton für verschiedene Diagrammtypen
 * @param {'pie'|'bar'|'line'|'donut'} [variant='bar'] - Chart-Typ
 * @param {boolean} [hasTitle=true] - Titel-Platzhalter anzeigen
 * @param {boolean} [hasLegend=true] - Legende-Platzhalter anzeigen
 * @param {string} [height='200px'] - Chart-Höhe
 */
const SkeletonChart = memo(({
  variant = 'bar',
  hasTitle = true,
  hasLegend = true,
  height = '200px',
  className = '',
}) => {
  const renderChartContent = () => {
    switch (variant) {
      case 'pie':
      case 'donut':
        return (
          <div className={styles.pieContainer}>
            <Skeleton 
              variant="circle" 
              width="160px" 
              height="160px" 
            />
          </div>
        );
      
      case 'line':
        return (
          <div className={styles.lineContainer}>
            <div className={styles.lineY}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} width="30px" height="10px" variant="text" />
              ))}
            </div>
            <div className={styles.lineChart}>
              <Skeleton width="100%" height="100%" variant="rect" />
            </div>
          </div>
        );
      
      case 'bar':
      default:
        return (
          <div className={styles.barContainer}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.barColumn}>
                <Skeleton 
                  width="100%" 
                  height={`${30 + Math.random() * 70}%`} 
                  variant="rect" 
                />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* Header */}
      {hasTitle && (
        <div className={styles.header}>
          <Skeleton width="120px" height="20px" variant="text" />
        </div>
      )}
      
      {/* Chart Area */}
      <div className={styles.chartArea} style={{ height }}>
        {renderChartContent()}
      </div>
      
      {/* Legend */}
      {hasLegend && (
        <div className={styles.legend}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.legendItem}>
              <Skeleton variant="circle" width="12px" height="12px" />
              <Skeleton width="60px" height="12px" variant="text" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SkeletonChart.displayName = 'SkeletonChart';

export default SkeletonChart;
