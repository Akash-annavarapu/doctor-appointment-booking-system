import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  useAuth,
} from "../context/AuthContext";

function UserDashboard() {
  const navigate = useNavigate();

  const {
    user,
    clearSession,
  } = useAuth();

  const handleLogout = () => {
    clearSession();

    toast.success("Logged out successfully");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      <Navbar />

      <main className="container py-5 user-dashboard-layout">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-xl-6">
            <div className="card shadow-sm border-0 rounded-4 user-dashboard-card">
              <div className="card-body p-4 p-md-5">
                <h2 className="text-center text-primary fw-bold mb-4">
                  User Dashboard
                </h2>

                <h4 className="mb-3">
                  Welcome, {user?.name || "User"} 👋
                </h4>

                <hr />

                <p>
                  <strong>Name:</strong>{" "}
                  {user?.name || "Not available"}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {user?.email || "Not available"}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {user?.phone || "Not available"}
                </p>

                <div className="d-grid gap-3 mt-4">
                  {/* Book Appointment */}
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() =>
                      navigate("/doctors")
                    }
                  >
                    Book Appointment
                  </button>

                  {/* My Appointments */}
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-lg"
                    onClick={() =>
                      navigate("/my-appointments")
                    }
                  >
                    My Appointments
                  </button>

                  {/* Apply as Doctor */}
                  <button
                    type="button"
                    className="btn btn-success btn-lg"
                    onClick={() =>
                      navigate("/apply-doctor")
                    }
                  >
                    Apply as Doctor
                  </button>

                  {/* Logout */}
                  <button
                    type="button"
                    className="btn btn-danger btn-lg"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default UserDashboard;
