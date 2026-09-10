import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import CiteModal from '../components/CiteModal';
import api from '../services/api';

const META_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

const PaperDetailPage = () => {
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCiteModal, setShowCiteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [paperRes, relatedRes] = await Promise.all([
          api.get(`/papers/${id}`),
          api.get(`/papers/${id}/related`),
        ]);
        const p = paperRes.data.data;
        setPaper(p);
        setRelated(relatedRes.data.data);

        // Dynamic Document Title
        document.title = `${p.title} | TCET Research Repository`;

        // Dynamic Google Scholar & OpenGraph Meta Tags
        const createdTags = [];
        const addMeta = (name, content, isProperty = false) => {
          if (!content) return;
          const meta = document.createElement('meta');
          if (isProperty) {
            meta.setAttribute('property', name);
          } else {
            meta.setAttribute('name', name);
          }
          meta.setAttribute('content', content);
          meta.setAttribute('data-dynamic-seo', 'true');
          document.head.appendChild(meta);
          createdTags.push(meta);
        };

        // Standard SEO & OpenGraph
        addMeta('description', p.abstract ? p.abstract.slice(0, 160) : p.title);
        addMeta('og:title', p.title, true);
        addMeta('og:description', p.abstract ? p.abstract.slice(0, 160) : p.title, true);
        addMeta('og:type', 'article', true);

        // Google Scholar Citation Meta Tags (Highwire Press Schema)
        addMeta('citation_title', p.title);
        (p.authors || []).forEach((author) => addMeta('citation_author', author));
        if (p.conferenceDate) addMeta('citation_publication_date', p.conferenceDate);
        if (p.conferenceName) addMeta('citation_conference_title', p.conferenceName);
        if (p.doi) addMeta('citation_doi', p.doi);
        if (p.electronicISBN) addMeta('citation_isbn', p.electronicISBN);
        if (p.pdfPath) addMeta('citation_pdf_url', `${window.location.origin}/${p.pdfPath.replace(/\\/g, '/')}`);

        return () => {
          createdTags.forEach((tag) => tag.remove());
          document.title = 'TCET Centre of Excellence — Research Repository';
        };
      } catch {
        setError('Paper not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo({ top: 0 });
  }, [id]);

  const handleDownload = () => {
    window.open(`${META_URL}/api/papers/${id}/download`, '_blank');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullPage /></>;
  if (error)
    return (
      <>
        <Navbar />
        <div className="container page-wrapper" style={{ padding: '60px 20px', minHeight: '60vh' }}>
          <div className="alert alert-error">{error}</div>
          <Link to="/search" className="btn btn-outline" style={{ marginTop: 16 }}>
            ← Back to Search
          </Link>
        </div>
        <Footer />
      </>
    );

  const {
    title,
    authors = [],
    abstract,
    conferenceName,
    conferenceDate,
    conferenceLocation,
    doi,
    electronicISBN,
    printISBN,
    keywords = [],
    pdfPath,
    createdAt,
  } = paper;

  const pdfUrl = `${META_URL}/${pdfPath?.replace(/\\/g, '/')}`;

  return (
    <>
      <Navbar />
      <div className="paper-detail-page">

        {/* Dark hero header */}
        <div className="paper-detail__hero">
          <div className="container">
            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="breadcrumb__sep">›</span>
              <Link to="/search">Repository</Link>
              <span className="breadcrumb__sep">›</span>
              <span className="breadcrumb__current">{title}</span>
            </nav>

            {/* Conference tag */}
            {conferenceName && (
              <div className="paper-detail__conference-tag">
                <span className="paper-detail__conf-pill">
                  🏛️ {conferenceName}
                  {conferenceDate && ` · ${conferenceDate}`}
                  {conferenceLocation && ` · ${conferenceLocation}`}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="paper-detail__title">{title}</h1>

            {/* Authors */}
            {authors.length > 0 && (
              <div className="paper-detail__authors">
                {authors.map((a, i) => (
                  <span key={i} className="paper-detail__author">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: 5 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {a}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="paper-detail__actions">
              <button type="button" className="btn btn-action paper-detail__action-btn" onClick={handleDownload}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download PDF</span>
              </button>

              <button type="button" className="btn btn-outline paper-detail__action-btn paper-detail__action-btn--light" onClick={() => setShowCiteModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <span>Cite This</span>
              </button>

              <button type="button" className="btn btn-outline paper-detail__action-btn paper-detail__action-btn--light" onClick={handleShare}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>

              <Link to="/search" className="btn btn-outline paper-detail__action-btn paper-detail__action-btn--light">
                <span>← Back to Search</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container">
          <div className="paper-detail__layout">
            {/* ── Main Content ── */}
            <div className="paper-detail__main">
              {/* Abstract */}
              <div className="card paper-detail__card">
                <div className="paper-detail__section">
                  <h2 className="paper-detail__section-title">Abstract</h2>
                  <p className="paper-detail__abstract">{abstract}</p>
                </div>

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div className="paper-detail__section" style={{ marginBottom: 0 }}>
                    <h2 className="paper-detail__section-title">Keywords</h2>
                    <div className="paper-detail__keywords">
                      {keywords.map((kw, i) => (
                        <Link
                          key={i}
                          to={`/search?keyword=${encodeURIComponent(kw)}`}
                          className="paper-card__keyword"
                        >
                          {kw}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Preview */}
              <div className="card paper-detail__card">
                <div className="paper-detail__section" style={{ marginBottom: 0 }}>
                  <div className="paper-detail__pdf-header">
                    <h2 className="paper-detail__section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                      Document Preview
                    </h2>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm paper-detail__pdf-open-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      <span>Open in New Tab</span>
                    </a>
                  </div>

                  <div className="paper-detail__pdf-wrap">
                    <iframe
                      src={pdfUrl}
                      title={`PDF preview: ${title}`}
                      className="paper-detail__pdf"
                      aria-label="Paper PDF preview"
                    />
                  </div>

                  <div className="paper-detail__pdf-mobile-hint">
                    <span>Having trouble viewing on mobile?</span>
                    <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                      Open PDF Directly
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className="paper-detail__sidebar">
              {/* Publication Details */}
              <div className="paper-detail__info-card">
                <h3 className="paper-detail__info-title">Publication Details</h3>
                <dl className="paper-detail__dl">
                  {doi && (
                    <>
                      <dt>DOI</dt>
                      <dd><a href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">{doi}</a></dd>
                    </>
                  )}
                  {conferenceName && (<><dt>Conference</dt><dd>{conferenceName}</dd></>)}
                  {conferenceDate && (<><dt>Date</dt><dd>{conferenceDate}</dd></>)}
                  {conferenceLocation && (<><dt>Location</dt><dd>{conferenceLocation}</dd></>)}
                  {electronicISBN && (<><dt>E-ISBN</dt><dd>{electronicISBN}</dd></>)}
                  {printISBN && (<><dt>Print ISBN</dt><dd>{printISBN}</dd></>)}
                  {createdAt && (
                    <>
                      <dt>Added</dt>
                      <dd>{new Date(createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Related Papers */}
              {related.length > 0 && (
                <div className="paper-detail__info-card">
                  <h3 className="paper-detail__info-title">Related Research</h3>
                  <div className="related-papers">
                    {related.map((rp) => (
                      <div key={rp._id} className="related-paper-item">
                        <Link to={`/papers/${rp._id}`} className="related-paper-item__title">
                          {rp.title}
                        </Link>
                        <p className="related-paper-item__authors">
                          {rp.authors?.join('; ')}
                        </p>
                        <p className="related-paper-item__conf">
                          {rp.conferenceName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
      <CiteModal
        isOpen={showCiteModal}
        onClose={() => setShowCiteModal(false)}
        paper={paper}
      />
      <Footer />
    </>
  );
};

export default PaperDetailPage;
