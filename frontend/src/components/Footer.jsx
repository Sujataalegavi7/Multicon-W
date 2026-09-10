import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="container footer__inner">
      <div className="footer__brand">
        <div className="footer__brand-wrap">
          <img src="/tcet-logo_1.png" alt="TCET Logo" className="footer__logo" />

        </div>
        <p className="footer__tagline">
          Thakur College of Engineering & Technology — Advancing knowledge through high-impact scholarly research, MULTICON-W conferences, and institutional technical excellence.
        </p>
      </div>

      <div className="footer__links">
        <div className="footer__col">
          <h4 className="footer__col-title">Navigation</h4>
          <Link to="/" className="footer__link">Home</Link>
          <a href="/#about" className="footer__link">About Us</a>
          <Link to="/search" className="footer__link">Browse Papers</Link>
        </div>

      </div>
    </div>

    <div className="footer__bottom">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <p>© {new Date().getFullYear()} Thakur College of Engineering & Technology (TCET). All rights reserved.</p>
        <div className="footer__bottom-links">
          <span>NAAC Grade 'A' Autonomous Institute</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
