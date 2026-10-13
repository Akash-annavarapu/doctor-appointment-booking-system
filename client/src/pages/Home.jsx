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
            <span className="home-eyebrow">TestPilot · Healthcare booking</span>
            <h1 className="display-4 fw-bold text-primary home-hero-title">
              Doctor appointments, made simple.
            </h1>

            <p className="lead mt-3">
              Book appointments with trusted doctors anytime, anywhere.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleBookAppointment}
                className="btn btn-primary btn-lg me-3 mb-2 mb-sm-0"
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

          <div className="col-lg-6 text-center mt-5 mt-lg-0">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700"
              className="img-fluid rounded shadow home-hero-image"
              alt="Doctor"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5 home-features">
        <h2 className="text-center text-dark fw-bold mb-5">
          Why Choose TestPilot?
        </h2>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card shadow-sm h-100 text-center home-feature-card">
              <div className="card-body">
                <h1>👨‍⚕️</h1>

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
                <h1>📅</h1>

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
                <h1>⏰</h1>

                <h5 className="card-title">
                  24×7 Support
                </h5>

                <p className="card-text">
                  Get assistance anytime with our reliable support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-primary text-white py-5 mt-5 home-statistics">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-4 mb-4">
              <h1 className="fw-bold">500+</h1>
              <h5>Verified Doctors</h5>
            </div>

            <div className="col-md-4 mb-4">
              <h1 className="fw-bold">10K+</h1>
              <h5>Happy Patients</h5>
            </div>

            <div className="col-md-4 mb-4">
              <h1 className="fw-bold">25K+</h1>
              <h5>Appointments Completed</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Doctors */}
      <div id="featured-doctors">
        <FeaturedDoctors />
      </div>

      <Footer />
    </>
  );
}

export default Home;
