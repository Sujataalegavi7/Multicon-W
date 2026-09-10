import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const META_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [papers, setPapers] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [papersPage, setPapersPage] = useState(1);
  const [papersPagination, setPapersPagination] = useState({ total: 0, totalPages: 1 });
  const [contribPage, setContribPage] = useState(1);
  const [contribPagination, setContribPagination] = useState({ total: 0, totalPages: 1 });
  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState({ total: 0, totalPages: 1 });
  const [paperFilter, setPaperFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, paper: null, newStatus: '' });
  const [reviewPaper, setReviewPaper] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [addContribOpen, setAddContribOpen] = useState(false);
  const [addContribData, setAddContribData] = useState({ name: '', email: '', password: '', department: '' });
  const [addContribError, setAddContribError] = useState('');

  // ── Fetch Helpers ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch {
      // ignore
    }
  }, []);

  const fetchPapers = useCallback(async (page, status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '12');
      if (status) params.set('status', status);

      const res = await api.get(`/admin/papers?${params.toString()}`);
      setPapers(res.data.data);
      setPapersPagination(res.data.pagination);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContributors = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/contributors?page=${page}&limit=12`);
      setContributors(res.data.data);
      setContribPagination(res.data.pagination);
    } catch {
      setContributors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/logs?page=${page}&limit=25`);
      setLogs(res.data.data);
      setLogPagination(res.data.pagination);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'papers' || activeTab === 'overview') {
      fetchPapers(papersPage, paperFilter);
    }
  }, [activeTab, papersPage, paperFilter, fetchPapers]);

  useEffect(() => {
    if (activeTab === 'contributors') {
      fetchContributors(contribPage);
    }
  }, [activeTab, contribPage, fetchContributors]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs(logPage);
    }
  }, [activeTab, logPage, fetchLogs]);

  // ── Modal Status Update ──
  const handleStatusUpdate = async (remarks) => {
    if (!statusModal.paper) return;
    try {
      await api.patch(`/papers/${statusModal.paper._id}/status`, {
        status: statusModal.newStatus,
        adminRemarks: remarks,
      });
      setStatusModal({ open: false, paper: null, newStatus: '' });
      if (reviewPaper?._id === statusModal.paper._id) setReviewPaper(null);
      fetchStats();
      if (activeTab === 'papers') fetchPapers(papersPage, paperFilter);
      setSuccessMsg(`Paper status updated to "${statusModal.newStatus}".`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // ── Review Modal Direct Action ──
  const handleReviewAction = async (newStatus) => {
    if (!reviewPaper) return;
    setActionLoading(true);
    try {
      await api.patch(`/papers/${reviewPaper._id}/status`, {
        status: newStatus,
        adminRemarks: reviewRemarks,
      });
      setSuccessMsg(`✓ Paper "${reviewPaper.title}" marked as ${newStatus}.`);
      setReviewPaper(null);
      setReviewRemarks('');
      fetchStats();
      if (activeTab === 'papers') fetchPapers(papersPage, paperFilter);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Toggle Featured Paper on Home Page ──
  const handleToggleFeatured = async (paperToToggle) => {
    try {
      const newFeatured = !paperToToggle.isFeatured;
      await api.patch(`/papers/${paperToToggle._id}/featured`, {
        isFeatured: newFeatured,
      });
      setPapers((prev) =>
        prev.map((p) => (p._id === paperToToggle._id ? { ...p, isFeatured: newFeatured } : p))
      );
      if (reviewPaper && reviewPaper._id === paperToToggle._id) {
        setReviewPaper((prev) => ({ ...prev, isFeatured: newFeatured }));
      }
      setSuccessMsg(
        newFeatured
          ? `⭐ Paper "${paperToToggle.title}" is now marked as Featured on the Home Page!`
          : `Paper "${paperToToggle.title}" was removed from Featured papers.`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle featured paper status.');
    }
  };

  // ── Contributor Actions ──
  const toggleContribActive = async (contrib) => {
    try {
      await api.patch(`/admin/contributors/${contrib._id}`, {
        isActive: !contrib.isActive,
      });
      fetchContributors(contribPage);
      setSuccessMsg(`Contributor ${contrib.name} was ${contrib.isActive ? 'deactivated' : 'activated'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update contributor status.');
    }
  };

  const handleAddContributor = async (e) => {
    e.preventDefault();
    setAddContribError('');
    try {
      await api.post('/admin/contributors', addContribData);
      setAddContribOpen(false);
      setAddContribData({ name: '', email: '', password: '', department: '' });
      fetchContributors(contribPage);
      fetchStats();
      setSuccessMsg('New contributor account created successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setAddContribError(err.response?.data?.message || 'Failed to create contributor.');
    }
  };

  const handleStatCardClick = (targetTab, targetFilter = '') => {
    setActiveTab(targetTab);
    if (targetTab === 'papers') {
      setPaperFilter(targetFilter);
      setPapersPage(1);
    }
  };

  // Client-side text filter on current papers list
  const filteredPapers = papers.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.conferenceName?.toLowerCase().includes(q) ||
      p.uploadedBy?.name?.toLowerCase().includes(q) ||
      p.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  const statusModalConfig = {
    approved: { title: 'Approve Manuscript', label: 'Approve & Publish', variant: 'btn-primary', showRemarks: false },
    rejected: { title: 'Reject Manuscript', label: 'Confirm Rejection', variant: 'btn-outline-danger', showRemarks: true, remarksLabel: 'Reason for rejection (sent to contributor)' },
    changes_requested: { title: 'Request Revisions', label: 'Send Revision Request', variant: 'btn-primary', showRemarks: true, remarksLabel: 'Required revisions and remarks' },
  };
  const modalCfg = statusModal.newStatus ? statusModalConfig[statusModal.newStatus] : {};

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div className="container">
          {/* Admin Welcome Banner */}
          <div className="dashboard-banner">
            <div className="dashboard-banner__inner">
              <div className="dashboard-banner__user">
                <div className="dashboard-banner__avatar" style={{ background: 'linear-gradient(135deg, #003087 0%, #1e40af 100%)' }}>
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'AD'}
                </div>
                <div>
                  <div className="dashboard-banner__role-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                    <span className="dashboard-banner__role-dot" style={{ background: '#ef4444' }} />
                    <span>Chief Administrator</span>
                  </div>
                  <h1 className="dashboard-banner__title">Repository Command Center</h1>
                  <p className="dashboard-banner__email">Logged in as {user?.name || 'Administrator'} ({user?.email || 'admin@tcetmumbai.in'})</p>
                </div>
              </div>

              <div className="dashboard-banner__actions">
                <button
                  type="button"
                  className="btn btn-primary dashboard-banner__btn"
                  onClick={() => {
                    setActiveTab('papers');
                    setPaperFilter('pending');
                    setPapersPage(1);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Review Pending Queue ({stats?.pendingPapers ?? 0})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success / Alert Toast */}
          {successMsg && (
            <div className="alert alert-success dashboard-toast" role="alert">
              <span>{successMsg}</span>
              <button
                type="button"
                className="dashboard-toast__close"
                onClick={() => setSuccessMsg('')}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="dashboard-stats-row">
            <div
              className={`dashboard-stat-card ${activeTab === 'papers' && paperFilter === '' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('papers', '')}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-stat-card__icon dashboard-stat-card__icon--blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="dashboard-stat-card__body">
                <span className="dashboard-stat-card__label">Total Papers</span>
                <span className="dashboard-stat-card__value">{stats ? stats.totalPapers : '—'}</span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${activeTab === 'papers' && paperFilter === 'pending' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('papers', 'pending')}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-stat-card__icon dashboard-stat-card__icon--amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="dashboard-stat-card__body">
                <span className="dashboard-stat-card__label">Pending Review</span>
                <span className="dashboard-stat-card__value dashboard-stat-card__value--amber">
                  {stats ? stats.pendingPapers : '—'}
                </span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${activeTab === 'papers' && paperFilter === 'approved' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('papers', 'approved')}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-stat-card__icon dashboard-stat-card__icon--green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="dashboard-stat-card__body">
                <span className="dashboard-stat-card__label">Approved &amp; Live</span>
                <span className="dashboard-stat-card__value dashboard-stat-card__value--green">
                  {stats ? stats.approvedPapers : '—'}
                </span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${activeTab === 'papers' && paperFilter === 'rejected' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('papers', 'rejected')}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-stat-card__icon dashboard-stat-card__icon--red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="dashboard-stat-card__body">
                <span className="dashboard-stat-card__label">Rejected</span>
                <span className="dashboard-stat-card__value dashboard-stat-card__value--red">
                  {stats ? stats.rejectedPapers : '—'}
                </span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${activeTab === 'contributors' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('contributors')}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-stat-card__icon dashboard-stat-card__icon--purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="dashboard-stat-card__body">
                <span className="dashboard-stat-card__label">Contributors</span>
                <span className="dashboard-stat-card__value dashboard-stat-card__value--purple">
                  {stats ? stats.totalContributors : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="dashboard-nav-tabs">
            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'papers' ? 'active' : ''}`}
              onClick={() => setActiveTab('papers')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Papers Oversight &amp; Review</span>
              {stats?.pendingPapers > 0 && (
                <span className="dashboard-nav-tab__count" style={{ background: '#f59e0b', color: '#ffffff' }}>
                  {stats.pendingPapers}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'contributors' ? 'active' : ''}`}
              onClick={() => setActiveTab('contributors')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span>Contributors</span>
              {stats?.totalContributors > 0 && (
                <span className="dashboard-nav-tab__count">{stats.totalContributors}</span>
              )}
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              <span>System &amp; Audit Logs</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="dashboard-tab-content">
            {/* ── TAB 1: OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="dashboard-overview-grid">
                {/* Recent Submissions Card */}
                <div className="card dashboard-card">
                  <div className="dashboard-card__header">
                    <div>
                      <h2 className="dashboard-card__title">Recent Paper Submissions</h2>
                      <p className="dashboard-card__subtitle">Incoming manuscripts awaiting approval or updates</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setActiveTab('papers');
                        setPaperFilter('pending');
                      }}
                    >
                      Review Queue ({stats?.pendingPapers ?? 0}) →
                    </button>
                  </div>

                  {!stats ? (
                    <div style={{ padding: '40px 0' }}><LoadingSpinner /></div>
                  ) : stats.recentUploads?.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px 20px' }}>
                      <div className="empty-state__icon">📚</div>
                      <h3 className="empty-state__title">No recent submissions</h3>
                      <p className="empty-state__text">Uploaded papers from contributors will show up here.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Manuscript Title</th>
                            <th>Contributor</th>
                            <th>Conference</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentUploads.map((p) => (
                            <tr key={p._id}>
                              <td className="dashboard-paper-cell" style={{ maxWidth: 260 }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ textAlign: 'left', fontWeight: 700, color: 'var(--tcet-blue)', padding: 0, whiteSpace: 'normal', lineHeight: 1.3 }}
                                  onClick={() => setReviewPaper(p)}
                                >
                                  {p.title}
                                </button>
                              </td>
                              <td><span className="dashboard-table__conf-text">{p.uploadedBy?.name || 'Contributor'}</span></td>
                              <td><span className="dashboard-table__conf-text">{p.conferenceName}</span></td>
                              <td><StatusBadge status={p.status} /></td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setReviewPaper(p)}
                                >
                                  🔍 Review &amp; PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right: Quick Command & Security Panel */}
                <div className="dashboard-sidebar-column">
                  <div className="card dashboard-card dashboard-card--accent">
                    <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem', marginBottom: 12 }}>
                      ⚡ Admin Control Center
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() => {
                          setActiveTab('papers');
                          setPaperFilter('pending');
                        }}
                      >
                        🔍 Open Pending Review Queue
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-block"
                        onClick={() => {
                          setActiveTab('contributors');
                          setAddContribOpen(true);
                        }}
                      >
                        + Register New Contributor
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-block"
                        style={{ border: '1px solid var(--gray-300)' }}
                        onClick={() => setActiveTab('logs')}
                      >
                        📋 View System Security Logs
                      </button>
                    </div>
                  </div>

                  <div className="card dashboard-card">
                    <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem', marginBottom: 10 }}>
                      🛡️ Approval Standards
                    </h3>
                    <ul className="guidelines-list">
                      <li>
                        <strong>PDF Verification:</strong> Verify the PDF rendered preview matches the conference metadata before approving.
                      </li>
                      <li>
                        <strong>Revisions:</strong> Provide constructive remarks when requesting formatting or title adjustments.
                      </li>
                      <li>
                        <strong>Sitemap &amp; SEO:</strong> Approved papers are automatically added to the real-time XML sitemap.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: PAPERS OVERSIGHT & REVIEW ── */}
            {activeTab === 'papers' && (
              <div className="card dashboard-card">
                <div className="dashboard-card__header" style={{ flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 className="dashboard-card__title">Manuscripts Queue &amp; Approval</h2>
                    <p className="dashboard-card__subtitle">Review, inspect full PDF files, and manage repository publications</p>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="dashboard-filter-toolbar">
                    <div className="status-filter-pills">
                      {[
                        { val: '', label: 'All' },
                        { val: 'pending', label: 'Pending' },
                        { val: 'approved', label: 'Approved' },
                        { val: 'changes_requested', label: 'Changes' },
                        { val: 'rejected', label: 'Rejected' },
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          className={`status-filter-pill ${paperFilter === val ? 'active' : ''}`}
                          onClick={() => {
                            setPaperFilter(val);
                            setPapersPage(1);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="dashboard-search-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dashboard-search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="form-control dashboard-search-input"
                        placeholder="Filter queue…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '60px 0' }}><LoadingSpinner /></div>
                ) : filteredPapers.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <div className="empty-state__icon">🔍</div>
                    <h3 className="empty-state__title">No manuscripts in this view</h3>
                    <p className="empty-state__text">There are currently no papers matching your selected filter.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Manuscript Title</th>
                            <th>Contributor</th>
                            <th>Conference</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Featured</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPapers.map((p) => (
                            <tr key={p._id}>
                              <td style={{ maxWidth: 280 }}>
                                <div className="dashboard-paper-cell">
                                  <button
                                    type="button"
                                    className="dashboard-paper-title dashboard-paper-title--link"
                                    style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                    onClick={() => setReviewPaper(p)}
                                    title="Click to open full inspection modal"
                                  >
                                    {p.title}
                                  </button>
                                  <span className="dashboard-paper-authors">
                                    {Array.isArray(p.authors) ? p.authors.join(', ') : p.authors}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span className="dashboard-table__conf-text">{p.uploadedBy?.name || 'Contributor'}</span>
                                {p.uploadedBy?.email && (
                                  <span className="dashboard-table__conf-date">{p.uploadedBy.email}</span>
                                )}
                              </td>

                              <td>
                                <span className="dashboard-table__conf-text">{p.conferenceName}</span>
                                {p.conferenceDate && (
                                  <span className="dashboard-table__conf-date">{p.conferenceDate}</span>
                                )}
                              </td>

                              <td>
                                <span className="dashboard-table__date-text">
                                  {new Date(p.createdAt).toLocaleDateString('en-GB')}
                                </span>
                              </td>

                              <td>
                                <StatusBadge status={p.status} />
                              </td>

                              <td style={{ textAlign: 'center' }}>
                                <label
                                  className={`featured-toggle-btn ${p.isFeatured ? 'featured-toggle-btn--active' : ''}`}
                                  title={p.isFeatured ? "Featured on Home Page (Click to unfeature)" : "Click to feature on Home Page"}
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!p.isFeatured}
                                    onChange={() => handleToggleFeatured(p)}
                                    className="featured-toggle-checkbox"
                                  />
                                  <span className="featured-toggle-star">{p.isFeatured ? '⭐' : '☆'}</span>
                                  <span className="featured-toggle-text">{p.isFeatured ? 'Featured' : 'Feature'}</span>
                                </label>
                              </td>

                              <td style={{ textAlign: 'right' }}>
                                <div className="dashboard-table__actions" style={{ justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setReviewPaper(p)}
                                  >
                                    🔍 Review &amp; PDF
                                  </button>

                                  {p.status !== 'approved' && (
                                    <button
                                      type="button"
                                      className="btn btn-accent btn-sm"
                                      onClick={() => setStatusModal({ open: true, paper: p, newStatus: 'approved' })}
                                      title="Quick Approve"
                                    >
                                      ✓ Approve
                                    </button>
                                  )}

                                  {p.status !== 'rejected' && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => setStatusModal({ open: true, paper: p, newStatus: 'rejected' })}
                                      title="Quick Reject"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {papersPagination.totalPages > 1 && (
                      <div style={{ padding: '20px 0 10px', display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                          currentPage={papersPage}
                          totalPages={papersPagination.totalPages}
                          onPageChange={(page) => setPapersPage(page)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB 3: CONTRIBUTORS MANAGEMENT ── */}
            {activeTab === 'contributors' && (
              <div className="card dashboard-card">
                <div className="dashboard-card__header" style={{ flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 className="dashboard-card__title">Registered Contributors ({contribPagination.total})</h2>
                    <p className="dashboard-card__subtitle">Manage faculty and student contributor access accounts</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setAddContribOpen(!addContribOpen)}
                  >
                    {addContribOpen ? '✕ Close Form' : '+ Add New Contributor'}
                  </button>
                </div>

                {/* Add Contributor Collapsible Form */}
                {addContribOpen && (
                  <div className="form-card-section" style={{ marginBottom: 24, background: '#f8fafc' }}>
                    <h3 className="form-card-section__title" style={{ fontSize: '1.05rem', marginBottom: 14 }}>
                      Create Contributor Account
                    </h3>
                    {addContribError && (
                      <div className="alert alert-error" style={{ marginBottom: 16 }}>{addContribError}</div>
                    )}
                    <form onSubmit={handleAddContributor}>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Full Name <span className="required">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            placeholder="e.g. Dr. Ramesh Gupta"
                            value={addContribData.name}
                            onChange={(e) => setAddContribData({ ...addContribData, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email Address <span className="required">*</span></label>
                          <input
                            type="email"
                            className="form-control"
                            required
                            placeholder="e.g. ramesh.gupta@tcetmumbai.in"
                            value={addContribData.email}
                            onChange={(e) => setAddContribData({ ...addContribData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Department</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Computer Engineering / IT"
                            value={addContribData.department}
                            onChange={(e) => setAddContribData({ ...addContribData, department: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Temporary Password <span className="required">*</span></label>
                          <input
                            type="password"
                            className="form-control"
                            required
                            placeholder="Minimum 6 characters"
                            value={addContribData.password}
                            onChange={(e) => setAddContribData({ ...addContribData, password: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Create Account
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAddContribOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loading ? (
                  <div style={{ padding: '60px 0' }}><LoadingSpinner /></div>
                ) : contributors.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <div className="empty-state__icon">👥</div>
                    <h3 className="empty-state__title">No contributors found</h3>
                    <p className="empty-state__text">Add contributors using the button above.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Contributor</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Published Papers</th>
                            <th>Account Status</th>
                            <th>Joined</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contributors.map((c) => (
                            <tr key={c._id}>
                              <td>
                                <strong style={{ color: 'var(--gray-900)' }}>{c.name}</strong>
                              </td>
                              <td><span className="dashboard-table__conf-date">{c.email}</span></td>
                              <td><span className="dashboard-table__conf-text">{c.department || '—'}</span></td>
                              <td>
                                <span className="dashboard-nav-tab__count" style={{ background: 'rgba(0, 48, 135, 0.08)', color: 'var(--tcet-blue)' }}>
                                  {c.stats?.total ?? 0} papers
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${c.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                                  {c.isActive ? 'Active' : 'Deactivated'}
                                </span>
                              </td>
                              <td>
                                <span className="dashboard-table__date-text">
                                  {new Date(c.createdAt).toLocaleDateString('en-GB')}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${c.isActive ? 'btn-outline-danger' : 'btn-outline'}`}
                                  onClick={() => toggleContribActive(c)}
                                >
                                  {c.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {contribPagination.totalPages > 1 && (
                      <div style={{ padding: '20px 0 10px', display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                          currentPage={contribPage}
                          totalPages={contribPagination.totalPages}
                          onPageChange={(page) => setContribPage(page)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB 4: AUDIT & SECURITY LOGS ── */}
            {activeTab === 'logs' && (
              <div className="card dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <h2 className="dashboard-card__title">Security &amp; Activity Audit Logs</h2>
                    <p className="dashboard-card__subtitle">Immutable chronological trail of administrative and user actions</p>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '60px 0' }}><LoadingSpinner /></div>
                ) : logs.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <p className="empty-state__text">No audit log entries recorded yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Actor / User</th>
                            <th>Action Performed</th>
                            <th>IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr key={log._id}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                                {new Date(log.timestamp).toLocaleString('en-GB')}
                              </td>
                              <td>
                                <strong style={{ color: 'var(--gray-900)' }}>{log.userName || 'System'}</strong>
                              </td>
                              <td>
                                <span style={{ color: 'var(--gray-800)', fontWeight: 500 }}>{log.action}</span>
                              </td>
                              <td>
                                <code style={{ fontSize: '0.75rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                                  {log.ip || '—'}
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {logPagination.totalPages > 1 && (
                      <div style={{ padding: '20px 0 10px', display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                          currentPage={logPage}
                          totalPages={logPagination.totalPages}
                          onPageChange={(page) => setLogPage(page)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FULL PAPER REVIEW MODAL (With PDF Preview & Decision Controls) ── */}
      {reviewPaper && (
        <div className="modal-overlay" onClick={() => setReviewPaper(null)}>
          <div
            className="modal review-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header review-modal__header">
              <div className="review-modal__header-info">
                <span className="review-modal__badge">
                  ADMINISTRATIVE REVIEW
                </span>
                <h3 className="modal-title review-modal__title">{reviewPaper.title}</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm review-modal__close"
                onClick={() => setReviewPaper(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body review-modal__body">
              {/* Contributor & Status Bar */}
              <div className="review-modal__contributor-bar">
                <div className="review-modal__contributor-info">
                  <span className="review-modal__author-name">
                    Contributor: <strong>{reviewPaper.uploadedBy?.name || 'Contributor'}</strong>
                    {reviewPaper.uploadedBy?.email && (
                      <span className="review-modal__author-email">({reviewPaper.uploadedBy.email})</span>
                    )}
                  </span>
                </div>
                <div className="review-modal__status-wrap">
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>Status:</span>
                  <StatusBadge status={reviewPaper.status} />
                </div>
              </div>

              {/* Featured Paper Toggle Checkbox Bar */}
              <div className={`review-modal__featured-bar ${reviewPaper.isFeatured ? 'review-modal__featured-bar--active' : ''}`}>
                <label className="review-modal__featured-label">
                  <input
                    type="checkbox"
                    checked={!!reviewPaper.isFeatured}
                    onChange={() => handleToggleFeatured(reviewPaper)}
                    className="review-modal__featured-checkbox"
                  />
                  <span className="review-modal__featured-text">
                    ⭐ Feature this research paper on the Home Page
                  </span>
                </label>
                <span className="review-modal__featured-status">
                  {reviewPaper.isFeatured ? 'Showcased in Featured Research' : 'Not featured'}
                </span>
              </div>

              {/* Publication Metadata Grid */}
              <div className="review-modal__meta-grid">
                <div className="review-modal__meta-item">
                  <strong className="review-modal__meta-label">CONFERENCE</strong>
                  <span className="review-modal__meta-val">{reviewPaper.conferenceName} ({reviewPaper.conferenceDate || 'N/A'})</span>
                </div>
                {reviewPaper.conferenceLocation && (
                  <div className="review-modal__meta-item">
                    <strong className="review-modal__meta-label">LOCATION</strong>
                    <span className="review-modal__meta-val">{reviewPaper.conferenceLocation}</span>
                  </div>
                )}
                {reviewPaper.doi && (
                  <div className="review-modal__meta-item">
                    <strong className="review-modal__meta-label">DOI</strong>
                    <span className="review-modal__meta-val">{reviewPaper.doi}</span>
                  </div>
                )}
                {reviewPaper.electronicISBN && (
                  <div className="review-modal__meta-item">
                    <strong className="review-modal__meta-label">E-ISBN</strong>
                    <span className="review-modal__meta-val">{reviewPaper.electronicISBN}</span>
                  </div>
                )}
              </div>

              {/* Authors & Abstract */}
              <div className="review-modal__section">
                <strong className="review-modal__meta-label">AUTHORS</strong>
                <p className="review-modal__authors">
                  {Array.isArray(reviewPaper.authors) ? reviewPaper.authors.join('; ') : reviewPaper.authors}
                </p>
              </div>

              <div className="review-modal__section">
                <strong className="review-modal__meta-label">ABSTRACT</strong>
                <p className="review-modal__abstract">{reviewPaper.abstract}</p>
              </div>

              {reviewPaper.keywords?.length > 0 && (
                <div className="review-modal__section">
                  <strong className="review-modal__meta-label">KEYWORDS</strong>
                  <div className="review-modal__keywords">
                    {reviewPaper.keywords.map((kw, i) => (
                      <span key={i} className="paper-card__keyword">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Document Preview inside Modal */}
              <div className="review-modal__pdf-section">
                <div className="review-modal__pdf-header">
                  <strong className="review-modal__pdf-title">PDF Document Preview</strong>
                  <div className="review-modal__pdf-actions">
                    <a
                      href={`${META_URL}/${reviewPaper.pdfPath?.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      title="Open PDF in new tab"
                    >
                      ↗ Open Fullscreen
                    </a>
                    <a
                      href={`${META_URL}/api/papers/${reviewPaper._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      ⬇ Download PDF
                    </a>
                  </div>
                </div>
                <div className="review-modal__pdf-container">
                  <iframe
                    src={`${META_URL}/${reviewPaper.pdfPath?.replace(/\\/g, '/')}`}
                    title={`PDF preview: ${reviewPaper.title}`}
                    className="review-modal__pdf-iframe"
                  />
                </div>
                <p className="review-modal__pdf-fallback">
                  Preview not rendering? <a href={`${META_URL}/${reviewPaper.pdfPath?.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer">Open PDF directly in browser</a>
                </p>
              </div>

              {/* Admin Remarks & Decision Controls */}
              <div className="review-modal__remarks-section">
                <label className="form-label" htmlFor="review-remarks" style={{ fontWeight: 700 }}>
                  Admin Review Remarks <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>(Optional notes sent to contributor)</span>
                </label>
                <textarea
                  id="review-remarks"
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Approved for repository indexing / Please correct author affiliation and resubmit..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer review-modal__footer">
              <button
                type="button"
                className="btn btn-ghost review-modal__close-btn"
                onClick={() => setReviewPaper(null)}
                disabled={actionLoading}
              >
                Close
              </button>
              <div className="review-modal__action-buttons">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleReviewAction('rejected')}
                  disabled={actionLoading}
                >
                  ✕ Reject Paper
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleReviewAction('changes_requested')}
                  disabled={actionLoading}
                >
                  ↩ Request Changes
                </button>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => handleReviewAction('approved')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <span className="spinner" /> : '✓ Approve & Publish Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Confirm Modal */}
      <ConfirmModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, paper: null, newStatus: '' })}
        onConfirm={handleStatusUpdate}
        title={modalCfg.title || ''}
        message={`Paper: "${statusModal.paper?.title}"`}
        confirmLabel={modalCfg.label || 'Confirm'}
        confirmVariant={modalCfg.variant || 'btn-primary'}
        showRemarks={modalCfg.showRemarks}
        remarksLabel={modalCfg.remarksLabel}
      />

      <Footer />
    </>
  );
};

export default AdminDashboard;
