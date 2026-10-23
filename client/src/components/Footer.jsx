import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="container app-footer-inner">
        <div className="app-footer-brand">
          <Link to="/" className="app-footer-logo"><span className="app-footer-symbol" aria-hidden="true">✚</span> TestPilot</Link>
          <p>Making healthcare workflows easier to explore and test.</p>
        </div>
        <nav className="app-footer-links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/#featured-doctors">Specialties</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/test-cases">Test Cases</Link>
        </nav>
        <div className="app-footer-note">
          <strong>Training & software testing only</strong>
          <span>Sample doctor profiles do not represent real clinicians or care services.</span>
        </div>
      </div>
      <div className="container app-footer-bottom">
        <span>© 2026 TestPilot · Healthcare Booking</span>
        <span>Independent demo project · Not for real medical use</span>
      </div>
    </footer>
  );
}

export default Footer;
