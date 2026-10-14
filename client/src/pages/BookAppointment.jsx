import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import API from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function BookAppointment() {
  const navigate = useNavigate();

  const { doctorId } = useParams();


  // ====================================
  // Doctor State
  // ====================================
  const [doctor, setDoctor] =
    useState(null);

  const [
    loadingDoctor,
    setLoadingDoctor,
  ] = useState(true);


  // ====================================
  // Appointment State
  // ====================================
  const [
    appointmentDate,
    setAppointmentDate,
  ] = useState("");

  const [
    appointmentTime,
    setAppointmentTime,
  ] = useState("");


  // ====================================
  // Slot State
  // ====================================
  const [
    availableSlots,
    setAvailableSlots,
  ] = useState([]);

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);

  const [
    slotInfo,
    setSlotInfo,
  ] = useState({
    message: "",
    dayName: "",
    blocked: false,
    slotDuration: null,
  });


  // ====================================
  // Submit State
  // ====================================
  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  // ====================================
  // Medical Document State
  // ====================================
  const [
    medicalDocument,
    setMedicalDocument,
  ] = useState(null);

  const allowedDocumentTypes =
    new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]);

  const maxDocumentSize =
    5 * 1024 * 1024;


  // ====================================
  // Get Today YYYY-MM-DD
  // ====================================
  const getTodayDate = () => {
    const now = new Date();

    const year =
      now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };


  // ====================================
  // Format HH:mm to AM/PM
  // ====================================
  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    const [
      hourString,
      minute,
    ] = time.split(":");

    let hour =
      Number(hourString);

    const period =
      hour >= 12
        ? "PM"
        : "AM";

    hour =
      hour % 12 || 12;

    return `${String(hour).padStart(
      2,
      "0"
    )}:${minute} ${period}`;
  };


  // ====================================
  // Format Date
  // ====================================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    const [
      year,
      month,
      day,
    ] = dateString
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    return date.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };


  // ====================================
  // Reset Slot Information
  // ====================================
  const resetSlotState = () => {
    setAvailableSlots([]);

    setAppointmentTime("");

    setSlotInfo({
      message: "",
      dayName: "",
      blocked: false,
      slotDuration: null,
    });
  };


  // ====================================
  // Load Doctor
  // ====================================
  useEffect(() => {
    let active = true;


    const fetchDoctor = async () => {
      setLoadingDoctor(true);

      try {
        const { data } =
          await API.get(
            `/doctor/${doctorId}`
          );


        if (
          active &&
          data.success
        ) {
          setDoctor(
            data.doctor
          );
        }

      } catch (error) {
        console.error(error);


        if (active) {
          setDoctor(null);

          toast.error(
            error.response?.data
              ?.message ||
              "Failed to load doctor details"
          );
        }

      } finally {
        if (active) {
          setLoadingDoctor(false);
        }
      }
    };


    fetchDoctor();


    return () => {
      active = false;
    };

  }, [doctorId]);


  // ====================================
  // Fetch Available Slots
  // ====================================
  const fetchAvailableSlots =
    useCallback(
      async (
        selectedDate,
        showErrorToast = true
      ) => {
        if (!selectedDate) {
          resetSlotState();

          return;
        }


        setLoadingSlots(true);

        setAppointmentTime("");


        try {
          const { data } =
            await API.get(
              "/appointment/available-slots",
              {
                params: {
                  doctorId,
                  appointmentDate:
                    selectedDate,
                },
              }
            );


          if (data.success) {
            setAvailableSlots(
              data.availableSlots ||
                []
            );

            setSlotInfo({
              message:
                data.message || "",

              dayName:
                data.dayName || "",

              blocked:
                Boolean(
                  data.blocked
                ),

              slotDuration:
                data.slotDuration ||
                null,
            });
          }

        } catch (error) {
          console.error(error);


          setAvailableSlots([]);

          setSlotInfo({
            message:
              error.response?.data
                ?.message ||
              "Unable to load available slots.",

            dayName: "",

            blocked: false,

            slotDuration: null,
          });


          if (showErrorToast) {
            toast.error(
              error.response?.data
                ?.message ||
                "Failed to load available time slots"
            );
          }

        } finally {
          setLoadingSlots(false);
        }
      },

      [
        doctorId,
      ]
    );


  // ====================================
  // Load Slots When Date Changes
  // ====================================
  useEffect(() => {
    if (!appointmentDate) {
      resetSlotState();

      return;
    }


    fetchAvailableSlots(
      appointmentDate
    );

  }, [
    appointmentDate,
    fetchAvailableSlots,
  ]);


  // ====================================
  // Date Change
  // ====================================
  const handleDateChange = (
    event
  ) => {
    const selectedDate =
      event.target.value;

    setAppointmentDate(
      selectedDate
    );

    setAppointmentTime("");
  };


  // ====================================
  // Select Time
  // ====================================
  const handleTimeSelect = (
    time
  ) => {
    if (submitting) {
      return;
    }

    setAppointmentTime(time);
  };


  // ====================================
  // Select Medical Document
  // ====================================
  const handleDocumentChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      setMedicalDocument(null);
      return;
    }

    if (
      !allowedDocumentTypes.has(
        file.type
      )
    ) {
      toast.error(
        "Only PDF, JPEG and PNG medical documents are allowed."
      );

      event.target.value = "";
      setMedicalDocument(null);
      return;
    }

    if (file.size > maxDocumentSize) {
      toast.error(
        "Medical document must not exceed 5 MB."
      );

      event.target.value = "";
      setMedicalDocument(null);
      return;
    }

    setMedicalDocument(file);
  };


  // ====================================
  // Book Appointment
  // ====================================
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();


    if (submitting) {
      return;
    }


    if (!appointmentDate) {
      toast.error(
        "Please select an appointment date"
      );

      return;
    }


    if (!appointmentTime) {
      toast.error(
        "Please select an available time slot"
      );

      return;
    }


    if (
      !availableSlots.includes(
        appointmentTime
      )
    ) {
      toast.error(
        "The selected time slot is no longer available"
      );

      await fetchAvailableSlots(
        appointmentDate,
        false
      );

      return;
    }


    setSubmitting(true);


    try {
      const formData =
        new FormData();

      formData.append(
        "doctorId",
        doctorId
      );

      formData.append(
        "appointmentDate",
        appointmentDate
      );

      formData.append(
        "appointmentTime",
        appointmentTime
      );

      if (medicalDocument) {
        formData.append(
          "medicalDocument",
          medicalDocument
        );
      }

      const { data } =
        await API.post(
          "/appointment/book",
          formData
        );


      toast.success(
        data.message ||
          "Appointment booked successfully"
      );


      navigate(
        "/my-appointments",
        {
          replace: true,
        }
      );

    } catch (error) {
      console.error(error);


      toast.error(
        error.response?.data
          ?.message ||
          "Failed to book appointment"
      );


      setAppointmentTime("");


      await fetchAvailableSlots(
        appointmentDate,
        false
      );

    } finally {
      setSubmitting(false);
    }
  };


  // ====================================
  // Loading Doctor
  // ====================================
  if (loadingDoctor) {
    return (
      <>
        <Navbar />

        <main className="container py-5">

          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <h5 className="mt-3">
              Loading doctor details...
            </h5>

          </div>

        </main>

        <Footer />
      </>
    );
  }


  // ====================================
  // Doctor Not Found
  // ====================================
  if (!doctor) {
    return (
      <>
        <Navbar />

        <main className="container py-5">

          <div className="row justify-content-center">

            <div className="col-lg-7">

              <div className="alert alert-danger text-center">

                <h5>
                  Doctor details could not
                  be loaded.
                </h5>

                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  onClick={() =>
                    navigate(
                      "/doctors"
                    )
                  }
                >
                  Back to Doctors
                </button>

              </div>

            </div>

          </div>

        </main>

        <Footer />
      </>
    );
  }


  // ====================================
  // Main UI
  // ====================================
  return (
    <>
      <Navbar />


      <main className="container py-5">

        <div className="row justify-content-center">

          <div className="col-xl-9 col-lg-10">


            {/* =================================
                PAGE TITLE
            ================================= */}

            <div className="text-center mb-4">

              <h2 className="text-primary fw-bold">
                Book Appointment
              </h2>

              <p className="text-muted mb-0">
                Choose a date and select an
                available appointment time.
              </p>

            </div>


            {doctor.isDemo && (
              <div className="alert alert-info" role="note">
                <strong>Fictional demo doctor.</strong> This appointment is for
                software testing, not real healthcare. Use only synthetic
                information; do not upload real medical records.
              </div>
            )}

            <div className="row g-4">


              {/* =================================
                  DOCTOR INFORMATION
              ================================= */}

              <div className="col-lg-5">

                <div className="card shadow border-0 rounded-4 h-100">

                  <div className="card-body p-4">


                    <div className="text-center mb-4">

                      <div
                        className="
                          bg-primary
                          bg-opacity-10
                          rounded-circle
                          d-inline-flex
                          align-items-center
                          justify-content-center
                        "
                        style={{
                          width: "80px",
                          height: "80px",
                          fontSize: "38px",
                        }}
                      >
                        👨‍⚕️
                      </div>


                      <h3 className="text-primary fw-bold mt-3 mb-1">
                        {doctor.fullName}
                      </h3>


                      <span className="badge bg-primary fs-6">
                        {doctor.specialization}
                      </span>

                    </div>


                    <hr />


                    <div className="mb-3">

                      <div className="text-muted small">
                        Experience
                      </div>

                      <div className="fw-semibold">
                        {doctor.experience}
                      </div>

                    </div>


                    <div className="mb-3">

                      <div className="text-muted small">
                        Consultation Fee
                      </div>

                      <div className="fw-bold text-success fs-5">
                        ₹{doctor.fees}
                      </div>

                    </div>


                    <div className="mb-3">

                      <div className="text-muted small">
                        Clinic Address
                      </div>

                      <div className="fw-semibold">
                        {doctor.address}
                      </div>

                    </div>


                    {doctor.slotDuration && (

                      <div className="alert alert-light border mt-4 mb-0">

                        <strong>
                          Appointment Duration:
                        </strong>{" "}

                        {doctor.slotDuration} minutes

                      </div>

                    )}

                  </div>

                </div>

              </div>


              {/* =================================
                  BOOKING SECTION
              ================================= */}

              <div className="col-lg-7">

                <div className="card shadow border-0 rounded-4 h-100">

                  <div className="card-body p-4">


                    <h4 className="fw-bold mb-4">
                      Select Appointment
                    </h4>


                    <form
                      onSubmit={
                        handleSubmit
                      }
                    >


                      {/* =========================
                          DATE
                      ========================= */}

                      <div className="mb-4">

                        <label className="form-label fw-bold">
                          📅 Appointment Date
                        </label>


                        <input
                          type="date"
                          className="
                            form-control
                            form-control-lg
                          "
                          min={
                            getTodayDate()
                          }
                          value={
                            appointmentDate
                          }
                          onChange={
                            handleDateChange
                          }
                          disabled={
                            submitting
                          }
                          required
                        />


                        {appointmentDate && (

                          <div className="text-muted small mt-2">

                            Selected:{" "}

                            <strong>
                              {formatDate(
                                appointmentDate
                              )}
                            </strong>

                          </div>

                        )}

                      </div>


                      {/* =========================
                          NO DATE SELECTED
                      ========================= */}

                      {!appointmentDate && (

                        <div className="alert alert-info">

                          <strong>
                            Choose a date first
                          </strong>

                          <div className="small mt-1">
                            Available appointment
                            times will appear here
                            automatically.
                          </div>

                        </div>

                      )}


                      {/* =========================
                          LOADING SLOTS
                      ========================= */}

                      {appointmentDate &&
                        loadingSlots && (

                        <div className="text-center py-4">

                          <div
                            className="
                              spinner-border
                              text-primary
                            "
                            role="status"
                          />

                          <p className="mt-3 mb-0">
                            Checking doctor's
                            availability...
                          </p>

                        </div>

                      )}


                      {/* =========================
                          NO AVAILABLE SLOTS
                      ========================= */}

                      {appointmentDate &&
                        !loadingSlots &&
                        availableSlots.length ===
                          0 && (

                        <div className="alert alert-warning">

                          <h6 className="fw-bold mb-2">

                            {slotInfo.blocked
                              ? "Doctor unavailable on this date"
                              : "No appointment times available"}

                          </h6>


                          <div>

                            {slotInfo.message ||
                              "Please choose another date."}

                          </div>


                          {slotInfo.dayName && (

                            <div className="small mt-2">

                              Selected day:{" "}

                              <strong>
                                {
                                  slotInfo.dayName
                                }
                              </strong>

                            </div>

                          )}

                        </div>

                      )}


                      {/* =========================
                          AVAILABLE SLOTS
                      ========================= */}

                      {appointmentDate &&
                        !loadingSlots &&
                        availableSlots.length >
                          0 && (

                        <div className="mb-4">


                          <div
                            className="
                              d-flex
                              flex-wrap
                              justify-content-between
                              align-items-center
                              gap-2
                              mb-3
                            "
                          >

                            <label className="form-label fw-bold mb-0">
                              🕒 Available Times
                            </label>


                            {slotInfo.slotDuration && (

                              <span className="badge bg-light text-dark border">

                                {
                                  slotInfo.slotDuration
                                }{" "}
                                min each

                              </span>

                            )}

                          </div>


                          {slotInfo.dayName && (

                            <p className="text-muted small">

                              Available appointments
                              for{" "}

                              <strong>
                                {
                                  slotInfo.dayName
                                }
                              </strong>

                            </p>

                          )}


                          <div className="d-flex flex-wrap gap-2">

                            {availableSlots.map(
                              (time) => {

                                const selected =
                                  appointmentTime ===
                                  time;


                                return (

                                  <button
                                    key={time}
                                    type="button"
                                    className={
                                      selected
                                        ? "btn btn-primary px-3 py-2"
                                        : "btn btn-outline-primary px-3 py-2"
                                    }
                                    disabled={
                                      submitting
                                    }
                                    onClick={() =>
                                      handleTimeSelect(
                                        time
                                      )
                                    }
                                    aria-pressed={
                                      selected
                                    }
                                  >

                                    {selected &&
                                      "✓ "}

                                    {formatTime(
                                      time
                                    )}

                                  </button>

                                );
                              }
                            )}

                          </div>


                          <div className="text-muted small mt-3">

                            Showing{" "}

                            <strong>
                              {
                                availableSlots.length
                              }
                            </strong>{" "}

                            available appointment
                            {availableSlots.length ===
                            1
                              ? ""
                              : "s"}.

                          </div>

                        </div>

                      )}


                      {/* =========================
                          MEDICAL DOCUMENT
                      ========================= */}

                      <div className="mb-4">

                        <label
                          htmlFor="medicalDocument"
                          className="form-label fw-bold"
                        >
                          📄 Medical Document
                          <span className="text-muted fw-normal">
                            {" "}(Optional)
                          </span>
                        </label>

                        <input
                          id="medicalDocument"
                          type="file"
                          className="form-control"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={
                            handleDocumentChange
                          }
                          disabled={
                            submitting
                          }
                        />

                        <div className="form-text">
                          PDF, JPEG or PNG only.
                          Maximum file size: 5 MB.
                        </div>

                        {medicalDocument && (

                          <div className="alert alert-success py-2 mt-2 mb-0">

                            Selected:{" "}

                            <strong>
                              {
                                medicalDocument.name
                              }
                            </strong>

                          </div>

                        )}

                      </div>


                      {/* =========================
                          APPOINTMENT SUMMARY
                      ========================= */}

                      {appointmentDate &&
                        appointmentTime && (

                        <div className="card border-success bg-success bg-opacity-10 mb-4">

                          <div className="card-body">

                            <h5 className="text-success fw-bold mb-3">
                              Appointment Summary
                            </h5>


                            <div className="mb-2">

                              <strong>
                                Doctor:
                              </strong>{" "}

                              {doctor.fullName}

                            </div>


                            <div className="mb-2">

                              <strong>
                                Date:
                              </strong>{" "}

                              {formatDate(
                                appointmentDate
                              )}

                            </div>


                            <div className="mb-2">

                              <strong>
                                Time:
                              </strong>{" "}

                              {formatTime(
                                appointmentTime
                              )}

                            </div>


                            <div>

                              <strong>
                                Fee:
                              </strong>{" "}

                              ₹{doctor.fees}

                            </div>

                          </div>

                        </div>

                      )}


                      {/* =========================
                          SUBMIT BUTTON
                      ========================= */}

                      <button
                        type="submit"
                        className="
                          btn
                          btn-primary
                          btn-lg
                          w-100
                        "
                        disabled={
                          submitting ||
                          loadingSlots ||
                          !appointmentDate ||
                          !appointmentTime
                        }
                      >

                        {submitting
                          ? "Booking Appointment..."
                          : "Confirm Appointment"}

                      </button>


                      {appointmentDate &&
                        !appointmentTime &&
                        availableSlots.length >
                          0 && (

                        <div className="text-center text-muted small mt-2">

                          Select one available time
                          to continue.

                        </div>

                      )}


                    </form>

                  </div>

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


export default BookAppointment;
