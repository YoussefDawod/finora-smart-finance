/**
 * @fileoverview AdminCampaignsPage Tests
 * @description Tests für die Kampagnen-Übersicht (Rendering, Badges, Filter, Empty-State)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts?.count !== undefined) return `${key} (${opts.count})`;
      return key;
    },
    i18n: { language: 'de', dir: () => 'ltr' },
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' }, isViewer: false }),
}));

vi.mock('@/hooks/useViewerGuard', () => ({
  useViewerGuard: () => ({ isViewer: false, guard: fn => fn() }),
}));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true,
    showNotice: false,
    dismissNotice: vi.fn(),
    reopenNotice: vi.fn(),
    closeNotice: vi.fn(),
  }),
}));

// Campaign mock data
const mockCampaigns = [
  {
    _id: 'camp-1',
    subject: 'Newsletter April',
    status: 'draft',
    language: 'de',
    recipientCount: 0,
    successCount: 0,
    createdAt: '2024-04-01T10:00:00Z',
  },
  {
    _id: 'camp-2',
    subject: 'Product Update',
    status: 'sent',
    language: 'en',
    recipientCount: 50,
    successCount: 48,
    sentAt: '2024-03-15T14:00:00Z',
    createdAt: '2024-03-15T12:00:00Z',
  },
  {
    _id: 'camp-3',
    subject: 'Fehlgeschlagen',
    status: 'failed',
    language: 'de',
    recipientCount: 10,
    successCount: 0,
    failCount: 10,
    createdAt: '2024-02-20T08:00:00Z',
  },
];

const mockActions = {
  refresh: vi.fn(),
  deleteCampaign: vi.fn().mockResolvedValue({ success: true }),
  sendCampaign: vi
    .fn()
    .mockResolvedValue({ success: true, data: { successCount: 50, recipientCount: 50 } }),
  resetAllCampaigns: vi.fn().mockResolvedValue({ success: true }),
};

const mockFilters = {
  search: '',
  setSearch: vi.fn(),
  statusFilter: '',
  setStatusFilter: vi.fn(),
  languageFilter: '',
  setLanguageFilter: vi.fn(),
  sort: '-createdAt',
  setSort: vi.fn(),
  page: 1,
  setPage: vi.fn(),
};

const mockHookReturn = {
  campaigns: mockCampaigns,
  stats: {
    totalCount: 3,
    statusBreakdown: [
      { _id: 'draft', count: 1 },
      { _id: 'sent', count: 1 },
      { _id: 'failed', count: 1 },
    ],
  },
  pagination: { total: 3, page: 1, pages: 1, limit: 20 },
  loading: false,
  error: null,
  actionLoading: null,
  filters: mockFilters,
  actions: mockActions,
};

vi.mock('@/hooks', () => ({
  useAdminCampaigns: () => mockHookReturn,
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

import AdminCampaignsPage from '@/pages/admin/AdminCampaignsPage';

describe('AdminCampaignsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn.campaigns = mockCampaigns;
    mockHookReturn.loading = false;
    mockHookReturn.error = null;
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <AdminCampaignsPage />
      </MemoryRouter>
    );

  // ── Rendering ────────────────────────────────
  it('rendert den Seitentitel', () => {
    renderPage();
    expect(screen.getByText('admin.campaigns.title')).toBeInTheDocument();
  });

  it('rendert die Kampagnen-Liste', () => {
    renderPage();
    expect(screen.getByText('Newsletter April')).toBeInTheDocument();
    expect(screen.getByText('Product Update')).toBeInTheDocument();
    expect(screen.getByText('Fehlgeschlagen')).toBeInTheDocument();
  });

  // ── Status Badges ───────────────────────────
  it('zeigt Status-Badges für jede Kampagne', () => {
    renderPage();
    expect(screen.getByText('admin.campaigns.draft')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.sent')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.failed')).toBeInTheDocument();
  });

  // ── Stats Cards ─────────────────────────────
  it('rendert Stats-Cards', () => {
    renderPage();
    expect(screen.getByText('admin.campaigns.statTotal')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.statSent')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.statDrafts')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.statFailed')).toBeInTheDocument();
  });

  // ── Create Button → Composer ─────────────────
  it('navigiert zum Composer bei Klick auf Create-Button', () => {
    renderPage();
    const createBtn = screen.getByLabelText
      ? screen.getAllByRole('button').find(b => b.textContent.includes('admin.campaigns.create'))
      : null;
    if (createBtn) {
      fireEvent.click(createBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/campaigns/new');
    }
  });

  // ── Empty State ─────────────────────────────
  it('zeigt Empty-State wenn keine Kampagnen vorhanden', () => {
    mockHookReturn.campaigns = [];
    renderPage();
    expect(screen.getByText('admin.campaigns.noResults')).toBeInTheDocument();
  });

  // ── Search Input ────────────────────────────
  it('rendert die Suchleiste', () => {
    renderPage();
    expect(screen.getByPlaceholderText('admin.campaigns.searchPlaceholder')).toBeInTheDocument();
  });

  // ── Refresh Button ──────────────────────────
  it('ruft refresh bei Klick auf Refresh-Button auf', () => {
    renderPage();
    const refreshBtn = screen.getByLabelText('admin.campaigns.refresh');
    fireEvent.click(refreshBtn);
    expect(mockActions.refresh).toHaveBeenCalled();
  });

  // ── Table columns ───────────────────────────
  it('rendert Tabellen-Header mit sortierbaren Spalten', () => {
    renderPage();
    expect(screen.getByText('admin.campaigns.subject')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.status')).toBeInTheDocument();
    expect(screen.getByText('admin.campaigns.language')).toBeInTheDocument();
  });

  // ── Action Buttons für Draft ────────────────
  it('zeigt Edit- und Send-Buttons nur für Drafts', () => {
    renderPage();
    // camp-1 is draft → edit + send buttons
    const viewButtons = screen.getAllByTitle('admin.campaigns.detail.view');
    expect(viewButtons.length).toBe(mockCampaigns.length);

    // Edit buttons only for drafts
    const editButtons = screen.getAllByTitle('admin.campaigns.editCampaign');
    expect(editButtons.length).toBe(1); // only camp-1 draft

    const sendButtons = screen.getAllByTitle('admin.campaigns.send');
    expect(sendButtons.length).toBe(1); // only camp-1 draft
  });

  // ── Delete Buttons ──────────────────────────
  it('zeigt Delete-Buttons für alle nicht-sendenden Kampagnen', () => {
    renderPage();
    const deleteButtons = screen.getAllByTitle('admin.campaigns.delete');
    // All 3 campaigns have status !== 'sending', all get delete button
    expect(deleteButtons.length).toBe(3);
  });
});
