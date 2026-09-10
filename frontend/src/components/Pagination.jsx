const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      pages.push(i);
    }
  }

  const withEllipsis = [];
  let prev;
  for (const page of pages) {
    if (prev && page - prev > 1) {
      withEllipsis.push('…');
    }
    withEllipsis.push(page);
    prev = page;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="pagination__btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>

      {withEllipsis.map((item, idx) =>
        item === '…' ? (
          <span key={`ellipsis-${idx}`} className="pagination__ellipsis">
            …
          </span>
        ) : (
          <button
            key={item}
            className={`pagination__btn ${currentPage === item ? 'active' : ''}`}
            onClick={() => onPageChange(item)}
            aria-current={currentPage === item ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        className="pagination__btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        Next ›
      </button>
    </nav>
  );
};

export default Pagination;
