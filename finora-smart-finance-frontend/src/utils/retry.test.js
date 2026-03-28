/**
 * @fileoverview Retry Utility Tests
 * @description Tests für exponential backoff retry logic
 */

import { describe, it, expect, vi } from 'vitest';
import { retryAsync } from '@/utils/retry';

describe('retryAsync', () => {
  // ──────────────────────────────────────────────────────────
  // Erfolgsfall
  // ──────────────────────────────────────────────────────────
  it('returns result on first successful attempt', async () => {
    const task = vi.fn().mockResolvedValue('success');
    const result = await retryAsync(task);
    expect(result).toBe('success');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('returns result after retry', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

    const result = await retryAsync(task, { retries: 2, delay: 1 });
    expect(result).toBe('ok');
    expect(task).toHaveBeenCalledTimes(2);
  });

  // ──────────────────────────────────────────────────────────
  // Fehlerfall
  // ──────────────────────────────────────────────────────────
  it('throws after exhausting all retries', async () => {
    const error = new Error('persistent failure');
    const task = vi.fn().mockRejectedValue(error);

    await expect(retryAsync(task, { retries: 2, delay: 1 })).rejects.toThrow('persistent failure');
    expect(task).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('respects retries=0 (no retries)', async () => {
    const task = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(retryAsync(task, { retries: 0, delay: 1 })).rejects.toThrow('fail');
    expect(task).toHaveBeenCalledTimes(1);
  });

  // ──────────────────────────────────────────────────────────
  // shouldRetry
  // ──────────────────────────────────────────────────────────
  it('stops retrying when shouldRetry returns false', async () => {
    const task = vi.fn().mockRejectedValue(new Error('not retryable'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(retryAsync(task, { retries: 3, delay: 1, shouldRetry })).rejects.toThrow(
      'not retryable'
    );
    expect(task).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('retries when shouldRetry returns true', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('retryable')).mockResolvedValue('ok');
    const shouldRetry = vi.fn().mockReturnValue(true);

    const result = await retryAsync(task, { retries: 2, delay: 1, shouldRetry });
    expect(result).toBe('ok');
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  // ──────────────────────────────────────────────────────────
  // onRetry callback
  // ──────────────────────────────────────────────────────────
  it('calls onRetry before each retry with context', async () => {
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('err1'))
      .mockRejectedValueOnce(new Error('err2'))
      .mockResolvedValue('ok');
    const onRetry = vi.fn();

    await retryAsync(task, { retries: 3, delay: 10, factor: 2, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(2);
    // First retry: attempt=1, delay=10*2^0=10
    expect(onRetry.mock.calls[0][0]).toEqual(expect.objectContaining({ attempt: 1, delay: 10 }));
    // Second retry: attempt=2, delay=10*2^1=20
    expect(onRetry.mock.calls[1][0]).toEqual(expect.objectContaining({ attempt: 2, delay: 20 }));
  });

  // ──────────────────────────────────────────────────────────
  // Exponential Backoff
  // ──────────────────────────────────────────────────────────
  it('applies exponential backoff with custom factor', async () => {
    vi.useFakeTimers();
    const delays = [];
    const onRetry = ({ delay }) => delays.push(delay);

    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('err'))
      .mockRejectedValueOnce(new Error('err'))
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValue('ok');

    const promise = retryAsync(task, {
      retries: 3,
      delay: 100,
      factor: 3,
      onRetry,
    });

    // Advance through all delays
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(10000);
    }

    await promise;

    // delay * factor^attempt: 100*3^0=100, 100*3^1=300, 100*3^2=900
    expect(delays).toEqual([100, 300, 900]);

    vi.useRealTimers();
  });

  // ──────────────────────────────────────────────────────────
  // Defaults
  // ──────────────────────────────────────────────────────────
  it('uses default options (retries=2, delay=400, factor=2)', async () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();

    const task = vi.fn().mockRejectedValueOnce(new Error('err')).mockResolvedValue('ok');

    const promise = retryAsync(task, { onRetry });

    // Advance past default delay (400ms)
    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0].delay).toBe(400); // 400 * 2^0

    vi.useRealTimers();
  });
});
