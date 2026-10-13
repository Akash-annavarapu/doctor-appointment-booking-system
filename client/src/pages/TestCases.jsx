import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  TEST_CASES,
  TEST_CASE_CATEGORIES,
  TEST_CASE_USE_CASES,
} from "../data/testCases";

function TestCases() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [useCase, setUseCase] = useState("all");
  const [priority, setPriority] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const visibleCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TEST_CASES.filter((item) => {
      const searchable = [
        item.id,
        item.useCase,
        item.category,
        item.scenario,
        item.expected,
        item.steps,
      ].join(" ").toLowerCase();

      return (!query || searchable.includes(query)) &&
        (category === "all" || item.category === category) &&
        (useCase === "all" || item.useCase === useCase) &&
        (priority === "all" || item.priority === priority);
    });
  }, [search, category, useCase, priority]);

  const totalUseCases = TEST_CASE_USE_CASES.length;
  const p0Count = TEST_CASES.filter((item) => item.priority === "P0").length;

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setUseCase("all");
    setPriority("all");
    setExpandedId(null);
  };

  return (
    <>
      <Navbar />
      <main className="container testpilot-library py-4 py-md-5">
        <header className="testpilot-intro mb-4">
          <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
            <span className="testpilot-eyebrow">TESTPILOT / CASE LIBRARY</span>
            <span className="testpilot-status-label">Design catalog · not execution results</span>
          </div>
          <h1 className="fw-bold mb-2">Explore test cases</h1>
          <p className="mb-0">
            Review the 36 code-grounded scenarios for our healthcare
            booking system. These are designed test cases; no passing
            result is claimed until a test run produces verified evidence.
          </p>
        </header>

        <div className="row g-3 mb-4" aria-label="Catalog summary">
          <div className="col-6 col-lg-4">
            <div className="testpilot-stat">
              <div className="testpilot-stat-value">{TEST_CASES.length}</div>
              <div className="testpilot-stat-label">Designed cases</div>
            </div>
          </div>
          <div className="col-6 col-lg-4">
            <div className="testpilot-stat">
              <div className="testpilot-stat-value">{totalUseCases}</div>
              <div className="testpilot-stat-label">Covered use cases</div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="testpilot-stat">
              <div className="testpilot-stat-value">{p0Count}</div>
              <div className="testpilot-stat-label">High-priority (P0) cases</div>
            </div>
          </div>
        </div>

        <section className="testpilot-filters mb-4" aria-label="Test case filters">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label" htmlFor="testpilot-search">Search cases</label>
              <input
                id="testpilot-search"
                className="form-control"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ID, scenario or expected result"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="testpilot-category">Category</label>
              <select
                id="testpilot-category"
                className="form-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {TEST_CASE_CATEGORIES.map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="testpilot-usecase">Use case</label>
              <select
                id="testpilot-usecase"
                className="form-select"
                value={useCase}
                onChange={(event) => setUseCase(event.target.value)}
              >
                <option value="all">All use cases</option>
                {TEST_CASE_USE_CASES.map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="testpilot-priority">Priority</label>
              <select
                id="testpilot-priority"
                className="form-select"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="P0">P0 — Critical</option>
                <option value="P1">P1 — Important</option>
                <option value="P2">P2 — Additional</option>
              </select>
            </div>
            <div className="col-md-8 d-flex align-items-end justify-content-md-end">
              <button className="btn btn-outline-primary" type="button" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          </div>
        </section>

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="h5 m-0" aria-live="polite">
            Showing {visibleCases.length} of {TEST_CASES.length} cases
          </h2>
          <span className="text-secondary small">
            Read-only catalog · all test results currently Not run
          </span>
        </div>

        {visibleCases.length === 0 ? (
          <div className="testpilot-empty">
            <h3 className="h5">No matching test cases</h3>
            <p>Try a different search term or clear the filters.</p>
            <button className="btn btn-primary" onClick={resetFilters} type="button">
              Show all cases
            </button>
          </div>
        ) : (
          <div className="row g-3">
            {visibleCases.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div className="col-12 col-xl-6" key={item.id}>
                  <article className="testpilot-case h-100">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <span className="testpilot-id">{item.id}</span>
                      <span className="testpilot-not-run">Not run</span>
                    </div>
                    <h3 className="h6 fw-bold mb-3">{item.scenario}</h3>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="testpilot-chip">{item.category}</span>
                      <span className="testpilot-chip">{item.useCase}</span>
                      <span className="testpilot-chip">{item.priority}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      aria-expanded={isExpanded}
                      aria-controls={`details-${item.id}`}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                    {isExpanded && (
                      <div id={`details-${item.id}`} className="testpilot-detail mt-3">
                        <p className="mb-2"><strong>Test steps:</strong> {item.steps}</p>
                        <p className="mb-2"><strong>Expected result:</strong> {item.expected}</p>
                        <p className="mb-0"><strong>Source:</strong> {item.evidence}</p>
                      </div>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        )}

        <p className="testpilot-catalog-note mt-4">
          Documentation and traceability:{" "}
          <a
            href="https://github.com/Akash-annavarapu/doctor-appointment-booking-system/blob/main/docs/TEST_CASE_MATRIX.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            View the test-case matrix on GitHub
          </a>.
          Automated tests in the source repository run separately; they do not
          update this static catalog with results.
        </p>
      </main>
      <Footer />
    </>
  );
}

export default TestCases;
