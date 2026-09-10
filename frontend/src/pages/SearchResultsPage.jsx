import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import PaperCard from '../components/PaperCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [papers, setPapers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const getFilters = () => ({
    q: searchParams.get('q') || '',
    year: searchParams.get('year') || '',
    conference: searchParams.get('conference') || '',
    author: searchParams.get('author') || '',
    keyword: searchParams.get('keyword') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const [filters, setFilters] = useState(getFilters);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const fetchPapers = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.set('page', currentPage);
      params.set('limit', '10');

      const res = await api.get(`/papers?${params.toString()}`);
      setPapers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const newFilters = getFilters();
    const newPage = parseInt(searchParams.get('page') || '1');
    setFilters(newFilters);
    setPage(newPage);
    fetchPapers(newFilters, newPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleRemoveFilter = (filterKey) => {
    const updated = { ...filters, [filterKey]: '' };
    handleFilterChange(updated);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active filters for badge
  const activeFilters = [];
  if (filters.year) activeFilters.push({ key: 'year', label: `Year: ${filters.year}` });
  if (filters.conference) activeFilters.push({ key: 'conference', label: `Conf: ${filters.conference}` });
  if (filters.author) activeFilters.push({ key: 'author', label: `Author: ${filters.author}` });
  if (filters.keyword) activeFilters.push({ key: 'keyword', label: `Keyword: ${filters.keyword}` });
  if (filters.sort && filters.sort !== 'newest') {
    const sortLabels = { oldest: 'Oldest', az: 'A–Z', relevant: 'Relevant' };
    activeFilters.push({ key: 'sort', label: `Sort: ${sortLabels[filters.sort] || filters.sort}` });
  }

  const resultLabel = filters.q
    ? `Results for "${filters.q}"`
    : 'All Research Papers';

  return (
    <>
      <Navbar />

      {/* Page Header */}
      <div className="search-page__header">
        <div className="container">
          <div className="search-page__header-inner">
            <div>
              <div className="search-page__header-tag">Multicon-W Repository</div>
              <h1 className="search-page__header-title">Research Papers</h1>
            </div>
            <div className="search-page__top-bar">
              <SearchBar initialQuery={filters.q} />
            </div>
          </div>
        </div>
      </div>

      <div className="search-page">
        <div className="search-page__body">
          <div className="container">
            {/* Mobile Filter Toggle & Summary Row */}
            <div className="search-page__mobile-bar">
              <button
                type="button"
                className="btn btn-outline search-page__mobile-filter-btn"
                onClick={() => setMobileFiltersOpen(true)}
                aria-label="Open search filters"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filters</span>
                {activeFilters.length > 0 && (
                  <span className="search-page__filter-badge">{activeFilters.length}</span>
                )}
              </button>

              <span className="search-page__mobile-count">
                {loading ? 'Searching…' : `${pagination.total} paper${pagination.total !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Active Filters Chips */}
            {activeFilters.length > 0 && (
              <div className="active-filters" aria-label="Active filters">
                <span className="active-filters__label">Active:</span>
                {activeFilters.map(({ key, label }) => (
                  <span key={key} className="active-filter-chip">
                    <span>{label}</span>
                    <button
                      type="button"
                      className="active-filter-chip__remove"
                      onClick={() => (key === 'sort' ? handleFilterChange({ ...filters, sort: 'newest' }) : handleRemoveFilter(key))}
                      aria-label={`Remove ${label}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="active-filters__clear"
                  onClick={() => handleFilterChange({ q: filters.q, year: '', conference: '', author: '', keyword: '', sort: 'newest' })}
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="search-page__layout">
              {/* Desktop Sidebar (hidden on mobile via CSS) */}
              <div className="search-page__sidebar-desktop">
                <FilterSidebar filters={filters} onChange={handleFilterChange} />
              </div>

              {/* Mobile Drawer (visible only when mobileFiltersOpen is true) */}
              {mobileFiltersOpen && (
                <div className="filter-drawer">
                  <div
                    className="filter-drawer__backdrop"
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="filter-drawer__panel">
                    <FilterSidebar
                      filters={filters}
                      onChange={handleFilterChange}
                      isMobile={true}
                      onClose={() => setMobileFiltersOpen(false)}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="search-page__results">
                <div className="search-page__results-header">
                  <div>
                    <h2 className="search-page__results-title">{resultLabel}</h2>
                  </div>
                  <p className="search-page__results-count">
                    {loading ? 'Searching…' : `${pagination.total} paper${pagination.total !== 1 ? 's' : ''} found`}
                  </p>
                </div>

                {loading ? (
                  <LoadingSpinner />
                ) : papers.length === 0 ? (
                  <div className="empty-state empty-state--large">
                    <div className="empty-state__icon">🔍</div>
                    <h3 className="empty-state__title">No papers found</h3>
                    <p className="empty-state__text">
                      Try adjusting your search query or clearing the filters.
                    </p>
                    {activeFilters.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '16px' }}
                        onClick={() => handleFilterChange({ q: '', year: '', conference: '', author: '', keyword: '', sort: 'newest' })}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="results-list">
                      {papers.map((paper, idx) => (
                        <PaperCard key={paper._id} paper={paper} index={idx} />
                      ))}
                    </div>
                    <Pagination
                      currentPage={page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SearchResultsPage;
