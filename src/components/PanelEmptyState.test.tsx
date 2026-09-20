import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PanelEmptyState } from './PanelEmptyState';

describe('PanelEmptyState', () => {
  it('renders a loading indicator', () => {
    render(<PanelEmptyState kind="loading" emptyMessage="Nothing here" />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders the empty message', () => {
    render(<PanelEmptyState kind="empty" emptyMessage="No work orders" />);
    expect(screen.getByText('No work orders')).toBeInTheDocument();
  });

  it('renders a no-access message distinct from a generic error', () => {
    render(<PanelEmptyState kind="no-access" emptyMessage="No work orders" />);
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
  });

  it('renders an error with a retry control that calls onRetry', async () => {
    const onRetry = vi.fn();
    render(<PanelEmptyState kind="error" emptyMessage="No work orders" errorMessage="Network down" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
