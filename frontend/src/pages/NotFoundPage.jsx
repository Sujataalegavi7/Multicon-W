import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFoundPage = () => (
  <>
    <Navbar />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <p style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem' }}>404</p>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', maxWidth: 400 }}>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/" className="btn btn-primary">
          ← Go Home
        </Link>
        <Link to="/search" className="btn btn-outline">
          Browse Papers
        </Link>
      </div>
    </div>
    <Footer />
  </>
);

export default NotFoundPage;
