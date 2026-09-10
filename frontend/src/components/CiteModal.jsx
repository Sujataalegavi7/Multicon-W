import { useState, useMemo } from 'react';

/**
 * Helper to extract 4-digit year from conferenceDate or paper.createdAt
 */
const extractYear = (paper) => {
  if (paper?.conferenceDate) {
    const match = paper.conferenceDate.match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }
  if (paper?.createdAt) {
    return new Date(paper.createdAt).getFullYear().toString();
  }
  return new Date().getFullYear().toString();
};

/**
 * Format author name into initials + last name (e.g., "John Doe" -> "J. Doe")
 */
const formatAuthorInitials = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(n => `${n[0].toUpperCase()}.`).join(' ');
  return `${initials} ${lastName}`;
};

/**
 * Generate citekey for BibTeX: e.g. "doe2024machine"
 */
const generateCiteKey = (paper) => {
  const firstAuthor = paper?.authors?.[0] || 'multicon';
  const lastName = firstAuthor.trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const year = extractYear(paper);
  const firstWord = (paper?.title || 'paper').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${lastName || 'author'}${year}${firstWord || 'paper'}`;
};

/**
 * Generate IEEE & APA Plain Text Citations
 */
export const generatePlainTextCitation = (paper, style = 'ieee') => {
  if (!paper) return '';
  const authors = paper.authors || [];
  const year = extractYear(paper);
  const title = paper.title || 'Untitled';
  const conf = paper.conferenceName || 'MULTICON-W Proceedings';
  const loc = paper.conferenceLocation ? `${paper.conferenceLocation}, ` : '';
  const doi = paper.doi ? `, doi: ${paper.doi}` : '';
  const isbn = paper.electronicISBN ? `, ISBN: ${paper.electronicISBN}` : paper.printISBN ? `, ISBN: ${paper.printISBN}` : '';

  if (style === 'apa') {
    // APA Style: Author, A. A., & Author, B. B. (Year). Title. Conference Name, Location. DOI
    let authorStr = '';
    if (authors.length === 1) {
      const parts = authors[0].trim().split(/\s+/);
      const last = parts.pop();
      const initials = parts.map(p => `${p[0].toUpperCase()}.`).join(' ');
      authorStr = initials ? `${last}, ${initials}` : last;
    } else if (authors.length === 2) {
      const formatAPA = (a) => {
        const parts = a.trim().split(/\s+/);
        const last = parts.pop();
        const initials = parts.map(p => `${p[0].toUpperCase()}.`).join(' ');
        return initials ? `${last}, ${initials}` : last;
      };
      authorStr = `${formatAPA(authors[0])} & ${formatAPA(authors[1])}`;
    } else if (authors.length > 2) {
      const formatAPA = (a) => {
        const parts = a.trim().split(/\s+/);
        const last = parts.pop();
        const initials = parts.map(p => `${p[0].toUpperCase()}.`).join(' ');
        return initials ? `${last}, ${initials}` : last;
      };
      const allExceptLast = authors.slice(0, -1).map(formatAPA).join(', ');
      authorStr = `${allExceptLast}, & ${formatAPA(authors[authors.length - 1])}`;
    } else {
      authorStr = 'TCET Research Repository';
    }
    return `${authorStr} (${year}). ${title}. In ${conf}${loc ? `, ${paper.conferenceLocation}` : ''}${doi ? `. https://doi.org/${paper.doi}` : ''}`;
  }

  // IEEE Style: [1] J. Doe and R. Smith, "Title," in Conference, Location, Year, doi: ...
  let authorStr = '';
  if (authors.length === 1) {
    authorStr = formatAuthorInitials(authors[0]);
  } else if (authors.length === 2) {
    authorStr = `${formatAuthorInitials(authors[0])} and ${formatAuthorInitials(authors[1])}`;
  } else if (authors.length > 2 && authors.length <= 6) {
    const formatted = authors.map(formatAuthorInitials);
    authorStr = `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
  } else if (authors.length > 6) {
    authorStr = `${formatAuthorInitials(authors[0])} et al.`;
  } else {
    authorStr = 'TCET Authors';
  }

  return `${authorStr}, "${title}," in ${conf}, ${loc}${year}${doi}${isbn}.`;
};

