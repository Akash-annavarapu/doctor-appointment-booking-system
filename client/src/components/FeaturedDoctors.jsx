import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const illustrativePortraits = [
  "photo-1612349317150-e413f6a5b16d",
  "photo-1559839734-2b71ea197ec2",
  "photo-1622253692010-333f2da6031d",
  "photo-1594824476967-48c8b964273f",
  "photo-1582750433449-648ed127bb54",
  "photo-1537368910025-700350fe46c7"
];

const formatTime = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(time);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(2026, 0, 1, hours, minutes));
};

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const displayDoctorName = (doctor) => doctor.isDemo
  ? doctor.fullName.replace(/^Dr\. Demo /, "Dr. ")
  : doctor.fullName;

function DoctorCard({ doctor, onBook, index }) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState(null);
  const [checking, setChecking] = useState(false);
  const [slotMessage, setSlotMessage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
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

  const portrait = illustrativePortraits[index % illustrativePortraits.length];
  return (
    <article className="doctor-directory-card h-100">
      <div className="doctor-card-media">
        {doctor.isDemo && !imageFailed ? (
          <img
            src={"https://images.unsplash.com/" + portrait + "?auto=format&fit=crop&w=720&h=450&q=80"}
            className="doctor-card-photo"
            alt="Illustrative stock photo, not the listed fictional doctor"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="doctor-card-photo-fallback" aria-label="Generic healthcare illustration">
            <span aria-hidden="true">✚</span>
          </div>
        )}
        <span className="doctor-card-photo-label">{doctor.isDemo ? "Illustrative photo" : "Profile illustration"}</span>
        {days.length > 0 && <span className="doctor-card-availability-badge">● Weekly schedule listed</span>}
      </div>

      <div className="doctor-card-content">
        <div className="doctor-card-title-row">
          <h3>{displayDoctorName(doctor)}</h3>
        </div>
        <span className="doctor-directory-specialty">{doctor.specialization}</span>
        <p className="doctor-card-subtitle">Explore consultation and available appointment times</p>

        <div className="doctor-card-facts">
          <span><span aria-hidden="true">◷</span> {String(doctor.experience).replace(/ \(fictional\)$/i, "")} experience</span>
          {doctor.slotDuration && <span><span aria-hidden="true">▦</span> {doctor.slotDuration}-minute appointments</span>}
        </div>
        <div className="doctor-card-primary-action">
          <div className="doctor-card-price"><strong>₹{doctor.fees}</strong><span> / visit</span></div>
          <button type="button" className="btn btn-primary doctor-book-button" onClick={() => onBook(doctor._id)}>
            Book Appointment
          </button>
        </div>

        <details className="doctor-directory-schedule">
          <summary>Weekly schedule <span>{days.length ? days.length + " days" : "Not configured"}</span></summary>
          {days.length ? (
            <ul className="list-unstyled doctor-directory-days">
              {days.map((day) => (
                <li key={day.day} className="d-flex justify-content-between flex-wrap gap-2">
                  <span>{day.day}</span>
                  <span>{day.sessions.map((session) =>
                    formatTime(session.startTime) + "–" + formatTime(session.endTime)
                  ).join(", ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small text-secondary mb-0">No weekly schedule configured.</p>
          )}
        </details>

        <div className="doctor-card-slot-panel">
          <label className="form-label" htmlFor={"date-" + doctor._id}>Check open slots for a date</label>
          <div className="doctor-card-slot-controls">
            <input
              id={"date-" + doctor._id}
              aria-label={"Appointment date for " + doctor.fullName}
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
            <button type="button" className="btn btn-outline-primary doctor-check-slots"
              disabled={!date || checking} onClick={handleCheckSlots}>
              {checking ? "Checking…" : "Check slots"}
            </button>
          </div>

          {slots !== null && (
            <div className="doctor-directory-availability" aria-live="polite">
              <strong className="small d-block mb-2">
                {slots.length ? slots.length + " open slots on " + date : "No open slots on " + date}
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
          {slots === null && slotMessage && <p className="small text-secondary mt-2" role="status">{slotMessage}</p>}
        </div>

        {doctor.isDemo && (
          <small className="doctor-card-disclaimer">
            Training appointments only. Do not submit real patient information.
          </small>
        )}
        {!isAuthenticated && <small className="doctor-card-signin">Sign in to complete booking.</small>}
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
    (!query.trim() || (displayDoctorName(doctor) + " " + doctor.specialization)
      .toLowerCase().includes(query.trim().toLowerCase()))
  )), [doctors, specialization, query]);

  const handleBookAppointment = (doctorId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { redirectTo: "/book/" + doctorId } });
      return;
    }
    navigate("/book/" + doctorId);
  };

  return (
    <section className="container doctor-directory" aria-labelledby="our-doctors-heading">
      <div className="doctor-directory-heading">
        <div>
          <span className="home-section-eyebrow">MEET THE CARE TEAM</span>
          <h2 id="our-doctors-heading">Our Doctors</h2>
          <p>Explore sample profiles, compare specialties, and check dates before booking.</p>
        </div>
        <span className="doctor-directory-heading-icon" aria-hidden="true">✚</span>
      </div>

      {loading && <div className="text-center doctor-directory-status"><h5>Loading doctors...</h5></div>}
      {!loading && error && <div className="alert alert-danger text-center">{error}</div>}
      {!loading && !error && doctors.length === 0 && (
        <div className="alert alert-warning text-center">No approved doctors found.</div>
      )}

      {!loading && !error && doctors.length > 0 && (
        <>
          {doctors.some((doctor) => doctor.isDemo) && (
            <div className="doctor-directory-notice" role="note">
              <strong>Training booking environment.</strong> These fictional doctor profiles do
              not represent real licensed clinicians or clinics. Photos are illustrative only.
              Schedule and booking data are for software testing. Please do not enter real patient information.
            </div>
          )}
          <div className="doctor-directory-filters">
            <div className="doctor-directory-search">
              <label className="form-label" htmlFor="doctor-search">Search doctor or specialty</label>
              <input id="doctor-search" type="search" className="form-control"
                placeholder="Search doctors or specializations"
                value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="doctor-directory-select">
              <label className="form-label" htmlFor="doctor-specialization">Specialization</label>
              <select id="doctor-specialization" className="form-select"
                value={specialization} onChange={(event) => setSpecialization(event.target.value)}>
                <option value="all">All specializations ({specializations.length})</option>
                {specializations.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <p className="doctor-directory-count" aria-live="polite">
            Showing {filteredDoctors.length} of {doctors.length} doctor profiles
          </p>
          {filteredDoctors.length ? (
            <div className="row g-4">
              {filteredDoctors.map((doctor, index) => (
                <div key={doctor._id} className="col-12 col-md-6 col-xl-4">
                  <DoctorCard doctor={doctor} index={index} onBook={handleBookAppointment} />
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-light border text-center">No matching doctors. Try another specialization or search.</div>
          )}
          <p className="doctor-directory-footnote">
            Weekly hours show configured schedules, not guaranteed open appointments. Always use “Check slots”
            to confirm date-specific availability before booking.
          </p>
        </>
      )}
    </section>
  );
}

export default FeaturedDoctors;
