import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import API from "../../services/api";
import {
  useAuth,
} from "../../context/AuthContext";

import FeaturedDoctors from "../FeaturedDoctors";


vi.mock(
  "../../services/api",
  () => ({
    default: {
      get: vi.fn(),
    },
  })
);


vi.mock(
  "../../context/AuthContext",
  () => ({
    useAuth: vi.fn(),
  })
);


// ======================================
// Location Probe
// ======================================
function LocationProbe() {
  const location = useLocation();

  return (
    <>
      <div data-testid="pathname">
        {location.pathname}
      </div>

      <div data-testid="redirect-state">
        {location.state?.redirectTo || ""}
      </div>
    </>
  );
}


// ======================================
// Test Router
// ======================================
const renderFeaturedDoctors = () =>
  render(
    <MemoryRouter
      initialEntries={["/doctors"]}
    >
      <Routes>
        <Route
          path="/doctors"
          element={<FeaturedDoctors />}
        />

        <Route
          path="*"
          element={<LocationProbe />}
        />
      </Routes>
    </MemoryRouter>
  );


// ======================================
// Test Data
// ======================================
const doctors = [
  {
    _id: "doctor-1",
    fullName: "Dr. Anjali Rao",
    specialization: "Cardiology",
    experience: 8,
    fees: 500,
  },
  {
    _id: "doctor-2",
    fullName: "Dr. Ravi Kumar",
    specialization: "Dermatology",
    experience: 5,
    fees: 400,
  },
];


// ======================================
// Featured Doctors
// ======================================
describe(
  "FeaturedDoctors",
  () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });
    });


    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    test(
      "shows loading state while doctors are being fetched",
      () => {
        API.get.mockReturnValue(
          new Promise(() => {})
        );

        renderFeaturedDoctors();

        expect(
          screen.getByText(
            "Loading doctors..."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "renders fictional demo specialist and scheduled days",
      async () => {
        API.get.mockResolvedValue({
          data: {
            success: true,
            doctors: [{
              _id: "demo-1",
              isDemo: true,
              fullName: "Dr. Demo Aarya",
              specialization: "General Medicine",
              experience: "6 years (fictional)",
              fees: 320,
              slotDuration: 30,
              weeklyAvailability: [{
                day: "Monday",
                enabled: true,
                sessions: [{ startTime: "09:00", endTime: "12:00" }],
              }],
            }],
          },
        });

        renderFeaturedDoctors();
        expect(await screen.findByText("Dr. Demo Aarya")).toBeInTheDocument();
        expect(screen.getByText("Monday")).toBeInTheDocument();
        expect(screen.getByText("Fictional demo profile")).toBeInTheDocument();
        expect(screen.getByText(/training\/demo appointments only/i)).toBeInTheDocument();
        expect(screen.getByText("30-minute appointments")).toBeInTheDocument();
      }
    );

    test(
      "filters 2 doctors by specialization and restores all",
      async () => {
        API.get.mockResolvedValue({
          data: { success: true, doctors },
        });
        renderFeaturedDoctors();
        await screen.findByText("Dr. Anjali Rao");

        fireEvent.change(screen.getByLabelText("Specialization"), {
          target: { value: "Cardiology" },
        });

        expect(screen.getByText("Dr. Anjali Rao")).toBeInTheDocument();
        expect(screen.queryByText("Dr. Ravi Kumar")).not.toBeInTheDocument();
        expect(screen.getByText("Showing 1 of 2 doctor profiles")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Specialization"), {
          target: { value: "all" },
        });
        expect(screen.getByText("Showing 2 of 2 doctor profiles")).toBeInTheDocument();
      }
    );

    test(
      "checks open slots through public read-only backend endpoint",
      async () => {
        API.get.mockImplementation(async (path) => {
          if (path === "/doctor/all") {
            return { data: { success: true, doctors: [doctors[0]] } };
          }
          if (path === "/doctor/available-slots") {
            return { data: { success: true, availableSlots: ["09:00", "09:30"] } };
          }
          throw new Error("Unexpected API request");
        });

        renderFeaturedDoctors();
        await screen.findByText("Dr. Anjali Rao");
        fireEvent.change(
          screen.getByLabelText("Appointment date for Dr. Anjali Rao"),
          { target: { value: "2030-06-03" } }
        );
        fireEvent.click(screen.getByRole("button", { name: "Check slots" }));

        await waitFor(() => expect(API.get).toHaveBeenCalledWith(
          "/doctor/available-slots",
          { params: { doctorId: "doctor-1", appointmentDate: "2030-06-03" } }
        ));
        expect(await screen.findByText("2 open slots on 2030-06-03")).toBeInTheDocument();
      }
    );

    test(
      "loads and displays doctors from the API",
      async () => {
        API.get.mockResolvedValue({
          data: {
            success: true,
            doctors,
          },
        });

        renderFeaturedDoctors();

        expect(
          await screen.findByText(
            "Dr. Anjali Rao"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Dr. Ravi Kumar"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText("Cardiology")
        ).toBeInTheDocument();

        expect(
          screen.getByText("Dermatology")
        ).toBeInTheDocument();

        expect(API.get).toHaveBeenCalledWith(
          "/doctor/all"
        );
      }
    );


    test(
      "shows empty state when no approved doctors are returned",
      async () => {
        API.get.mockResolvedValue({
          data: {
            success: true,
            doctors: [],
          },
        });

        renderFeaturedDoctors();

        expect(
          await screen.findByText(
            "No approved doctors found."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "shows server error message when doctor loading fails",
      async () => {
        API.get.mockRejectedValue({
          response: {
            data: {
              message:
                "Unable to fetch doctors",
            },
          },
        });

        renderFeaturedDoctors();

        expect(
          await screen.findByText(
            "Unable to fetch doctors"
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "shows connection error when the server cannot be reached",
      async () => {
        API.get.mockRejectedValue(
          new Error("Network Error")
        );

        renderFeaturedDoctors();

        expect(
          await screen.findByText(
            "Unable to connect to the server."
          )
        ).toBeInTheDocument();
      }
    );


    test(
      "redirects unauthenticated users to login and preserves booking destination",
      async () => {
        API.get.mockResolvedValue({
          data: {
            success: true,
            doctors: [doctors[0]],
          },
        });

        renderFeaturedDoctors();

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name: "Book Appointment",
            }
          )
        );

        await waitFor(() => {
          expect(
            screen.getByTestId("pathname")
          ).toHaveTextContent("/login");
        });

        expect(
          screen.getByTestId(
            "redirect-state"
          )
        ).toHaveTextContent(
          "/book/doctor-1"
        );
      }
    );


    test(
      "navigates authenticated users directly to booking page",
      async () => {
        useAuth.mockReturnValue({
          isAuthenticated: true,
        });

        API.get.mockResolvedValue({
          data: {
            success: true,
            doctors: [doctors[0]],
          },
        });

        renderFeaturedDoctors();

        fireEvent.click(
          await screen.findByRole(
            "button",
            {
              name: "Book Appointment",
            }
          )
        );

        await waitFor(() => {
          expect(
            screen.getByTestId("pathname")
          ).toHaveTextContent(
            "/book/doctor-1"
          );
        });
      }
    );
  }
);