/**
 * Generate BibTeX format
 */
export const generateBibTeXCitation = (paper, options = { includeAbstract: false }) => {
  if (!paper) return '';
  const citeKey = generateCiteKey(paper);
  const authors = (paper.authors || []).join(' and ');
  const year = extractYear(paper);
  
  const fields = [
    `  author    = {${authors}}`,
    `  title     = {{${paper.title || 'Untitled'}}}`,
    `  booktitle = {${paper.conferenceName || 'MULTICON-W Proceedings'}}`,
    `  year      = {${year}}`,
  ];

  if (paper.conferenceLocation) {
    fields.push(`  address   = {${paper.conferenceLocation}}`);
  }
  if (paper.doi) {
    fields.push(`  doi       = {${paper.doi}}`);
  }
  if (paper.electronicISBN) {
    fields.push(`  isbn      = {${paper.electronicISBN}}`);
  } else if (paper.printISBN) {
    fields.push(`  isbn      = {${paper.printISBN}}`);
  }
  if (paper.keywords && paper.keywords.length > 0) {
    fields.push(`  keywords  = {${paper.keywords.join(', ')}}`);
  }
  if (options.includeAbstract && paper.abstract) {
    const cleanAbstract = paper.abstract.replace(/[{}]/g, '');
    fields.push(`  abstract  = {${cleanAbstract}}`);
  }

  return `@inproceedings{${citeKey},\n${fields.join(',\n')}\n}`;
};

/**
 * Generate RIS (Research Information Systems) format
 */
export const generateRISCitation = (paper, options = { includeAbstract: false }) => {
  if (!paper) return '';
  const lines = ['TY  - CONF'];
  lines.push(`TI  - ${paper.title || 'Untitled'}`);
  
  (paper.authors || []).forEach((author) => {
    lines.push(`AU  - ${author}`);
  });

  if (paper.conferenceName) {
    lines.push(`T2  - ${paper.conferenceName}`);
  }
  
  const year = extractYear(paper);
  if (year) {
    lines.push(`PY  - ${year}`);
  }

  if (paper.conferenceLocation) {
    lines.push(`CY  - ${paper.conferenceLocation}`);
  }

  if (paper.doi) {
    lines.push(`DO  - ${paper.doi}`);
  }

  if (paper.electronicISBN) {
    lines.push(`SN  - ${paper.electronicISBN}`);
  } else if (paper.printISBN) {
    lines.push(`SN  - ${paper.printISBN}`);
  }

  if (paper.keywords && paper.keywords.length > 0) {
    paper.keywords.forEach((kw) => {
      lines.push(`KW  - ${kw}`);
    });
  }

  if (options.includeAbstract && paper.abstract) {
    lines.push(`AB  - ${paper.abstract}`);
  }

  lines.push('ER  - ');
  return lines.join('\n');
};

