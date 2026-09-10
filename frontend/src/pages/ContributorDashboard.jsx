import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
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

// ─── Upload / Edit Form Component ─────────────────────────────────────────────
const UploadForm = ({ editPaper = null, onSuccess, onCancel }) => {
  const isEdit = !!editPaper;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: editPaper
      ? {
          title: editPaper.title,
          authors: Array.isArray(editPaper.authors) ? editPaper.authors.join(', ') : editPaper.authors,
          abstract: editPaper.abstract,
          conferenceName: editPaper.conferenceName,
          conferenceDate: editPaper.conferenceDate || '',
          conferenceLocation: editPaper.conferenceLocation || '',
          doi: editPaper.doi || '',
          electronicISBN: editPaper.electronicISBN || '',
          printISBN: editPaper.printISBN || '',
          keywords: Array.isArray(editPaper.keywords) ? editPaper.keywords.join(', ') : editPaper.keywords || '',
        }
      : {},
  });

  const abstractValue = watch('abstract') || '';

  const handlePdfChange = (e) => {
    if (e.target.files?.[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data) => {
    setError('');
    if (!isEdit && !pdfFile) {
      setError('Please upload a PDF document for your research paper.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });

      if (pdfFile) formData.append('pdf', pdfFile);

      if (isEdit) {
        await api.put(`/papers/${editPaper._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/papers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      reset();
      setPdfFile(null);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="upload-form">
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Paper Overview */}
      <div className="form-card-section">
        <div className="form-card-section__header">
          <div className="form-card-section__badge">1</div>
          <div>
            <h3 className="form-card-section__title">Paper Overview &amp; Content</h3>
            <p className="form-card-section__desc">Provide the primary details about your academic manuscript.</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Paper Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`form-control ${errors.title ? 'error' : ''}`}
            placeholder="e.g. Deep Learning Approaches for High-Resolution Satellite Imaging"
            {...register('title', { required: 'Paper title is required' })}
          />
          {errors.title && <span className="form-error">{errors.title.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="authors">
            Authors <span className="required">*</span>
          </label>
          <input
            id="authors"
            type="text"
            className={`form-control ${errors.authors ? 'error' : ''}`}
            placeholder="e.g. Dr. Rajesh Sharma, Prof. Sunita Patil, Amit Verma"
            {...register('authors', { required: 'At least one author is required' })}
          />
          <span className="form-hint">Separate multiple authors with commas</span>
          {errors.authors && <span className="form-error">{errors.authors.message}</span>}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="abstract">
              Abstract <span className="required">*</span>
            </label>
            <span className="form-hint" style={{ margin: 0 }}>{abstractValue.length} characters</span>
          </div>
          <textarea
            id="abstract"
            className={`form-control ${errors.abstract ? 'error' : ''}`}
            rows={5}
            placeholder="Summarize the core objectives, methodology, experimental findings, and conclusion of the paper…"
            {...register('abstract', { required: 'Abstract is required' })}
          />
          {errors.abstract && <span className="form-error">{errors.abstract.message}</span>}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="keywords">
            Keywords &amp; Topic Tags
          </label>
          <input
            id="keywords"
            type="text"
            className="form-control"
            placeholder="e.g. Machine Learning, Cloud Computing, Neural Networks"
            {...register('keywords')}
          />
          <span className="form-hint">Separate keywords with commas (helps researchers discover your work)</span>
        </div>
      </div>

      {/* Section 2: Conference & Publication Metadata */}
      <div className="form-card-section">
        <div className="form-card-section__header">
          <div className="form-card-section__badge form-card-section__badge--blue">2</div>
          <div>
            <h3 className="form-card-section__title">Conference &amp; Indexing Metadata</h3>
            <p className="form-card-section__desc">Conference name, year, location, and identifier codes.</p>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="conferenceName">
              Conference Name <span className="required">*</span>
            </label>
            <input
              id="conferenceName"
              type="text"
              className={`form-control ${errors.conferenceName ? 'error' : ''}`}
              placeholder="e.g. MULTICON-W 2026 / IEEE ICACIT"
              {...register('conferenceName', { required: 'Conference name is required' })}
            />
            {errors.conferenceName && <span className="form-error">{errors.conferenceName.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conferenceDate">
              Conference Date / Year
            </label>
            <input
              id="conferenceDate"
              type="text"
              className="form-control"
              placeholder="e.g. February 2026 or 2026"
              {...register('conferenceDate')}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="conferenceLocation">
            Conference Location
          </label>
          <input
            id="conferenceLocation"
            type="text"
            className="form-control"
            placeholder="e.g. Mumbai, India"
            {...register('conferenceLocation')}
          />
        </div>

        <div className="form-grid-3" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="doi">DOI (Digital Object Identifier)</label>
            <input
              id="doi"
              type="text"
              className="form-control"
              placeholder="e.g. 10.1109/XXXX.2026"
              {...register('doi')}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="electronicISBN">Electronic ISBN (e-ISBN)</label>
            <input
              id="electronicISBN"
              type="text"
              className="form-control"
              placeholder="e.g. 978-1-5386-xxxx-x"
              {...register('electronicISBN')}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="printISBN">Print ISBN</label>
            <input
              id="printISBN"
              type="text"
              className="form-control"
              placeholder="e.g. 978-1-5386-xxxx-x"
              {...register('printISBN')}
            />
          </div>
        </div>
      </div>

      {/* Section 3: File Attachments */}
      <div className="form-card-section">
        <div className="form-card-section__header">
          <div className="form-card-section__badge form-card-section__badge--green">3</div>
          <div>
            <h3 className="form-card-section__title">Manuscript &amp; Document Files</h3>
            <p className="form-card-section__desc">Upload your PDF manuscript document.</p>
          </div>
        </div>

        <div>
          {/* PDF Dropzone */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              PDF Manuscript <span className="required">*</span>
            </label>
            <div className={`file-dropzone ${pdfFile ? 'file-dropzone--selected' : ''}`}>
              <input
                id="pdf"
                type="file"
                accept=".pdf,application/pdf"
                className="file-dropzone__input"
                onChange={handlePdfChange}
              />
              <div className="file-dropzone__content">
                <div className="file-dropzone__icon file-dropzone__icon--red">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                {pdfFile ? (
                  <div>
                    <div className="file-dropzone__filename">{pdfFile.name}</div>
                    <div className="file-dropzone__filesize">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload</div>
                  </div>
                ) : (
                  <div>
                    <div className="file-dropzone__title">
                      {isEdit ? 'Click to replace existing PDF' : 'Choose PDF file or drag & drop'}
                    </div>
                    <div className="file-dropzone__subtitle">PDF files up to 20MB supported</div>
                  </div>
                )}
              </div>
            </div>
            {isEdit && !pdfFile && editPaper?.pdfPath && (
              <span className="form-hint" style={{ marginTop: 6, display: 'block' }}>
                📄 Currently attached: <strong>{editPaper.pdfPath.split(/[\/\\]/).pop()}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Bar */}
      <div className="upload-form__actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <span>Processing...</span>
            </>
          ) : isEdit ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save &amp; Resubmit Paper</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Submit Manuscript for Review</span>
            </>
          )}
        </button>

        {onCancel && (
          <button type="button" className="btn btn-secondary btn-lg" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const ContributorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [papers, setPapers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [editPaper, setEditPaper] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, paper: null });
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/contributor/stats');
      setStats(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchMyPapers = useCallback(async (currentPage = 1, status = '') => {
    setLoadingPapers(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', '10');
      if (status) params.set('status', status);

      const res = await api.get(`/contributor/papers?${params.toString()}`);
      setPapers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setPapers([]);
    } finally {
      setLoadingPapers(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'papers' || activeTab === 'overview') {
      fetchMyPapers(page, statusFilter);
    }
  }, [activeTab, page, statusFilter, fetchMyPapers]);

  const handleUploadSuccess = () => {
    setSuccessMsg('🎉 Manuscript submitted successfully! It is now queued for administrator review.');
    setEditPaper(null);
    setActiveTab('papers');
    setStatusFilter('');
    fetchStats();
    fetchMyPapers(1, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleEditSuccess = () => {
    setSuccessMsg('✅ Paper details updated and resubmitted for administrative review.');
    setEditPaper(null);
    setActiveTab('papers');
    fetchStats();
    fetchMyPapers(page, statusFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleDelete = async () => {
    if (!deleteModal.paper) return;
    try {
      await api.delete(`/papers/${deleteModal.paper._id}`);
      setDeleteModal({ open: false, paper: null });
      setSuccessMsg('Paper was deleted successfully.');
      fetchStats();
      fetchMyPapers(page, statusFilter);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete paper.');
    }
  };

  const handleStatCardClick = (targetStatus) => {
    setStatusFilter(targetStatus);
    setActiveTab('papers');
    setPage(1);
    setEditPaper(null);
  };

  // Client-side text filter on the current page of papers
  const filteredPapers = papers.filter((p) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.conferenceName?.toLowerCase().includes(q) ||
      p.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div className="container">
          {/* Welcome Banner */}
          <div className="dashboard-banner">
            <div className="dashboard-banner__inner">
              <div className="dashboard-banner__user">
                <div className="dashboard-banner__avatar">
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U'}
                </div>
                <div>
                  <div className="dashboard-banner__role-pill">
                    <span className="dashboard-banner__role-dot" />
                    <span>Verified Contributor</span>
                  </div>
                  <h1 className="dashboard-banner__title">Welcome back, {user?.name || 'Researcher'}</h1>
                  <p className="dashboard-banner__email">{user?.email}</p>
                </div>
              </div>

              <div className="dashboard-banner__actions">
                <button
                  type="button"
                  className="btn btn-primary dashboard-banner__btn"
                  onClick={() => {
                    setEditPaper(null);
                    setActiveTab('upload');
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Upload New Paper</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success / Info Toast */}
          {successMsg && (
            <div className="alert alert-success dashboard-toast" role="alert">
              <span>{successMsg}</span>
              <button
                type="button"
                className="dashboard-toast__close"
                onClick={() => setSuccessMsg('')}
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="dashboard-stats-row">
            <div
              className={`dashboard-stat-card ${statusFilter === '' && activeTab === 'papers' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('')}
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
                <span className="dashboard-stat-card__label">Total Submitted</span>
                <span className="dashboard-stat-card__value">{loadingStats ? '—' : stats?.total ?? 0}</span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${statusFilter === 'approved' && activeTab === 'papers' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('approved')}
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
                  {loadingStats ? '—' : stats?.approved ?? 0}
                </span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${statusFilter === 'pending' && activeTab === 'papers' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('pending')}
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
                  {loadingStats ? '—' : stats?.pending ?? 0}
                </span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${statusFilter === 'changes_requested' && activeTab === 'papers' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('changes_requested')}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-stat-card__icon dashboard-stat-card__icon--purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div className="dashboard-stat-card__body">
                <span className="dashboard-stat-card__label">Revisions Needed</span>
                <span className="dashboard-stat-card__value dashboard-stat-card__value--purple">
                  {loadingStats ? '—' : stats?.changesRequested ?? 0}
                </span>
              </div>
            </div>

            <div
              className={`dashboard-stat-card ${statusFilter === 'rejected' && activeTab === 'papers' ? 'dashboard-stat-card--active' : ''}`}
              onClick={() => handleStatCardClick('rejected')}
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
                  {loadingStats ? '—' : stats?.rejected ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="dashboard-nav-tabs">
            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'overview' && !editPaper ? 'active' : ''}`}
              onClick={() => {
                setEditPaper(null);
                setActiveTab('overview');
              }}
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
              className={`dashboard-nav-tab ${activeTab === 'papers' && !editPaper ? 'active' : ''}`}
              onClick={() => {
                setEditPaper(null);
                setActiveTab('papers');
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>My Manuscripts</span>
              {stats?.total > 0 && <span className="dashboard-nav-tab__count">{stats.total}</span>}
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'upload' && !editPaper ? 'active' : ''}`}
              onClick={() => {
                setEditPaper(null);
                setActiveTab('upload');
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Upload Paper</span>
            </button>

            {editPaper && (
              <button type="button" className="dashboard-nav-tab active">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Manuscript: {editPaper.title.slice(0, 30)}…</span>
              </button>
            )}
          </div>

          {/* TAB CONTENTS */}
          <div className="dashboard-tab-content">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && !editPaper && (
              <div className="dashboard-overview-grid">
                {/* Left: Recent submissions table preview */}
                <div className="card dashboard-card">
                  <div className="dashboard-card__header">
                    <div>
                      <h2 className="dashboard-card__title">Recent Submissions</h2>
                      <p className="dashboard-card__subtitle">Latest manuscripts you have submitted to the repository</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setActiveTab('papers')}
                    >
                      View All ({stats?.total ?? 0}) →
                    </button>
                  </div>

                  {loadingPapers ? (
                    <div style={{ padding: '40px 0' }}><LoadingSpinner /></div>
                  ) : papers.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px 20px' }}>
                      <div className="empty-state__icon">📄</div>
                      <h3 className="empty-state__title">No manuscripts submitted yet</h3>
                      <p className="empty-state__text">Submit your first paper to get published in the TCET Repository.</p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={() => setActiveTab('upload')}
                      >
                        Upload Manuscript Now
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Manuscript Title</th>
                            <th>Conference</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {papers.slice(0, 5).map((p) => (
                            <tr key={p._id}>
                              <td className="dashboard-table__title-cell">
                                <span className="dashboard-table__title-text" title={p.title}>
                                  {p.title}
                                </span>
                              </td>
                              <td><span className="dashboard-table__conf-text">{p.conferenceName}</span></td>
                              <td><span className="dashboard-table__date-text">{new Date(p.createdAt).toLocaleDateString('en-GB')}</span></td>
                              <td><StatusBadge status={p.status} /></td>
                              <td>
                                <div className="dashboard-table__actions">
                                  {p.status === 'approved' ? (
                                    <Link to={`/papers/${p._id}`} className="btn btn-outline btn-sm">
                                      View
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => {
                                        setEditPaper(p);
                                        setActiveTab('upload');
                                      }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right: Contributor Guidelines & Tips */}
                <div className="dashboard-sidebar-column">
                  <div className="card dashboard-card dashboard-card--accent">
                    <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem', marginBottom: 12 }}>
                      💡 Submission Guidelines
                    </h3>
                    <ul className="guidelines-list">
                      <li>
                        <strong>PDF Format:</strong> Ensure your manuscript is in standard IEEE / conference double-column format.
                      </li>
                      <li>
                        <strong>Review Turnaround:</strong> Submissions are typically reviewed and indexed within 24–48 hours.
                      </li>
                      <li>
                        <strong>Revisions:</strong> If reviewers request changes, check remarks in the <em>My Manuscripts</em> tab and resubmit.
                      </li>
                      <li>
                        <strong>DOI &amp; ISBN:</strong> Adding DOI and ISBN helps automatic indexing with global research engines.
                      </li>
                    </ul>
                  </div>

                  <div className="card dashboard-card">
                    <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem', marginBottom: 8 }}>
                      Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() => {
                          setEditPaper(null);
                          setActiveTab('upload');
                        }}
                      >
                        + Submit New Paper
                      </button>
                      <Link to="/search" className="btn btn-outline btn-block">
                        🔍 Browse All Repository Papers
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === 'upload' && !editPaper && (
              <div className="card dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <h2 className="dashboard-card__title">Submit Research Manuscript</h2>
                    <p className="dashboard-card__subtitle">Complete the form below to submit your manuscript for peer review and repository indexing.</p>
                  </div>
                </div>
                <div style={{ padding: '0 4px' }}>
                  <UploadForm onSuccess={handleUploadSuccess} />
                </div>
              </div>
            )}

            {/* EDIT TAB */}
            {editPaper && (
              <div className="card dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <h2 className="dashboard-card__title">Edit &amp; Resubmit Manuscript</h2>
                    <p className="dashboard-card__subtitle">Modify manuscript metadata or replace document files.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditPaper(null);
                      setActiveTab('papers');
                    }}
                  >
                    ✕ Close Edit Mode
                  </button>
                </div>
                <div style={{ padding: '0 4px' }}>
                  <UploadForm
                    editPaper={editPaper}
                    onSuccess={handleEditSuccess}
                    onCancel={() => {
                      setEditPaper(null);
                      setActiveTab('papers');
                    }}
                  />
                </div>
              </div>
            )}

            {/* MY PAPERS TAB */}
            {activeTab === 'papers' && !editPaper && (
              <div className="card dashboard-card">
                <div className="dashboard-card__header" style={{ flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 className="dashboard-card__title">My Manuscripts</h2>
                    <p className="dashboard-card__subtitle">Manage, edit, or track review status of your submitted papers</p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="dashboard-filter-toolbar">
                    {/* Status Pill Filters */}
                    <div className="status-filter-pills">
                      {[
                        { val: '', label: 'All' },
                        { val: 'approved', label: 'Approved' },
                        { val: 'pending', label: 'Pending' },
                        { val: 'changes_requested', label: 'Changes' },
                        { val: 'rejected', label: 'Rejected' },
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          className={`status-filter-pill ${statusFilter === val ? 'active' : ''}`}
                          onClick={() => {
                            setStatusFilter(val);
                            setPage(1);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="dashboard-search-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dashboard-search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="form-control dashboard-search-input"
                        placeholder="Search your papers…"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {loadingPapers ? (
                  <div style={{ padding: '60px 0' }}><LoadingSpinner /></div>
                ) : filteredPapers.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <div className="empty-state__icon">🔍</div>
                    <h3 className="empty-state__title">
                      {searchFilter || statusFilter ? 'No matching manuscripts found' : 'No manuscripts uploaded yet'}
                    </h3>
                    <p className="empty-state__text">
                      {searchFilter || statusFilter
                        ? 'Try clearing your search query or switching status filters.'
                        : 'Submit your first paper to get started.'}
                    </p>
                    {searchFilter || statusFilter ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: 16 }}
                        onClick={() => {
                          setSearchFilter('');
                          setStatusFilter('');
                        }}
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={() => setActiveTab('upload')}
                      >
                        Upload Manuscript Now
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="table-responsive">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Manuscript &amp; Authors</th>
                            <th>Conference</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Reviewer Remarks</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPapers.map((p) => (
                            <tr key={p._id}>
                              <td style={{ maxWidth: 300 }}>
                                <div className="dashboard-paper-cell">
                                  {p.status === 'approved' ? (
                                    <Link to={`/papers/${p._id}`} className="dashboard-paper-title dashboard-paper-title--link">
                                      {p.title}
                                    </Link>
                                  ) : (
                                    <span className="dashboard-paper-title">{p.title}</span>
                                  )}
                                  <span className="dashboard-paper-authors">
                                    {Array.isArray(p.authors) ? p.authors.join(', ') : p.authors}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span className="dashboard-table__conf-text">{p.conferenceName}</span>
                                {p.conferenceDate && <span className="dashboard-table__conf-date">{p.conferenceDate}</span>}
                              </td>

                              <td>
                                <span className="dashboard-table__date-text">
                                  {new Date(p.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </td>

                              <td>
                                <StatusBadge status={p.status} />
                              </td>

                              <td style={{ maxWidth: 220 }}>
                                {p.adminRemarks ? (
                                  <div className={`remarks-callout remarks-callout--${p.status}`}>
                                    <span className="remarks-callout__text">{p.adminRemarks}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>No remarks</span>
                                )}
                              </td>

                              <td style={{ textAlign: 'right' }}>
                                <div className="dashboard-table__actions" style={{ justifyContent: 'flex-end' }}>
                                  {p.status === 'approved' && (
                                    <Link to={`/papers/${p._id}`} className="btn btn-outline btn-sm">
                                      View
                                    </Link>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => {
                                      setEditPaper(p);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => setDeleteModal({ open: true, paper: p })}
                                    title="Delete paper"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div style={{ padding: '20px 0 10px', display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                          currentPage={page}
                          totalPages={pagination.totalPages}
                          onPageChange={(newPage) => setPage(newPage)}
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

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, paper: null })}
        onConfirm={handleDelete}
        title="Delete Research Paper"
        message={`Are you sure you want to delete "${deleteModal.paper?.title}"? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Manuscript"
        confirmVariant="btn-primary"
      />

      <Footer />
    </>
  );
};

export default ContributorDashboard;
