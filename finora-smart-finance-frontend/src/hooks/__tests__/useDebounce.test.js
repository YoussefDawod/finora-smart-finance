/**
 * @fileoverview useDebounce Hook Tests
 * @description Tests für den useDebounce Custom Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated' });

    // Should still be initial immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should now be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    // Rapid changes
    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    rerender({ value: 'd' });

    // Value should still be 'a' since no timeout completed
    expect(result.current).toBe('a');

    // Fast-forward full delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be final value 'd'
    expect(result.current).toBe('d');
  });

  it('should call callback after debounce', async () => {
    const callback = vi.fn();
    
    renderHook(
      ({ value }) => useDebounce(value, 300, callback),
      { initialProps: { value: 'test' } }
    );

    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Callback should be called with value
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Not updated before 300ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Updated after 300ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle different value types', () => {
    // Test with numbers
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );

    rerenderNumber({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(numberResult.current).toBe(42);

    // Test with objects
    const { result: objResult, rerender: rerenderObj } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { a: 1 } } }
    );

    const newObj = { b: 2 };
    rerenderObj({ value: newObj });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(objResult.current).toEqual({ b: 2 });
  });
});
