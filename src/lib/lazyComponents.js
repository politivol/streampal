import React, { lazy } from 'react';

// Code splitting for heavy components
export const LazyFilterPanel = lazy(() => import('../components/FilterPanel.jsx'));
export const LazySeenList = lazy(() => import('../components/SeenList.jsx'));
export const LazySeriesPanel = lazy(() => import('../components/SeriesPanel.jsx'));
export const LazyAuthPanel = lazy(() => import('../components/AuthPanel.jsx'));

// Higher-order component for loading states
export function withSuspense(Component, fallback = null) {
  return function SuspenseWrapper(props) {
    return (
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        <Component {...props} />
      </React.Suspense>
    );
  };
}
