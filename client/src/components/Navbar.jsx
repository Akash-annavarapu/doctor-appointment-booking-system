import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, clearSession } = useAuth();

  const closeMenu = () => setIsOpen(false);
  const handleLogout = () => {
    clearSession();
    closeMenu();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light app-navbar" aria-label="Main navigation">
      <div className="container app-navbar-inner">
        <Link className="navbar-brand app-brand" to="/" onClick={closeMenu}>
          <span className="app-brand-symbol" aria-hidden="true">✚</span>
          <span>TestPilot</span>
        </Link>

        <button
          type="button"
          className="navbar-toggler app-nav-toggle"
          aria-controls="main-navigation"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div id="main-navigation" className={"collapse navbar-collapse app-nav-collapse" + (isOpen ? " show" : "")}>
          <ul className="navbar-nav app-nav-links mx-lg-auto">
            <li className="nav-item"><Link className="nav-link" to="/" onClick={closeMenu}>Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/#featured-doctors" onClick={closeMenu}>Specialties</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/#featured-doctors" onClick={closeMenu}>Find a doctor</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/#how-it-works" onClick={closeMenu}>How it works</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/test-cases" onClick={closeMenu}>Test Cases</Link></li>
          </ul>

          <div className="app-nav-actions">
            {!isAuthenticated ? (
              <>
                <Link className="nav-link" to="/login" onClick={closeMenu}>Login</Link>
                <Link className="nav-link app-register-link" to="/register" onClick={closeMenu}>Register</Link>
              </>
            ) : (
              <>
                <NotificationBell />
                <Link
                  className="nav-link"
                  to={user?.isAdmin ? "/admin/dashboard" : user?.isDoctor ? "/doctor/dashboard" : "/user/dashboard"}
                  onClick={closeMenu}
                >Dashboard</Link>
                <button type="button" className="nav-link app-logout btn btn-link" onClick={handleLogout}>Logout</button>
              </>
            )}
            <Link className="btn btn-primary app-book-visit" to={isAuthenticated ? "/doctors" : "/login"} onClick={closeMenu}>
              Book a visit <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
