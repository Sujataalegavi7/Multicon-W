import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const ACHIEVEMENTS = [
  {
    icon: '🏆',
    title: 'NAAC Grade "A" Accredited',
    desc: 'Recognized for high standards of academic quality, research culture, and state-of-the-art infrastructure.',
    tag: 'Institutional Excellence',
    link: '/about',
  },
  {
    icon: '🌐',
    title: '15+ Years of MULTICON-W',
    desc: 'Host of the renowned International Conference MULTICON-W, bringing global research scholars together.',
    tag: 'Global Flagship Event',
    link: '/about',
  },
  {
    icon: '💡',
    title: '50+ Patents & Innovations',
    desc: 'Prolific intellectual property generation with numerous utility and design patents granted to faculty & students.',
    tag: 'Intellectual Property',
    link: '/search',
  },
  {
    icon: '🤝',
    title: '100+ Industry Collaborations',
    desc: 'Strong linkages with leading technology companies and research organizations for joint innovation.',
    tag: 'Industry & R&D',
    link: '/about',
  },
  {
    icon: '🔬',
    title: 'Centre of Excellence (CoE)',
    desc: 'Dedicated research labs fostering domain expertise in Artificial Intelligence, IoT, Cybersecurity, and Data Science.',
    tag: 'Advanced Research',
    link: '/search',
  },
];

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto advance slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ACHIEVEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          api.get('/papers?featured=true&limit=6'),
          api.get('/papers?sort=newest&limit=6'),
        ]);
        let featuredList = featuredRes.data.data;
        // If no papers are marked as featured by admin yet, fallback to relevant
        if (!featuredList || featuredList.length === 0) {
          const fallbackRes = await api.get('/papers?sort=relevant&limit=6');
          featuredList = fallbackRes.data.data;
        }
        setFeatured(featuredList || []);
        setRecent(recentRes.data.data || []);
        setTotalCount(
          featuredRes.data.pagination?.total ??
          recentRes.data.pagination?.total ??
          0
        );
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, []);

  const uniquePapersCount =
    totalCount ||
    new Set([
      ...featured.map((p) => p._id),
      ...recent.map((p) => p._id),
    ]).size;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % ACHIEVEMENTS.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + ACHIEVEMENTS.length) % ACHIEVEMENTS.length);

  return (
    <>
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="hero">
        {/* Top red banner strip */}
        <div className="hero__banner">
          <div className="hero__banner-inner">
            <span className="hero__banner-item">💎 AUTONOMOUS INSTITUTE</span>
            <span className="hero__banner-sep">•</span>
            <span className="hero__banner-item">⭐ NAAC GRADE 'A'</span>
            <span className="hero__banner-sep">•</span>
            <span className="hero__banner-item">🏛️ AFFILIATED TO UNIVERSITY OF MUMBAI</span>
            <span className="hero__banner-sep">•</span>
            <span className="hero__banner-item">✅ APPROVED BY AICTE</span>
          </div>
        </div>

        <div className="hero__container">
          <div className="hero__main">
            {/* Left intro text & search */}
            <div className="hero__left">
              <div className="hero__overline">
                <span className="hero__overline-dash">—</span> THAKUR COLLEGE OF ENGINEERING & TECHNOLOGY
              </div>
              <h1 className="hero__title">
                TCET <br />
                <span className="hero__title-red">Multicon W</span>
              </h1>
              <div className="hero__title-line" />

              <p className="hero__subtitle">
                Discover, cite, and contribute to cutting-edge research publications,
                conference papers, and scholarly works from TCET's Multicon W.
              </p>

              {/* Search */}
              <div className="hero__search-wrap">
                <SearchBar large />
              </div>

              {/* Stats Cards */}
              <div className="hero__stats-cards">
                <div className="hero__stat-card">
                  <div className="hero__stat-icon hero__stat-icon--red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="hero__stat-info">
                    <span className="hero__stat-num">{uniquePapersCount || '2'}</span>
                    <span className="hero__stat-label">PAPERS ARCHIVED</span>
                  </div>
                </div>

                <div className="hero__stat-card">
                  <div className="hero__stat-icon hero__stat-icon--purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="hero__stat-info">
                    <span className="hero__stat-num font-serif">100%</span>
                    <span className="hero__stat-label">OPEN ACCESS</span>
                  </div>
                </div>

                <div className="hero__stat-card">
                  <div className="hero__stat-icon hero__stat-icon--green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <div className="hero__stat-info">
                    <span className="hero__stat-num font-serif">Free</span>
                    <span className="hero__stat-label">PDF DOWNLOADS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Carousel — College Highlights */}
            <div className="hero__right">
              {/* Building & Network Background Image */}
              <div className="hero__right-bg-wrap">
                <img
                  src="/tcet-hero-bg.png"
                  alt="TCET Building and Digital Network"
                  className="hero__right-bg-img"
                />
                <div className="hero__right-bg-overlay" />
              </div>

              {/* Floating Highlight Glass Card */}
              <div className="hero__highlight-card">
                <div className="hero__card-overline">
                  <span className="hero__card-dash">—</span> COLLEGE HIGHLIGHTS
                </div>

                <div className="hero__card-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>

                <h3 className="hero__card-title">
                  {ACHIEVEMENTS[currentSlide].title}
                </h3>

                <div className="hero__card-divider" />

                <p className="hero__card-desc">
                  {ACHIEVEMENTS[currentSlide].desc}
                </p>

                <Link
                  to={ACHIEVEMENTS[currentSlide].link || '/about'}
                  className="hero__card-tag-btn"
                >
                  <span>{ACHIEVEMENTS[currentSlide].tag}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </Link>
              </div>

              {/* Bottom Right Carousel Controls */}
              <div className="hero__controls">
                <button className="hero__ctrl-btn" onClick={prevSlide} aria-label="Previous slide">
                  ‹
                </button>
                <div className="hero__dots">
                  {ACHIEVEMENTS.map((_, idx) => (
                    <button
                      key={idx}
                      className={`hero__dot ${idx === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <button className="hero__ctrl-btn" onClick={nextSlide} aria-label="Next slide">
                  ›
                </button>
                <span className="hero__counter">
                  {currentSlide + 1} / {ACHIEVEMENTS.length}
                </span>
              </div>

              {/* Curved swoop line arc */}
              <div className="hero__swoop-arc" />
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* ── About Us Section ── */}
        <section className="about-section" id="about">
          <div className="container">
            <div className="about__grid">

              {/* ── Left — Photo Card ── */}
              <div className="about__card">
                {/* Decorative dots top-left */}
                <div className="about__card-dots" aria-hidden="true">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className="about__dot-pixel" />
                  ))}
                </div>
                {/* Decorative pink circle bottom-left */}
                <div className="about__card-circle" aria-hidden="true" />

                {/* Building photo */}
                <div className="about__photo-wrap">
                  <img
                    src="/tcet-hero-bg.png"
                    alt="TCET Campus Building"
                    className="about__photo"
                  />
                </div>

                {/* Gradient bottom panel */}
                <div className="about__card-panel">
                  {/* Logo badge */}
                  <div className="about__logo-badge">
                    <img src="/tcet-logo.png" alt="TCET Logo" className="about__logo-img" />
                  </div>

                  <div className="about__panel-stat">
                    <span className="about__panel-num">25+</span>
                    <span className="about__panel-label">YEARS OF ACADEMIC EXCELLENCE</span>
                  </div>

                  <div className="about__panel-divider" />
                  <span className="about__panel-subtitle">TCET MULTICON-W</span>

                  {/* 3 mini stats */}
                  <div className="about__mini-stats">
                    <div className="about__mini-stat">
                      <div className="about__mini-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                      </div>
                      <span className="about__mini-num">25+</span>
                      <span className="about__mini-label">YEARS OF<br />EXCELLENCE</span>
                    </div>
                    <div className="about__mini-sep" />
                    <div className="about__mini-stat">
                      <div className="about__mini-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="22" x2="21" y2="22" /><rect x="2" y="9" width="4" height="13" /><rect x="10" y="5" width="4" height="17" /><rect x="18" y="2" width="4" height="20" />
                        </svg>
                      </div>
                      <span className="about__mini-num">15+ </span>
                      <span className="about__mini-label">years of Fostering  <br /> Innovative Research</span>
                    </div>
                    <div className="about__mini-sep" />
                    <div className="about__mini-stat">
                      <div className="about__mini-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <span className="about__mini-num">25,000+</span>
                      <span className="about__mini-label">Research Papers <br />Published</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right — Content ── */}
              <div className="about__content">
                <div className="about__eyebrow">
                  <span className="about__eyebrow-dash">—</span> INSTITUTIONAL OVERVIEW
                </div>

                <h2 className="about__title">
                  About TCET &amp;<br />
                  <span className="about__title-red">Multicon</span>
                </h2>
                <div className="about__title-line" />

                <p className="about__desc">
                  Thakur College of Engineering and Technology (TCET) is a premier
                  autonomous engineering institute in Mumbai. Committed to academic
                  rigor and technical innovation, TCET provides an environment that
                  encourages faculty, scholars, and students to engage in high-impact
                  research, development, and interdisciplinary collaboration.
                </p>

                <div className="about__features">
                  {/* Feature 1 */}
                  <div className="about__feature">
                    <div className="about__feature-icon about__feature-icon--red">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </div>
                    <div className="about__feature-body">
                      <h4 className="about__feature-title">Discover Multicon & Contribute</h4>
                      <p className="about__feature-desc">Explore Multicon’s conferences, research initiatives, and opportunities to contribute to the academic and research community.</p>
                    </div>
                    <Link to="/about" className="about__feature-arrow" aria-label="Discover Multicon & Contribute">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>

                  {/* Feature 2 */}
                  <div className="about__feature">
                    <div className="about__feature-icon about__feature-icon--blue">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className="about__feature-body">
                      <h4 className="about__feature-title">TCET College & Academics</h4>
                      <p className="about__feature-desc">Discover more about TCET, its academic programs, departments, campus, and commitment to excellence in education.</p>
                    </div>
                    <Link to="/about" className="about__feature-arrow" aria-label="TCET College & Academics">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>

                  {/* Feature 3 */}
                  <div className="about__feature">
                    <div className="about__feature-icon about__feature-icon--red">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className="about__feature-body">
                      <h4 className="about__feature-title">Connect With Us</h4>
                      <p className="about__feature-desc">Have a question or want to get in touch? Find our contact details and connect with the Multicon team.</p>
                    </div>
                    <Link to="/about" className="about__feature-arrow" aria-label="Connect With Us">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Featured Papers ── */}
        <section className="section section--papers">
          <div className="container">
            <div className="section__header section__header--row">
              <div>
                <div className="section__eyebrow">
                  <span className="section__eyebrow-dash">—</span> CURATED SELECTION
                </div>
                <h2 className="section__title">
                  Featured <span className="section__title-red">Research Papers</span>
                </h2>
                <p className="section__subtitle">Highlighted publications from our academic contributors</p>
              </div>
              <Link to="/search" className="section__action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Browse All Papers</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : featured.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📚</div>
                <h3 className="empty-state__title">No research papers found</h3>
                <p className="empty-state__text">Papers will appear here once contributors begin publishing.</p>
              </div>
            ) : (
              <div className="papers-grid">
                {featured.map((paper, idx) => (
                  <PaperCard key={paper._id} paper={paper} index={idx} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Recently Added ── */}
        <section className="section section--papers-alt">
          <div className="container">
            <div className="section__header section__header--row">
              <div>
                <div className="section__eyebrow">
                  <span className="section__eyebrow-dash">—</span> LATEST ADDITIONS
                </div>
                <h2 className="section__title">
                  Recently <span className="section__title-red">Published</span>
                </h2>
                <p className="section__subtitle">The newest papers added to our repository</p>
              </div>
              <Link to="/search?sort=newest" className="section__action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>View All New</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : recent.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__text">No recent papers available.</p>
              </div>
            ) : (
              <div className="papers-grid">
                {recent.map((paper, idx) => (
                  <PaperCard key={paper._id} paper={paper} index={idx} />
                ))}
              </div>
            )}
          </div>
        </section>


      </main>

      <Footer />
    </>
  );
};

export default HomePage;
