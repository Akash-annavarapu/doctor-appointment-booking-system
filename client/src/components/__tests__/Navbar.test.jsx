import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  afterEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  useAuth,
} from "../../context/AuthContext";

import Navbar from "../Navbar";


vi.mock(
  "../../context/AuthContext",
  () => ({
    useAuth: vi.fn(),
  })
);


vi.mock(
  "../NotificationBell",
  () => ({
    default: () => (
      <div data-testid="notification-bell">
        Notification Bell
      </div>
    ),
  })
);


// ======================================
// Location Probe
// ======================================
function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
    </div>
  );
}


// ======================================
// Render Navbar
// ======================================
const renderNavbar = ({
  user = null,
  isAuthenticated = Boolean(user),
  clearSession = vi.fn(),
} = {}) => {
  useAuth.mockReturnValue({
    user,
    isAuthenticated,
    clearSession,
  });

  return {
    clearSession,
    ...render(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />

        <Routes>
          <Route
            path="*"
            element={<LocationProbe />}
          />
        </Routes>
      </MemoryRouter>
    ),
  };
};


// ======================================
// Navbar Tests
// ======================================
describe(
  "Navbar",
  () => {
    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });


    test(
      "hides notification bell for unauthenticated users",
      () => {
        renderNavbar();

        expect(
          screen.queryByTestId(
            "notification-bell"
          )
        ).not.toBeInTheDocument();

        expect(
          screen.getByText("Login")
        ).toBeInTheDocument();

        expect(
          screen.getByText("Register")
        ).toBeInTheDocument();

        expect(
          screen.getByRole("link", { name: "Test Cases" })
        ).toHaveAttribute("href", "/test-cases");
      }
    );


    test(
      "shows notification bell for authenticated users",
      () => {
        renderNavbar({
          user: {
            isAdmin: false,
            isDoctor: false,
          },
        });

        expect(
          screen.getByTestId(
            "notification-bell"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText("Dashboard")
        ).toBeInTheDocument();

        expect(
          screen.getByText("Logout")
        ).toBeInTheDocument();

        expect(
          screen.queryByText("Login")
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText("Register")
        ).not.toBeInTheDocument();
      }
    );


    test.each([
      [
        "normal user",
        {
          isAdmin: false,
          isDoctor: false,
        },
        "/user/dashboard",
      ],
      [
        "doctor",
        {
          isAdmin: false,
          isDoctor: true,
        },
        "/doctor/dashboard",
      ],
      [
        "admin",
        {
          isAdmin: true,
          isDoctor: false,
        },
        "/admin/dashboard",
      ],
    ])(
      "uses correct dashboard link for %s",
      (
        _role,
        user,
        expectedPath
      ) => {
        renderNavbar({
          user,
        });

        expect(
          screen.getByText("Dashboard")
        ).toHaveAttribute(
          "href",
          expectedPath
        );
      }
    );


    test(
      "clears session and redirects to login on logout",
      () => {
        const clearSession = vi.fn();

        renderNavbar({
          user: {
            isAdmin: false,
            isDoctor: false,
          },
          clearSession,
        });

        fireEvent.click(
          screen.getByText("Logout")
        );

        expect(
          clearSession
        ).toHaveBeenCalledTimes(1);

        expect(
          screen.getByTestId("location")
        ).toHaveTextContent("/login");
      }
    );
  }
);
