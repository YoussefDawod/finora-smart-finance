/**
 * @fileoverview SensitiveData Component Tests
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils';
import SensitiveData from './SensitiveData';

describe('SensitiveData', () => {
  it('renders children without blur when active=false', () => {
    render(<SensitiveData active={false}>john@test.com</SensitiveData>);
    const text = screen.getByText('john@test.com');
    expect(text).toBeInTheDocument();
    // Should not have blur class (not wrapped in span with class)
    expect(text.closest('[class*="blurred"]')).toBeNull();
  });

  it('renders children with blur wrapper when active=true', () => {
    render(<SensitiveData active={true}>john@test.com</SensitiveData>);
    const text = screen.getByText('john@test.com');
    expect(text).toBeInTheDocument();
    // Should be wrapped in element with aria-label
    const wrapper = text.closest('span');
    expect(wrapper).toHaveAttribute('aria-label');
    expect(wrapper).toHaveAttribute('title');
  });

  it('renders children directly when active is not provided', () => {
    render(<SensitiveData>visible data</SensitiveData>);
    expect(screen.getByText('visible data')).toBeInTheDocument();
  });

  it('renders JSX children when active', () => {
    render(
      <SensitiveData active={true}>
        <strong>nested content</strong>
      </SensitiveData>
    );
    expect(screen.getByText('nested content')).toBeInTheDocument();
  });
});
