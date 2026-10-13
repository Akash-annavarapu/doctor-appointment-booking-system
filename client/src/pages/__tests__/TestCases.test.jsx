import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import TestCases from "../TestCases";
import { TEST_CASES } from "../../data/testCases";

vi.mock("../../components/Navbar", () => ({ default: () => <div>Navbar</div> }));
vi.mock("../../components/Footer", () => ({ default: () => <div>Footer</div> }));

const renderLibrary = () => render(
  <MemoryRouter>
    <TestCases />
  </MemoryRouter>
);

describe("TestPilot 36-case design catalog", () => {
  afterEach(() => cleanup());

  test("shows exactly the 36 documented unique case IDs with Not run status", () => {
    expect(TEST_CASES).toHaveLength(36);
    expect(new Set(TEST_CASES.map((item) => item.id)).size).toBe(36);
    expect(TEST_CASES[0].id).toBe("TP-001");
    expect(TEST_CASES[35].id).toBe("TP-036");
    expect(TEST_CASES.every((item) => item.status === "Not run")).toBe(true);

    renderLibrary();

    expect(screen.getByRole("heading", { name: /explore test cases/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Showing 36 of 36 cases" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "View details" })).toHaveLength(36);
    expect(screen.getAllByText("Not run")).toHaveLength(36);
  });

  test("searches by case ID and exposes code-grounded steps and expectations", () => {
    renderLibrary();
    fireEvent.change(screen.getByLabelText("Search cases"), {
      target: { value: "TP-025" },
    });

    expect(screen.getByRole("heading", { name: "Showing 1 of 36 cases" })).toBeInTheDocument();
    expect(screen.getByText("TP-025")).toBeInTheDocument();
    expect(screen.queryByText("TP-023")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText(/Test steps:/)).toBeInTheDocument();
    expect(screen.getByText(/Expected result:/)).toBeInTheDocument();
    expect(screen.getByText(/Source:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide details" })).toHaveAttribute("aria-expanded", "true");
  });

  test("filters by category, use case and priority", () => {
    renderLibrary();

    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Concurrency" } });
    expect(screen.getByRole("heading", { name: "Showing 1 of 36 cases" })).toBeInTheDocument();
    expect(screen.getByText("TP-025")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Use case"), { target: { value: "UC-01" } });
    expect(screen.getByRole("heading", { name: "Showing 0 of 36 cases" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "P0" } });
    const p0Cases = TEST_CASES.filter((item) => item.priority === "P0").length;
    expect(screen.getByRole("heading", { name: `Showing ${p0Cases} of 36 cases` })).toBeInTheDocument();
  });

  test("shows an empty state and restores all cases", () => {
    renderLibrary();
    fireEvent.change(screen.getByLabelText("Search cases"), {
      target: { value: "does-not-exist-example" },
    });

    expect(screen.getByRole("heading", { name: "No matching test cases" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all cases" }));
    expect(screen.getByRole("heading", { name: "Showing 36 of 36 cases" })).toBeInTheDocument();
  });

  test("all cases retain use-case, priority, expected result and trace reference", () => {
    expect(TEST_CASES.every((item) =>
      /^TP-\d{3}$/.test(item.id) &&
      /^UC-\d{2}$/.test(item.useCase) &&
      ["P0", "P1", "P2"].includes(item.priority) &&
      item.scenario.length > 0 &&
      item.steps.length > 0 &&
      item.expected.length > 0 &&
      item.evidence.length > 0
    )).toBe(true);
  });
});
