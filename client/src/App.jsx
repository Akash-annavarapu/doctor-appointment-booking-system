import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import TestCases from "./pages/TestCases";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Doctors from "./pages/Doctors";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import ApplyDoctor from "./pages/ApplyDoctor";

import UserDashboard from "./dashboard/UserDashboard";
import DoctorDashboard from "./dashboard/DoctorDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import {
  AuthProvider,
} from "./context/AuthContext";
import {
  NotificationProvider,
} from "./context/NotificationContext";


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        <Route
          path="/test-cases"
          element={<TestCases />}
        />


        {/* Any Authenticated User */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/doctors"
            element={<Doctors />}
          />
        </Route>


        {/* Normal User Only */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["user"]}
            />
          }
        >
          <Route
            path="/user/dashboard"
            element={<UserDashboard />}
          />

          <Route
            path="/book/:doctorId"
            element={<BookAppointment />}
          />

          <Route
            path="/my-appointments"
            element={<MyAppointments />}
          />

          <Route
            path="/apply-doctor"
            element={<ApplyDoctor />}
          />
        </Route>


        {/* Doctor Only */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["doctor"]}
            />
          }
        >
          <Route
            path="/doctor/dashboard"
            element={<DoctorDashboard />}
          />
        </Route>


        {/* Admin Only */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
        </Route>
        </Routes>
        </NotificationProvider>


        <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;
