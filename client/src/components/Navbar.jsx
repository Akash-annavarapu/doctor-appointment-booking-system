import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const {
    user,
    isAuthenticated,
    clearSession,
  } = useAuth();

  const handleLogout = () => {
    clearSession();
    setIsOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm app-navbar">
      <div className="container">

        <Link
          className="navbar-brand fw-bold"
          to="/"
          onClick={closeMenu}
        >
          🏥 TestPilot
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
        >
          <ul className="navbar-nav ms-auto">

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/"
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/test-cases"
                onClick={closeMenu}
              >
                Test Cases
              </Link>
            </li>

            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/login"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/register"
                    onClick={closeMenu}
                  >
                    Register
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item d-flex align-items-center">
                  <NotificationBell />
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to={
                      user?.isAdmin
                        ? "/admin/dashboard"
                        : user?.isDoctor
                        ? "/doctor/dashboard"
                        : "/user/dashboard"
                    }
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link btn btn-link border-0 bg-transparent p-0 text-start"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}

          </ul>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
