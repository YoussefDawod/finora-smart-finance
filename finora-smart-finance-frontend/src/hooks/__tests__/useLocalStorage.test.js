/**
 * @fileoverview useLocalStorage Hook Tests
 * @description Tests für den useLocalStorage Custom Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  const mockLocalStorage = {
    store: {},
    getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
    setItem: vi.fn((key, value) => {
      mockLocalStorage.store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete mockLocalStorage.store[key];
    }),
    clear: vi.fn(() => {
      mockLocalStorage.store = {};
    }),
  };

  beforeEach(() => {
    mockLocalStorage.store = {};
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  it('should return default value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    
    const [value] = result.current;
    expect(value).toBe('default');
  });

  it('should return stored value when key exists', () => {
    mockLocalStorage.store['existingKey'] = JSON.stringify('storedValue');
    
    const { result } = renderHook(() => useLocalStorage('existingKey', 'default'));
    
    const [value] = result.current;
    expect(value).toBe('storedValue');
  });

  it('should update state and localStorage on setValue', () => {
    const { result } = renderHook(() => useLocalStorage('updateKey', 'initial'));
    
    act(() => {
      const [, setValue] = result.current;
      setValue('updated');
    });

    const [value] = result.current;
    expect(value).toBe('updated');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('updateKey', JSON.stringify('updated'));
  });

  it('should handle function updates like setState', () => {
    const { result } = renderHook(() => useLocalStorage('counterKey', 0));
    
    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    const [value] = result.current;
    expect(value).toBe(1);
  });

  it('should remove value and reset to default on removeValue', () => {
    mockLocalStorage.store['removeKey'] = JSON.stringify('toBeRemoved');
    
    const { result } = renderHook(() => useLocalStorage('removeKey', 'defaultValue'));
    
    // Initially should have stored value
    expect(result.current[0]).toBe('toBeRemoved');
    
    act(() => {
      const [, , removeValue] = result.current;
      removeValue();
    });

    // Should be reset to default
    const [value] = result.current;
    expect(value).toBe('defaultValue');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('removeKey');
  });

  it('should handle complex objects', () => {
    const complexObject = { 
      name: 'Test', 
      count: 42, 
      nested: { a: 1, b: 2 },
      array: [1, 2, 3],
    };
    
    const { result } = renderHook(() => useLocalStorage('complexKey', {}));
    
    act(() => {
      const [, setValue] = result.current;
      setValue(complexObject);
    });

    const [value] = result.current;
    expect(value).toEqual(complexObject);
  });

  it('should handle arrays', () => {
    const { result } = renderHook(() => useLocalStorage('arrayKey', []));
    
    act(() => {
      const [, setValue] = result.current;
      setValue(['a', 'b', 'c']);
    });

    const [value] = result.current;
    expect(value).toEqual(['a', 'b', 'c']);
  });

  it('should handle boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('boolKey', false));
    
    act(() => {
      const [, setValue] = result.current;
      setValue(true);
    });

    const [value] = result.current;
    expect(value).toBe(true);
  });

  it('should handle null values', () => {
    const { result } = renderHook(() => useLocalStorage('nullKey', 'default'));
    
    act(() => {
      const [, setValue] = result.current;
      setValue(null);
    });

    const [value] = result.current;
    expect(value).toBe(null);
  });

  it('should gracefully handle invalid JSON in localStorage', () => {
    mockLocalStorage.store['invalidKey'] = 'not valid json';
    
    // Should not throw, should return default
    const { result } = renderHook(() => useLocalStorage('invalidKey', 'fallback'));
    
    const [value] = result.current;
    expect(value).toBe('fallback');
  });

  it('should handle localStorage errors gracefully', () => {
    const originalSetItem = mockLocalStorage.setItem;
    mockLocalStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceeded');
    });

    const { result } = renderHook(() => useLocalStorage('errorKey', 'initial'));
    
    // Should not throw
    act(() => {
      const [, setValue] = result.current;
      setValue('newValue');
    });

    // State should still update even if localStorage fails
    const [value] = result.current;
    expect(value).toBe('newValue');
    
    mockLocalStorage.setItem = originalSetItem;
  });
});
