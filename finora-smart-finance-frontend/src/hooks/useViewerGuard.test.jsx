/**
 * @fileoverview useViewerGuard Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MotionProvider } from '@/context/MotionContext';

// Mock useAuth to control isViewer
const mockAuth = { isViewer: false, isAdmin: true, user: { role: 'admin' } };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

// Capture toast calls
const mockInfo = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ info: mockInfo, success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}));

import { useViewerGuard } from './useViewerGuard';

const wrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <MotionProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </MotionProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('useViewerGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fn when user is NOT a viewer', () => {
    mockAuth.isViewer = false;
    const { result } = renderHook(() => useViewerGuard(), { wrapper });

    const fn = vi.fn();
    act(() => {
      result.current.guard(fn);
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(mockInfo).not.toHaveBeenCalled();
  });

  it('blocks fn and shows info toast when user IS a viewer', () => {
    mockAuth.isViewer = true;
    const { result } = renderHook(() => useViewerGuard(), { wrapper });

    const fn = vi.fn();
    act(() => {
      result.current.guard(fn);
    });

    expect(fn).not.toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalledOnce();
  });

  it('returns isViewer from auth context', () => {
    mockAuth.isViewer = true;
    const { result } = renderHook(() => useViewerGuard(), { wrapper });

    expect(result.current.isViewer).toBe(true);
  });
});
