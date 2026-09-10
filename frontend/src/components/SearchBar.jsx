import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ initialQuery = '', large = false }) => {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      className={`search-bar ${large ? 'search-bar--large' : ''}`}
      onSubmit={handleSubmit}
      role="search"
    >
      <div className="search-bar__input-wrap">
        <svg
          className="search-bar__icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="main-search"
          type="search"
          className="search-bar__input"
          placeholder="Search by title, author, keywords…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search research papers"
        />
      </div>
      <button type="submit" className="btn btn-primary search-bar__btn">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
