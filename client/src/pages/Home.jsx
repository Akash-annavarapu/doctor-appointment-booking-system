import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeaturedDoctors from "../components/FeaturedDoctors";
import {
  useAuth,
} from "../context/AuthContext";

function Home() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
  } = useAuth();

  const handleBookAppointment = () => {
    if (isAuthenticated) {
      navigate("/doctors");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div className="container py-5 home-hero">
        <div className="row align-items-center g-4 g-lg-5">
          <div className="col-lg-6 text-center text-lg-start">
            <span className="home-eyebrow">✚ TestPilot · Healthcare appointments</span>
            <h1 className="display-4 fw-bold text-primary home-hero-title">
              Care made easier, one appointment at a time.
            </h1>

            <p className="lead mt-3">
              Find approved doctors, book an available appointment, and keep track of your visits in one convenient place.
            </p>

            <div className="mt-4 home-cta-actions">
              <button
                type="button"
                onClick={handleBookAppointment}
                className="btn btn-primary btn-lg"
              >
                Book Appointment
              </button>

              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="btn btn-outline-primary btn-lg"
                >
                  Register
                </Link>
              )}
            </div>
          </div>

          <div className="col-lg-6 text-center mt-4 mt-lg-0">
            <div className="home-image-shell">
              <img
                src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85"
                className="home-hero-image"
                alt="Modern hospital entrance and welcoming healthcare environment"
                fetchPriority="high"
                decoding="async"
              />
              <div className="home-photo-note">✚ A welcoming space for better care</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5 home-features">
        <p className="home-section-eyebrow text-center mb-2">Your care, simplified</p>
        <h2 className="text-center fw-bold mb-5">
          Why Choose TestPilot?
        </h2>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card shadow-sm h-100 text-center home-feature-card">
              <div className="card-body">
                <div className="home-feature-icon" aria-hidden="true">👨‍⚕️</div>

                <h5 className="card-title">
                  Verified Doctors
                </h5>

                <p className="card-text">
                  Consult experienced and verified doctors from different
                  specialties.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm h-100 text-center home-feature-card">
              <div className="card-body">
                <div className="home-feature-icon" aria-hidden="true">📅</div>

                <h5 className="card-title">
                  Easy Booking
                </h5>

                <p className="card-text">
                  Book appointments online in just a few clicks.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm h-100 text-center home-feature-card">
              <div className="card-body">
                <div className="home-feature-icon" aria-hidden="true">🗂️</div>

                <h5 className="card-title">
                  Appointment Tracking
                </h5>

                <p className="card-text">
                  View and manage your booked appointments from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <section className="bg-primary text-white py-5 mt-5 home-statistics" aria-label="How appointment booking works">
        <div className="container">
          <h2 className="text-center text-white fw-bold mb-4">How it works</h2>
          <div className="row g-3 text-center">
            <div className="col-md-4">
              <div className="home-step">
                <span className="home-step-number">01</span>
                <h3>Explore doctors</h3>
                <p>Browse available doctor profiles and specialties.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="home-step">
                <span className="home-step-number">02</span>
                <h3>Book a visit</h3>
                <p>Choose a doctor and schedule an appointment.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="home-step">
                <span className="home-step-number">03</span>
                <h3>Stay organized</h3>
                <p>Review and manage appointments from your dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <div id="featured-doctors">
        <FeaturedDoctors />
      </div>

      <Footer />
    </>
  );
}

export default Home;
