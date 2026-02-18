/**
 * @fileoverview Skeleton Component Exports
 * @description Zentrale Exports für alle Skeleton-Varianten
 * 
 * @module components/common/Skeleton
 */

// Base Skeleton
export { default } from './Skeleton';
export { default as Skeleton } from './Skeleton';

// Spezialisierte Varianten
export { default as SkeletonCard } from './SkeletonCard';
export { default as SkeletonTableRow } from './SkeletonTableRow';
export { default as SkeletonChart } from './SkeletonChart';
export { default as AuthPageSkeleton } from './AuthPageSkeleton';
export { default as PageFallback } from './PageFallback';
export { ContentPageFallback, DashboardFallback, TransactionsFallback, SettingsFallback } from './PageFallback';
