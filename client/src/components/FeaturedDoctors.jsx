import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatTime = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(time);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2026, 0, 1, hours, minutes));
};

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

function DoctorCard({ doctor, onBook }) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState(null);
  const [checking, setChecking] = useState(false);
  const [slotMessage, setSlotMessage] = useState("");
  const { isAuthenticated } = useAuth();

  const days = (doctor.weeklyAvailability || []).filter((day) =>
    day.enabled && Array.isArray(day.sessions) && day.sessions.length > 0
  );

  const handleCheckSlots = async () => {
    if (!date || checking) return;
    setChecking(true);
    setSlots(null);
    setSlotMessage("");
    try {
      const { data } = await API.get("/doctor/available-slots", {
        params: { doctorId: doctor._id, appointmentDate: date },
      });
      if (data.success && Array.isArray(data.availableSlots)) {
        setSlots(data.availableSlots);
        setSlotMessage(data.message || "");
      } else {
        setSlotMessage(data.message || "Could not check availability.");
      }
    } catch (error) {
      setSlotMessage(error.response?.data?.message || "Could not check availability. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <article className="card doctor-directory-card shadow-sm border-0 rounded-4 h-100">
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex align-items-start gap-3 mb-3">
          <div className="doctor-directory-avatar" aria-hidden="true">✚</div>
          <div className="flex-grow-1">
            <h3 className="h5 fw-bold mb-1">{doctor.fullName}</h3>
            <div className="doctor-directory-specialty">{doctor.specialization}</div>
            {doctor.isDemo && (
              <span className="doctor-directory-demo-tag">Fictional demo profile</span>
            )}
          </div>
        </div>

        <div className="d-flex flex-wrap gap-3 small mb-3">
          <span><strong>Experience:</strong> {doctor.experience}</span>
          <span><strong>{doctor.isDemo ? "Sample fee:" : "Fee:"}</strong> ₹{doctor.fees}</span>
        </div>

        <div className="doctor-directory-schedule mb-3">
          <strong className="d-block mb-2">Weekly schedule</strong>
          {days.length ? (
            <ul className="list-unstyled mb-1 doctor-directory-days">
              {days.map((day) => (
                <li key={day.day} className="d-flex justify-content-between flex-wrap gap-2">
                  <span>{day.day}</span>
                  <span>{day.sessions.map((session) =>
                    `${formatTime(session.startTime)}–${formatTime(session.endTime)}`
                  ).join(", ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="small text-secondary">No weekly schedule configured.</span>
          )}
          {doctor.slotDuration && (
            <span className="small text-secondary">{doctor.slotDuration}-minute appointments</span>
          )}
        </div>

        <div className="mt-auto">
          <label className="form-label small fw-semibold" htmlFor={`date-${doctor._id}`}>
            Check open slots for a date
          </label>
          <div className="d-flex flex-wrap gap-2 mb-2">
            <input
              id={`date-${doctor._id}`}
              aria-label={`Appointment date for ${doctor.fullName}`}
              className="form-control doctor-directory-date"
              type="date"
              min={getToday()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSlots(null);
                setSlotMessage("");
              }}
            />
            <button type="button" className="btn btn-outline-primary"
              disabled={!date || checking} onClick={handleCheckSlots}>
              {checking ? "Checking…" : "Check slots"}
            </button>
          </div>

          {slots !== null && (
            <div className="doctor-directory-availability" aria-live="polite">
              <strong className="small d-block mb-2">
                {slots.length ? `${slots.length} open slots on ${date}` : `No open slots on ${date}`}
              </strong>
              {slots.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {slots.slice(0, 8).map((slot) => (
                    <span className="doctor-directory-slot" key={slot}>{formatTime(slot)}</span>
                  ))}
                  {slots.length > 8 && <span className="small text-secondary">+{slots.length - 8} more</span>}
                </div>
              )}
            </div>
          )}

          {slots === null && slotMessage && (
            <div className="small text-secondary mt-2" role="status">{slotMessage}</div>
          )}

          <button
            type="button"
            className="btn btn-primary w-100 mt-3"
            onClick={() => onBook(doctor._id)}
          >
            Book Appointment
          </button>
          {doctor.isDemo && (
            <small className="text-secondary d-block mt-2">
              Training/demo appointments only. Do not submit real patient information.
            </small>
          )}
          {!isAuthenticated && (
            <small className="text-secondary d-block mt-1">
              Sign in to complete booking.
            </small>
          )}
        </div>
      </div>
    </article>
  );
}

function FeaturedDoctors() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const fetchDoctors = async () => {
      try {
        const { data } = await API.get("/doctor/all");
        if (!active) return;
        if (data.success) setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
        else setError(data.message || "Failed to load doctors.");
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || "Unable to connect to the server.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDoctors();
    return () => { active = false; };
  }, []);

  const specializations = useMemo(() => (
    [...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))].sort()
  ), [doctors]);

  const filteredDoctors = useMemo(() => doctors.filter((doctor) => (
    (specialization === "all" || doctor.specialization === specialization) &&
    (!query.trim() ||
      `${doctor.fullName} ${doctor.specialization}`.toLowerCase().includes(query.trim().toLowerCase()))
  )), [doctors, specialization, query]);

  const handleBookAppointment = (doctorId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { redirectTo: `/book/${doctorId}` } });
      return;
    }
    navigate(`/book/${doctorId}`);
  };

  return (
    <section className="container py-5 doctor-directory" aria-labelledby="our-doctors-heading">
      <div className="text-center mb-4">
        <span className="home-section-eyebrow">Find a specialty</span>
        <h2 id="our-doctors-heading" className="fw-bold text-primary mb-2">Our Doctors</h2>
        <p className="text-secondary mb-0">Explore specializations, weekly schedules and date-specific open slots.</p>
      </div>

      {loading && <div className="text-center"><h5>Loading doctors...</h5></div>}
      {!loading && error && <div className="alert alert-danger text-center">{error}</div>}
      {!loading && !error && doctors.length === 0 && (
        <div className="alert alert-warning text-center">No approved doctors found.</div>
      )}

      {!loading && !error && doctors.length > 0 && (
        <>
          {doctors.some((doctor) => doctor.isDemo) && (
            <div className="doctor-directory-notice mb-4" role="note">
              <strong>Demo booking environment.</strong> Profiles marked “Fictional demo profile” do
              not represent real licensed clinicians or clinics. Schedule and booking data are
              for software testing only. Please do not enter real patient information.
            </div>
          )}
          <div className="row g-3 align-items-end mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="doctor-search">Search doctor or specialty</label>
              <input id="doctor-search" type="search" className="form-control"
                placeholder="Search doctors or specializations"
                value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="doctor-specialization">Specialization</label>
              <select id="doctor-specialization" className="form-select"
                value={specialization} onChange={(event) => setSpecialization(event.target.value)}>
                <option value="all">All specializations ({specializations.length})</option>
                {specializations.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <p className="text-secondary small mb-3" aria-live="polite">
            Showing {filteredDoctors.length} of {doctors.length} doctor profiles
          </p>
          {filteredDoctors.length ? (
            <div className="row g-4">
              {filteredDoctors.map((doctor) => (
                <div key={doctor._id} className="col-12 col-lg-6 col-xxl-4">
                  <DoctorCard doctor={doctor} onBook={handleBookAppointment} />
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-light border text-center">
              No matching doctors. Try another specialization or search.
            </div>
          )}
          <p className="small text-secondary mt-4 mb-0">
            Weekly hours describe a doctor's configured schedule. Always use “Check slots”
            to confirm the latest date-specific availability before booking.
          </p>
        </>
      )}
    </section>
  );
}

export default FeaturedDoctors;
