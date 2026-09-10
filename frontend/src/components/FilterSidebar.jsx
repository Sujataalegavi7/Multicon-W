import { useState, useEffect } from 'react';
import api from '../services/api';

const FilterSidebar = ({ filters, onChange, isMobile = false, onClose }) => {
  const [meta, setMeta] = useState({ conferences: [], years: [] });

  useEffect(() => {
    api
      .get('/papers/filters/meta')
      .then((res) => setMeta(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onChange({ q: filters.q, year: '', conference: '', author: '', keyword: '', sort: 'newest' });
  };

  return (
    <aside className={`filter-sidebar ${isMobile ? 'filter-sidebar--mobile' : ''}`} aria-label="Search filters">
      <div className="filter-sidebar__header">
        <div className="filter-sidebar__header-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="filter-sidebar__icon">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <h3 className="filter-sidebar__title">Filter Results</h3>
        </div>
        <div className="filter-sidebar__header-actions">
          <button type="button" className="btn btn-ghost btn-sm filter-sidebar__reset-btn" onClick={handleReset}>
            Clear All
          </button>
          {isMobile && onClose && (
            <button
              type="button"
              className="filter-sidebar__close-btn"
              onClick={onClose}
              aria-label="Close filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label" htmlFor="filter-sort">Sort By</label>
        <select
          id="filter-sort"
          className="form-control"
          value={filters.sort || 'newest'}
          onChange={(e) => handleChange('sort', e.target.value)}
        >
          <option value="newest">Latest First</option>
          <option value="oldest">Oldest First</option>
          <option value="az">A–Z by Title</option>
          {filters.q && <option value="relevant">Most Relevant</option>}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label" htmlFor="filter-year">Publication Year</label>
        <select
          id="filter-year"
          className="form-control"
          value={filters.year || ''}
          onChange={(e) => handleChange('year', e.target.value)}
        >
          <option value="">All Years</option>
          {meta.years
            .filter(Boolean)
            .sort((a, b) => b.localeCompare(a))
            .map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label" htmlFor="filter-conference">Conference</label>
        <select
          id="filter-conference"
          className="form-control"
          value={filters.conference || ''}
          onChange={(e) => handleChange('conference', e.target.value)}
        >
          <option value="">All Conferences</option>
          {meta.conferences.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label" htmlFor="filter-author">Author</label>
        <input
          id="filter-author"
          type="text"
          className="form-control"
          placeholder="Author name…"
          value={filters.author || ''}
          onChange={(e) => handleChange('author', e.target.value)}
        />
      </div>

      <div className="filter-section">
        <label className="filter-label" htmlFor="filter-keyword">Keyword</label>
        <input
          id="filter-keyword"
          type="text"
          className="form-control"
          placeholder="Keyword…"
          value={filters.keyword || ''}
          onChange={(e) => handleChange('keyword', e.target.value)}
        />
      </div>

      {isMobile && onClose && (
        <div className="filter-sidebar__mobile-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      )}
    </aside>
  );
};

export default FilterSidebar;