const CiteModal = ({ isOpen, onClose, paper }) => {
  const [activeTab, setActiveTab] = useState('plaintext'); // 'plaintext' | 'bibtex' | 'ris'
  const [plainTextStyle, setPlainTextStyle] = useState('ieee'); // 'ieee' | 'apa'
  const [includeAbstract, setIncludeAbstract] = useState(false);
  const [copied, setCopied] = useState(false);

  const citationText = useMemo(() => {
    if (!paper) return '';
    if (activeTab === 'plaintext') {
      return generatePlainTextCitation(paper, plainTextStyle);
    }
    if (activeTab === 'bibtex') {
      return generateBibTeXCitation(paper, { includeAbstract });
    }
    if (activeTab === 'ris') {
      return generateRISCitation(paper, { includeAbstract });
    }
    return '';
  }, [paper, activeTab, plainTextStyle, includeAbstract]);

  if (!isOpen || !paper) return null;

  const handleCopy = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(citationText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy citation:', err);
      }
    }
  };

  const handleDownload = () => {
    const safeTitle = (paper.title || 'citation')
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    
    let filename = `${safeTitle}.txt`;
    let mimeType = 'text/plain;charset=utf-8';

    if (activeTab === 'bibtex') {
      filename = `${safeTitle}.bib`;
      mimeType = 'application/x-bibtex;charset=utf-8';
    } else if (activeTab === 'ris') {
      filename = `${safeTitle}.ris`;
      mimeType = 'application/x-research-info-systems;charset=utf-8';
    }

    const blob = new Blob([citationText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay cite-modal__overlay" onClick={onClose}>
      <div className="modal cite-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cite-modal-title">
        {/* Header */}
        <div className="cite-modal__header">
          <div className="cite-modal__header-left">
            <div className="cite-modal__icon-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <div>
              <span className="cite-modal__eyebrow">IEEE Xplore Compatible</span>
              <h3 id="cite-modal-title" className="cite-modal__title">Cite This Paper</h3>
            </div>
          </div>
          <button 
            type="button" 
            className="cite-modal__close-btn" 
            onClick={onClose}
            aria-label="Close cite modal"
          >
            ✕
          </button>
        </div>

        {/* Paper Mini Context */}
        <div className="cite-modal__paper-info">
          <p className="cite-modal__paper-title">{paper.title}</p>
          <p className="cite-modal__paper-meta">
            {paper.authors?.join(', ')} • {paper.conferenceName}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="cite-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'plaintext'}
            className={`cite-modal__tab ${activeTab === 'plaintext' ? 'cite-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('plaintext')}
          >
            <span className="cite-modal__tab-label">Plain Text</span>
            <span className="cite-modal__tab-badge">IEEE / APA</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bibtex'}
            className={`cite-modal__tab ${activeTab === 'bibtex' ? 'cite-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('bibtex')}
          >
            <span className="cite-modal__tab-label">BibTeX</span>
            <span className="cite-modal__tab-badge">.bib</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ris'}
            className={`cite-modal__tab ${activeTab === 'ris' ? 'cite-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('ris')}
          >
            <span className="cite-modal__tab-label">RIS</span>
            <span className="cite-modal__tab-badge">EndNote / Zotero</span>
          </button>
        </div>

        {/* Controls Bar (Options depending on active tab) */}
        <div className="cite-modal__controls">
          {activeTab === 'plaintext' ? (
            <div className="cite-modal__format-toggle">
              <span className="cite-modal__control-label">Format Style:</span>
              <div className="cite-modal__pill-group">
                <button
                  type="button"
                  className={`cite-modal__pill-btn ${plainTextStyle === 'ieee' ? 'cite-modal__pill-btn--active' : ''}`}
                  onClick={() => setPlainTextStyle('ieee')}
                >
                  IEEE Standard
                </button>
                <button
                  type="button"
                  className={`cite-modal__pill-btn ${plainTextStyle === 'apa' ? 'cite-modal__pill-btn--active' : ''}`}
                  onClick={() => setPlainTextStyle('apa')}
                >
                  APA 7th
                </button>
              </div>
            </div>
          ) : (
            <label className="cite-modal__checkbox-label">
              <input
                type="checkbox"
                checked={includeAbstract}
                onChange={(e) => setIncludeAbstract(e.target.checked)}
                className="cite-modal__checkbox"
              />
              <span>Include Abstract in Export</span>
            </label>
          )}
        </div>

        {/* Citation Preview Box */}
        <div className="cite-modal__body">
          <div className={`cite-modal__content-box ${activeTab !== 'plaintext' ? 'cite-modal__content-box--code' : ''}`}>
            <pre className="cite-modal__pre">{citationText}</pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="cite-modal__footer">
          <div className="cite-modal__footer-left">
            <span className="cite-modal__hint">
              {activeTab === 'plaintext'
                ? 'Standard formatted reference for bibliographies.'
                : activeTab === 'bibtex'
                ? 'Compatible with LaTeX and Overleaf bib managers.'
                : 'Compatible with Zotero, EndNote, Mendeley, and Citavi.'}
            </span>
          </div>

          <div className="cite-modal__footer-actions">
            <button
              type="button"
              className={`btn btn-sm cite-modal__btn-copy ${copied ? 'cite-modal__btn-copy--copied' : 'btn-outline'}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Citation</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-sm btn-primary cite-modal__btn-download"
              onClick={handleDownload}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download {activeTab === 'bibtex' ? '.bib' : activeTab === 'ris' ? '.ris' : '.txt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CiteModal;
