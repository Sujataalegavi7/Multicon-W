import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('contributor');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const credentials =
        mode === 'admin'
          ? { loginId: data.loginId, password: data.password }
          : { email: data.email, password: data.password };

      const user = await login(credentials);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Authentication failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setServerError('');
    reset();
  };

  return (
    <>
      <Navbar />

      <div className="auth-page">
        {/* ── Left Panel — Institutional Branding & Features ── */}
        <div className="auth-page__left">
          <div className="auth-page__left-wireframes" aria-hidden="true">
            <svg width="220" height="220" viewBox="0 0 200 200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5">
              <circle cx="70" cy="50" r="30" />
              <line x1="92" y1="72" x2="135" y2="115" />
              <rect x="80" y="100" width="90" height="24" rx="4" />
              <rect x="85" y="128" width="85" height="24" rx="4" />
              <rect x="30" y="110" width="50" height="65" rx="4" />
              <line x1="40" y1="125" x2="70" y2="125" />
              <line x1="40" y1="135" x2="70" y2="135" />
            </svg>
          </div>

          <div className="auth-page__left-content">
            {/* Logo Badge */}
            <div className="auth-page__logo-badge">
              <img src="/tcet-logo.png" alt="TCET Logo" className="auth-page__logo-img" />
            </div>

            <div className="hero__overline" style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>
              <span className="hero__overline-dash" style={{ color: 'var(--tcet-red)' }}>—</span> TCET DIGITAL RESEARCH REPOSITORY
            </div>

            {/* Quote */}
            <blockquote className="auth-page__left-quote">
              “The advancement of knowledge is the foundation of innovation and progress.”
            </blockquote>
            <p className="auth-page__left-attr">
              <span className="attr-dash">—</span> TCET CENTRE OF EXCELLENCE • MUMBAI
            </p>

            {/* Feature Cards */}
            <div className="auth-page__left-features">
              <div className="auth-page__left-feature">
                <div className="auth-page__feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                    DOI Registration
                  </h4>
                  <p className="auth-page__feature-text">
                    Assign unique and persistent Crossref DOIs to research papers and conference publications.
                  </p>
                </div>
              </div>

              <div className="auth-page__left-feature">
                <div className="auth-page__feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                    Metadata Deposit
                  </h4>
                  <p className="auth-page__feature-text">
                    Register publication metadata with Crossref to improve global discoverability and accurate indexing.
                  </p>
                </div>
              </div>

              <div className="auth-page__left-feature">
                <div className="auth-page__feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                    Citation Linking & Visibility
                  </h4>
                  <p className="auth-page__feature-text">
                    Enable reliable citation linking and persistent access across scholarly databases and research platforms.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom highlight pill */}
            {/*<div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>25+ Years Excellence</span>
              <span>•</span>
              <span>Autonomous Premier Institute</span>
              <span>•</span>
              <span>Mumbai</span>
            </div>*/}
          </div>
        </div>

        {/* ── Right Panel — Floating Sign-in Card ── */}
        <div className="auth-page__right">
          <div className="auth-card">
            {/* Top Dot-grid decoration inside card */}
            <div className="auth-card__dots" aria-hidden="true">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className="auth-card__dot-pixel" />
              ))}
            </div>

            {/* Card Logo Header */}
            <div className="auth-card__logo-wrap">
              <img src="/tcet-logo.png" alt="TCET Logo" className="auth-card__logo-img" />
              <div className="auth-card__logo-sep" />
              <div className="auth-card__logo-text">
                <span className="auth-card__logo-name">TCET</span>
                <span className="auth-card__logo-sub">RESEARCH REPOSITORY</span>
              </div>
            </div>

            <div className="auth-card__header">
              <h1 className="auth-card__title">Sign In to Portal</h1>
              <p className="auth-card__subtitle">Choose your access role to continue to your dashboard</p>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`auth-mode-tab ${mode === 'contributor' ? 'active' : ''}`}
                onClick={() => switchMode('contributor')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Contributor</span>
              </button>

              <button
                type="button"
                className={`auth-mode-tab ${mode === 'admin' ? 'active' : ''}`}
                onClick={() => switchMode('admin')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Administrator</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
              {serverError && (
                <div className="alert alert-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              {mode === 'contributor' ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="email"
                      type="email"
                      className={`form-control ${errors.email ? 'error' : ''}`}
                      placeholder="you@tcetmumbai.in or email@domain.com"
                      {...register('email', {
                        required: 'Email address is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <span className="form-error">{errors.email.message}</span>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="loginId">
                    Administrator Login ID <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <input
                      id="loginId"
                      type="text"
                      className={`form-control ${errors.loginId ? 'error' : ''}`}
                      placeholder="Enter administrator ID (e.g. crr_admin)"
                      {...register('loginId', { required: 'Admin Login ID is required' })}
                    />
                  </div>
                  {errors.loginId && (
                    <span className="form-error">{errors.loginId.message}</span>
                  )}
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
                    {mode === 'admin' ? 'Security Passcode' : 'Password'}{' '}
                    <span className="required">*</span>
                  </label>
                </div>
                <div className="input-with-icon">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder={mode === 'admin' ? 'Enter admin master passcode' : 'Enter your password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters required' },
                    })}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error">{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'admin' ? 'Access Admin Console' : 'Sign In to Contributor Dashboard'}</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Card Footer Notes */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray-100)', textAlign: 'center', fontSize: '0.84rem' }}>
              {mode === 'contributor' ? (
                <p style={{ margin: 0, color: 'var(--gray-600)', fontWeight: 500 }}>
                  🏛️ Only for TCET faculties and authorized contributors.
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.78rem' }}>
                  🔒 Admin credentials are provisioned during institutional deployment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default LoginPage;
