import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const PaperCard = ({ paper, index = 0, showStatus = false, variant }) => {
  const {
    _id,
    title,
    authors = [],
    conferenceName = 'IEEE',
    conferenceDate,
    createdAt,
    keywords = [],
    abstract,
    status,
  } = paper || {};

  // Color variant: alternate between 'red' and 'blue' if not explicitly passed
  const cardVariant = variant || (index % 2 === 0 ? 'red' : 'blue');

  const authorStr = Array.isArray(authors)
    ? authors.length > 3
      ? `${authors.slice(0, 3).join('; ')}; et al.`
      : authors.join('; ')
    : authors || '';

  const yearDisplay = conferenceDate
    ? conferenceDate
    : createdAt
    ? new Date(createdAt).getFullYear()
    : '2026';

  const abstractPreview =
    abstract && abstract.length > 110
      ? `${abstract.slice(0, 110)}…`
      : abstract;

  return (
    <article className="paper-card">
      <div className="paper-card__inner">
        {/* Left Thumbnail Box */}
        <div className="paper-card__thumb">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#d91b24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        {/* Right Content Area */}
        <div className="paper-card__content">
          {/* Meta row */}
          <div className="paper-card__meta">
            <span className="paper-card__conf-tag">
              {conferenceName || 'IEEE'}
            </span>
            <span className="paper-card__year">{yearDisplay}</span>
            {showStatus && <StatusBadge status={status} />}
          </div>

          {/* Title */}
          <h3 className="paper-card__title">
            <Link to={`/papers/${_id}`}>{title}</Link>
          </h3>

          {/* Authors */}
          {authorStr && (
            <div className="paper-card__authors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="paper-card__author-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{authorStr}</span>
            </div>
          )}

          {/* Abstract preview */}
          {abstractPreview && (
            <p className="paper-card__abstract">{abstractPreview}</p>
          )}

          {/* Footer row: Keywords left, View Details link right */}
          <div className="paper-card__footer">
            <div className="paper-card__keywords">
              {keywords && keywords.length > 0 ? (
                keywords.slice(0, 4).map((kw, i) => (
                  <span key={i} className="paper-card__keyword">
                    {kw}
                  </span>
                ))
              ) : (
                <span className="paper-card__keyword">Research</span>
              )}
            </div>

            <Link to={`/papers/${_id}`} className="paper-card__link">
              <span>View Details</span>
              <span className="paper-card__arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PaperCard;
