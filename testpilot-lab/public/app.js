"use strict";

const form = document.querySelector("#generate-form");
const select = document.querySelector("#story-select");
const storyInput = document.querySelector("#story-input");
const urlInput = document.querySelector("#url-input");
const meta = document.querySelector("#story-meta");
const inspectionBox = document.querySelector("#inspection");
const message = document.querySelector("#message");
const caseBox = document.querySelector("#cases");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");
const footer = document.querySelector("#results-footer");
const generateButton = document.querySelector("#generate-button");
const inspectButton = document.querySelector("#inspect-button");
const exportButton = document.querySelector("#export-button");
let stories = [];
let currentResult = null;
let currentReview = null;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}

function clearMessage() { message.textContent = ""; message.className = "message"; }
function showMessage(text, failed = false) {
  message.textContent = text;
  message.className = failed ? "message error" : "message success";
}

async function request(endpoint, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("The lab returned an unreadable response."); }
  if (!response.ok) throw new Error(payload.message || "Request failed.");
  return payload;
}

async function loadStories() {
  try {
    const response = await fetch("/api/stories");
    if (!response.ok) throw new Error("Story catalog is unavailable.");
    const data = await response.json();
    stories = data.stories;
    urlInput.value = data.targetUrl;
    document.querySelector("#story-count").textContent = String(stories.length);
    select.replaceChildren();
    for (const story of stories) {
      const option = node("option", "", story.id + " · " + story.title);
      option.value = story.id;
      select.append(option);
    }
    if (stories.length) { select.value = stories[0].id; displaySelectedStory(); }
  } catch (error) {
    select.replaceChildren(node("option", "", "Stories unavailable"));
    showMessage(error.message, true);
  }
}

function displaySelectedStory() {
  const selected = stories.find(s => s.id === select.value);
  if (!selected) return;
  storyInput.value = selected.story;
  meta.replaceChildren();
  for (const detail of [selected.actor, selected.useCase,
    selected.target.method + " " + selected.target.path]) meta.append(node("span", "meta-chip", detail));
  const criteria = node("p", "criteria",
    "Acceptance criteria: " + selected.acceptanceCriteria.join(" · "));
  meta.append(criteria);
  showProbeOptions().catch(() => { document.querySelector('#available-probes').textContent = 'Probe catalog unavailable.'; });
}

function displayInspection(data) {
  const info = data.inspection;
  inspectionBox.replaceChildren();
  const partial = info.inspectionStatus === "PARTIAL";
  inspectionBox.append(node("strong", "",
    (partial ? "Partial inspection" : "Live URL verified") + " · " + info.page.title));
  const catalog = info.publicDoctorCatalog;
  inspectionBox.append(node("p", "", catalog.available === false || catalog.approvedCount === null
    ? "Doctor API unavailable: no current doctor count was verified."
    : "Public doctor records: " + catalog.approvedCount +
      " · Specialties: " + catalog.specialties.length));
  inspectionBox.append(node("small", "", info.evidenceScope));
}

function renderResult(data) {
  currentResult = data;
  currentReview = null;
  document.querySelector("#review-message").textContent = "No case has been reviewed yet.";
  document.querySelector("#export-review-button").hidden = true;
  clearMessage();
  caseBox.replaceChildren();
  empty.hidden = true;
  footer.hidden = false;
  document.querySelector("#generated-execution").hidden = !data.receipt;
  document.querySelector("#generated-run-message").textContent = "";
  document.querySelector("#generated-run-results").replaceChildren();
  document.querySelector("#evaluation-result").replaceChildren();
  document.querySelector("#browser-plan-result").replaceChildren();
  currentEvaluation = null;
  document.querySelector("#export-evaluation-button").hidden = true;
  count.textContent = data.cases.length + " candidates";
  const sessionCount = document.querySelector("#ai-case-count");
  if (sessionCount) sessionCount.textContent = String(data.cases.length);
  displayInspection(data);
  for (const item of data.cases) {
    const card = node("article", "test-card");
    const top = node("div", "case-top");
    top.append(node("span", "case-id", item.id));
    top.append(node("span", "type-chip", item.type));
    top.append(node("span", "priority", item.priority));
    top.append(node("span", "not-run", "NOT RUN"));
    const reviewLabel = node("label", "approval-label");
    reviewLabel.append(node("span", "", "Review decision"));
    const decision = node("select", "ai-case-decision");
    decision.setAttribute("aria-label", "Review decision for " + item.id);
    for (const [value, label] of [
      ["DRAFT", "Not reviewed"], ["APPROVED", "Approve"], ["REJECTED", "Reject"]
    ]) {
      const option = node("option", "", label);
      option.value = value;
      decision.append(option);
    }
    reviewLabel.append(decision);
    top.append(reviewLabel);
    card.dataset.caseId = item.id;
    card.append(top);
    card.append(node("p", "probe-label", item.probeId && item.probeId !== "NONE"
      ? "Bound to a fixed audited GET assertion: " + item.probeId +
        ". Edited narrative steps are not executed as code."
      : "No audited live probe. Requires a separate isolated, source-reviewed Playwright test."));
    for (const [field, label, value] of [
      ["title", "Description", item.title],
      ["preconditions", "Preconditions", item.preconditions],
      ["testData", "Synthetic test data", item.testData],
      ["steps", "Actions — one step per line", item.steps.join("\n")],
      ["expectedResult", "Expected result", item.expectedResult]
    ]) {
      const fieldId = "review-" + item.id + "-" + field;
      const fieldLabel = node("label", "review-field-label", label);
      fieldLabel.htmlFor = fieldId;
      const editor = node("textarea", "review-field");
      editor.id = fieldId;
      editor.dataset.field = field;
      editor.rows = field === "steps" ? 4 : field === "title" ? 2 : 3;
      editor.maxLength = field === "steps" ? 2500 : 650;
      editor.value = value;
      card.append(fieldLabel, editor);
    }
    const noteLabel = node("label", "review-field-label", "Reviewer note / identified gap");
    const notes = node("textarea", "review-notes");
    notes.rows = 2;
    notes.maxLength = 1000;
    notes.placeholder = "Explain any correction, missing scenario or rejection";
    card.append(noteLabel, notes);
    const change = () => {
      currentReview = null;
      document.querySelector("#review-message").textContent =
        "Review edits are not approved yet. Save a new signed review before execution.";
      document.querySelector("#export-review-button").hidden = true;
    };
    card.querySelectorAll("textarea, select").forEach(control =>
      control.addEventListener("input", change));
    caseBox.append(card);
  }
  showMessage("AI candidates generated for " + data.storyId + ". " +
    (data.inspection?.inspectionStatus === "PARTIAL"
      ? "Only partial healthcare evidence was available; review the assumptions carefully. "
      : "") + "All cases are NOT RUN until independently verified.");
}

function setBusy(active, action) {
  generateButton.disabled = active;
  inspectButton.disabled = active;
  if (active) showMessage(action + " Live Render services may need time to respond.");
}

inspectButton.addEventListener("click", async () => {
  clearMessage(); setBusy(true, "Inspecting healthcare deployment.");
  try {
    const result = await request("/api/inspect", { targetUrl: urlInput.value });
    displayInspection(result);
    showMessage(result.inspection?.inspectionStatus === "PARTIAL"
      ? "Partial live inspection: one upstream service could not be verified. Test cases will be suggestions only."
      : "Live URL inspection completed using public read-only requests.");
  } catch (error) { showMessage(error.message, true); }
  finally { setBusy(false); }
});

form.addEventListener("submit", async event => {
  event.preventDefault(); clearMessage();
  if (!stories.length) return showMessage("Choose a documented story first.", true);
  setBusy(true, "Inspecting and generating test cases.");
  const startedAt = performance.now();
  const inputSnapshot = storyInput.value;
  const variantSnapshot = document.querySelector("#prompt-variant").value;
  const changeSnapshot = document.querySelector("#prompt-change").value.trim();
  try {
    const result = await request("/api/generate", {
      targetUrl: urlInput.value,
      storyId: select.value,
      storyText: storyInput.value,
      promptVariant: variantSnapshot,
      accessCode: document.querySelector("#access-code").value
    });
    renderResult(result);
    rememberRealGeneration(result, inputSnapshot, variantSnapshot, changeSnapshot,
      Math.round(performance.now() - startedAt));
  } catch (error) { showMessage(error.message, true); }
  finally { setBusy(false); }
});

exportButton.addEventListener("click", () => {
  if (!currentResult) return;
  const file = new Blob([JSON.stringify(currentResult, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "testpilot-" + currentResult.storyId.toLowerCase() + "-not-run.json";
  link.click();
  URL.revokeObjectURL(url);
});

select.addEventListener("change", displaySelectedStory);
loadStories();

// Configuration indicators are safe booleans only; never request or display secret values.
async function loadAiReadiness() {
  const status = document.querySelector("#ai-setup-status");
  try {
    const response = await fetch("/api/capabilities", { cache: "no-store" });
    if (!response.ok) throw Error("Service readiness cannot be checked right now.");
    const result = await response.json();
    if (typeof result.aiGenerationReady !== "boolean") throw Error("Invalid readiness response");
    status.classList.toggle("ready", result.aiGenerationReady);
    const navStatus = document.querySelector("#ai-nav-status");
    if (navStatus) {
      navStatus.textContent = result.aiGenerationReady ? "AI generator ready" : "AI setup needed";
      navStatus.classList.toggle("ready", result.aiGenerationReady);
    }
    const provider = result.aiProvider === "Google Gemini" ? "Google Gemini" : "OpenAI";
    if (result.aiGenerationReady) {
      status.textContent = provider + " is configured. Enter your Lab access code above and generate test cases.";
    } else {
      const knownNames = provider === "Google Gemini"
        ? ["GEMINI_API_KEY", "LAB_ACCESS_CODE"]
        : ["OPENAI_API_KEY", "LAB_ACCESS_CODE"];
      const missing = Array.isArray(result.missingSettings)
        ? result.missingSettings.filter(name => knownNames.includes(name)) : [];
      status.textContent = missing.length
        ? "Render is missing or has an invalid setting: " + missing.join(", ") +
          ". Open TestPilot Lab → Environment, correct it, then Save, deploy. No secret values are shown."
        : "AI setup is incomplete. Check the server environment variables in Render.";
    }
  } catch {
    status.classList.remove("ready");
    status.textContent = "AI configuration status is unavailable. You can still inspect and run safe checks.";
    const navStatus = document.querySelector("#ai-nav-status");
    if (navStatus) {
      navStatus.textContent = "AI status unavailable";
      navStatus.classList.remove("ready");
    }
  }
}
loadAiReadiness();


// The source LLM candidates never change. Reviewer edits and decisions are
// submitted separately and only execute after a server-signed review receipt.
function collectReviewDecisions() {
  if (!currentResult?.cases) throw Error("Generate AI cases first.");
  return currentResult.cases.map(item => {
    const card = [...caseBox.querySelectorAll(".test-card")]
      .find(el => el.dataset.caseId === item.id);
    if (!card) throw Error("The review form is incomplete.");
    const edits = {};
    card.querySelectorAll(".review-field").forEach(editor => {
      const field = editor.dataset.field;
      const value = field === "steps"
        ? editor.value.split("\n").map(step => step.trim()).filter(Boolean)
        : editor.value.trim();
      if (JSON.stringify(value) !== JSON.stringify(item[field])) edits[field] = value;
    });
    return {
      id: item.id,
      decision: card.querySelector(".ai-case-decision").value,
      notes: card.querySelector(".review-notes").value,
      edits
    };
  });
}

function approvedReviewIds() {
  if (!currentReview) throw Error("Save your signed review first.");
  const edited = collectReviewDecisions();
  if (JSON.stringify(edited) !== JSON.stringify(currentReview.decisions))
    throw Error("Review changed. Save it again before execution.");
  const ids = edited.filter(item => item.decision === "APPROVED").map(item => item.id);
  if (!ids.length) throw Error("Approve at least one candidate before execution.");
  return ids;
}
function reviewedPayload(selectedIds) {
  return {
    ...candidateReviewPayload(),
    decisions: currentReview.decisions,
    reviewReceipt: currentReview.reviewReceipt,
    selectedIds
  };
}
document.querySelector("#save-review-button").addEventListener("click", async () => {
  const status = document.querySelector("#review-message");
  const button = document.querySelector("#save-review-button");
  button.disabled = true;
  try {
    const decisions = collectReviewDecisions();
    const reply = await request("/api/review", {
      ...candidateReviewPayload(), decisions
    });
    currentReview = { decisions, reviewReceipt: reply.reviewReceipt, review: reply.review };
    status.textContent = "Signed review saved: " + reply.review.summary.approved +
      " approved, " + reply.review.summary.rejected + " rejected, " +
      reply.review.summary.draft + " still unreviewed. No tests were executed.";
    status.className = "message success";
    document.querySelector("#export-review-button").hidden = false;
  } catch (error) {
    status.textContent = error.message;
    status.className = "message error";
  } finally { button.disabled = false; }
});
document.querySelector("#export-review-button").addEventListener("click", () => {
  if (!currentReview) return;
  exportJsonFile("testpilot-reviewed-" + currentResult.storyId.toLowerCase() + ".json", {
    generatedBy: currentResult.generatedBy,
    model: currentResult.model,
    storyId: currentResult.storyId,
    generatedAt: currentResult.generatedAt,
    originalCases: currentResult.cases,
    reviewDecisions: currentReview.decisions,
    reviewedCases: currentReview.review.cases,
    summary: currentReview.review.summary,
    missingScenarios: document.querySelector("#missing-scenarios").value.trim(),
    identityVerified: false,
    executionScope: "HUMAN_REVIEWED_PROBE_ONLY"
  });
});
function exportJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

// Actual execution of source-reviewed GET probes; never execute arbitrary LLM code on Render.
const executeButton = document.querySelector("#execute-button");
const probeBox = document.querySelector("#available-probes");
const runSummary = document.querySelector("#run-summary");
const runResults = document.querySelector("#run-results");
const executionMessage = document.querySelector("#execution-message");
const runCount = document.querySelector("#run-count");
const exportRunButton = document.querySelector("#export-run-button");
let currentRun = null;

async function showProbeOptions() {
  probeBox.replaceChildren(node("span", "probe-note", "Loading approved read-only checks…"));
  const storyId = select.value;
  const reply = await fetch("/api/probes?storyId=" + encodeURIComponent(storyId));
  if (!reply.ok) throw new Error("Unable to load approved probes.");
  const data = await reply.json();
  if (select.value !== storyId) return;
  probeBox.replaceChildren();
  if (!data.checks.length) {
    probeBox.append(node("p", "probe-note",
      "This story needs an authenticated or state-changing workflow. Production execution will be SKIPPED; use isolated CI in the next milestone."));
  }
  for (const check of data.checks) {
    const item = node("div", "probe-item");
    item.append(node("strong", "", check.title));
    item.append(node("span", "", check.expected));
    probeBox.append(item);
  }
}

executeButton.addEventListener("click", async () => {
  executeButton.disabled = true;
  executionMessage.textContent = "Checking the live healthcare application via approved read-only requests…";
  executionMessage.className = "message";
  runSummary.replaceChildren();
  runResults.replaceChildren();
  exportRunButton.hidden = true;
  currentRun = null;
  try {
    const data = await request("/api/execute", {
      targetUrl: urlInput.value, storyId: select.value
    });
    currentRun = data.run;
    runCount.textContent = new Date(currentRun.timestamp).toLocaleString();
    for (const [name, value] of [
      ["PASSED", currentRun.summary.passed],
      ["FAILED", currentRun.summary.failed],
      ["SKIPPED", currentRun.summary.skipped],
      ["DURATION (ms)", currentRun.summary.durationMs]
    ]) {
      const item = node("div", "metric");
      item.append(node("strong", "", value));
      item.append(node("span", "", name));
      runSummary.append(item);
    }
    for (const result of currentRun.results) {
      const item = node("article", "run-card");
      const title = node("div", "run-card-top");
      title.append(node("strong", "", result.title));
      title.append(node("span", "status-chip " + result.status.toLowerCase(), result.status));
      item.append(title);
      item.append(node("p", "", result.expected));
      item.append(node("p", "actual", result.actual));
      item.append(node("small", "", result.scope + " · " + result.executionTime + "ms"));
      runResults.append(item);
    }
    executionMessage.textContent = "Measured read-only checks completed. These are limited probes, not full AI-case execution.";
    executionMessage.className = "message success";
    exportRunButton.hidden = false;
  } catch (error) {
    executionMessage.textContent = error.message;
    executionMessage.className = "message error";
  } finally { executeButton.disabled = false; }
});

exportRunButton.addEventListener("click", () => {
  if (!currentRun) return;
  const blob = new Blob([JSON.stringify(currentRun, null, 2)], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = "testpilot-live-" + currentRun.storyId.toLowerCase() + "-" +
    currentRun.runId.slice(0, 25) + ".json";
  anchor.click();
  URL.revokeObjectURL(blobUrl);
});


// Actual static CI evidence, sourced from measured GitHub Actions test reports.
const loadCiButton = document.querySelector("#load-ci-button");
const ciMessage = document.querySelector("#ci-message");
const ciResults = document.querySelector("#ci-results");
loadCiButton.addEventListener("click", async () => {
  loadCiButton.disabled = true;
  ciMessage.textContent = "Loading measured CI results from the healthcare backend…";
  ciResults.replaceChildren();
  try {
    const response = await fetch("/api/ci-results", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw Error(payload.message || "Unable to fetch CI results.");
    ciMessage.textContent = "Static-CI results come from GitHub Actions. They are not AI-generated test executions.";
    ciMessage.className = "message success";
    if (!payload.runs.length) ciResults.append(node("p", "probe-note", "No measured static CI runs are currently stored."));
    for (const run of payload.runs) {
      const item = node("article", "run-card");
      const top = node("div", "run-card-top");
      top.append(node("strong", "", run.suite));
      top.append(node("span", "status-chip " + (run.summary.failed ? "fail" : "pass"),
        run.summary.failed ? "FAILURES PRESENT" : "NO FAILED TESTS"));
      item.append(top);
      item.append(node("p", "", "Total: " + run.summary.total + " · Passed: " + run.summary.passed +
        " · Failed: " + run.summary.failed + " · Skipped: " + run.summary.skipped));
      item.append(node("small", "", "Run " + run.runId + " · " + run.timestamp + " · " + run.engine));
      if (Array.isArray(run.testResults) && run.testResults.length) {
        const details = node("details", "ci-case-details");
        details.append(node("summary", "", "View " + run.testResults.length + " measured assertions"));
        const rows = node("div", "ci-case-list");
        for (const measured of run.testResults) {
          const row = node("div", "ci-case-row");
          row.append(node("span", "ci-case-id", measured.id));
          row.append(node("span", "", measured.title));
          row.append(node("span", "status-chip " + measured.status.toLowerCase(), measured.status));
          rows.append(row);
        }
        details.append(rows);
        item.append(details);
      }
      ciResults.append(item);
    }
  } catch (error) {
    ciMessage.textContent = error.message;
    ciMessage.className = "message error";
  } finally {
    loadCiButton.disabled = false;
  }
});


// Run only explicitly approved candidate cases bound to audited, read-only GET checks.
// The server verifies a signed receipt from the original AI generation response.
const executeGeneratedButton = document.querySelector("#execute-generated-button");
const generatedRunMessage = document.querySelector("#generated-run-message");
const generatedRunResults = document.querySelector("#generated-run-results");
executeGeneratedButton.addEventListener("click", async () => {
  if (!currentResult?.receipt) {
    generatedRunMessage.textContent = "Generate a fresh AI test suite first.";
    generatedRunMessage.className = "message error";
    return;
  }
  let selectedIds;
  try { selectedIds = approvedReviewIds(); }
  catch (error) {
    generatedRunMessage.textContent = error.message;
    generatedRunMessage.className = "message error";
    return;
  }
  executeGeneratedButton.disabled = true;
  generatedRunResults.replaceChildren();
  generatedRunMessage.textContent = "Executing audited read-only assertions for approved cases…";
  generatedRunMessage.className = "message";
  try {
    const response = await request("/api/execute-reviewed", reviewedPayload(selectedIds));
    const run = response.run;
    generatedRunMessage.textContent = "Measured bound checks: " + run.summary.passed + " PASS, " +
      run.summary.failed + " FAIL, " + run.summary.skipped + " SKIPPED. " + run.interpretation;
    generatedRunMessage.className = "message success";
    for (const result of run.results) {
      const card = node("article", "run-card");
      const top = node("div", "run-card-top");
      top.append(node("strong", "", result.id + " · " + result.title));
      top.append(node("span", "status-chip " + result.status.toLowerCase(), result.status));
      card.append(top);
      card.append(node("p", "", result.expected));
      card.append(node("p", "actual", result.actual));
      card.append(node("small", "", result.scope + " · " + result.executionTime + " ms"));
      generatedRunResults.append(card);
    }
  } catch (error) {
    generatedRunMessage.textContent = error.message;
    generatedRunMessage.className = "message error";
  } finally {
    executeGeneratedButton.disabled = false;
  }
});


// Comparison is based on signed, current model candidates and an audited manual baseline.
// No count or category overlap is presented as semantic/requirements coverage proof.
const evaluateAiButton = document.querySelector("#evaluate-ai-button");
const evaluationResult = document.querySelector("#evaluation-result");
const exportEvaluationButton = document.querySelector("#export-evaluation-button");
let currentEvaluation = null;

function candidateReviewPayload() {
  if (!currentResult?.receipt) throw Error("Generate fresh Gemini cases first.");
  return {
    storyId: currentResult.storyId,
    targetUrl: currentResult.targetUrl,
    cases: currentResult.cases,
    receipt: currentResult.receipt,
    accessCode: document.querySelector("#access-code").value
  };
}

evaluateAiButton.addEventListener("click", async () => {
  evaluateAiButton.disabled = true;
  evaluationResult.replaceChildren(node("p", "probe-note", "Comparing documented manual cases with actual AI candidates…"));
  exportEvaluationButton.hidden = true;
  currentEvaluation = null;
  try {
    const reply = await request("/api/evaluate", candidateReviewPayload());
    const evaluation = reply.evaluation;
    currentEvaluation = evaluation;
    evaluationResult.replaceChildren();
    evaluationResult.append(node("p", "lab-evaluation-summary",
      evaluation.ai.total + " generated candidates vs " + evaluation.manual.total +
      " manually designed scenarios in " + evaluation.useCase + "."));
    evaluationResult.append(node("p", "probe-note",
      "AI-linked read-only probe candidates: " + evaluation.ai.linkedReadOnlyProbeCandidates +
      " · Exact duplicate candidate titles: " + evaluation.ai.exactNormalizedDuplicateTitles));
    const table = node("table", "lab-compare-table");
    const header = node("tr", "");
    for (const heading of ["Scenario type", "AI", "Manual"]) header.append(node("th", "", heading));
    table.append(header);
    for (const category of evaluation.categoryComparison) {
      const row = node("tr", "");
      row.append(node("td", "", category.type));
      row.append(node("td", "", category.generated));
      row.append(node("td", "", category.manual));
      table.append(row);
    }
    evaluationResult.append(table);
    if (evaluation.manual.examples.length) {
      const details = node("details", "lab-evaluation-manual");
      details.append(node("summary", "", "View " + evaluation.manual.examples.length + " manual baseline scenarios"));
      for (const item of evaluation.manual.examples) {
        details.append(node("p", "probe-note", item.id + " · " + item.category + " · " + item.scenario));
      }
      evaluationResult.append(details);
    }
    evaluationResult.append(node("p", "lab-review-disclaimer", evaluation.interpretation));
    renderHumanCoverageAssessment(evaluation);
    exportEvaluationButton.hidden = false;
  } catch (error) {
    evaluationResult.replaceChildren(node("p", "message error", error.message));
  } finally { evaluateAiButton.disabled = false; }
});

exportEvaluationButton.addEventListener("click", () => {
  if (!currentEvaluation) return;
  const file = new Blob([JSON.stringify(currentEvaluation, null, 2)], { type: "application/json" });
  const address = URL.createObjectURL(file);
  const link = node("a", "");
  link.href = address;
  link.download = "testpilot-ai-vs-manual-" + currentEvaluation.storyId.toLowerCase() + ".json";
  link.click();
  URL.revokeObjectURL(address);
});

const browserPlanButton = document.querySelector("#browser-plan-button");
const browserPlanResult = document.querySelector("#browser-plan-result");
browserPlanButton.addEventListener("click", async () => {
  let selectedIds;
  try { selectedIds = approvedReviewIds(); }
  catch (error) {
    browserPlanResult.replaceChildren(node("p", "message error", error.message));
    return;
  }
  browserPlanButton.disabled = true;
  browserPlanResult.replaceChildren(node("p", "probe-note", "Validating approved candidates and source-reviewed browser mappings…"));
  try {
    const reply = await request("/api/browser-plan-reviewed", reviewedPayload(selectedIds));
    browserPlanResult.replaceChildren();
    browserPlanResult.append(node("p", "lab-evaluation-summary",
      selectedIds.length + " AI candidate(s) selected for review. No browser tests have started."));
    if (!reply.browserChecks.length) {
      browserPlanResult.append(node("p", "probe-note", "There is no fixed browser check for this story yet. The approved AI candidates remain unexecuted."));
    }
    for (const check of reply.browserChecks) {
      const item = node("div", "lab-browser-check");
      item.append(node("strong", "", check.testId + " · " + check.description));
      item.append(node("small", "", "GitHub workflow inputs: story_id = " + check.storyId +
        " ; browser_check_id = " + check.testId));
      browserPlanResult.append(item);
    }
    if (reply.browserChecks.length) {
      const open = node("a", "lab-workflow-link", "Open approved Playwright workflow ↗");
      open.href = reply.workflowUrl;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      browserPlanResult.append(open);
    }
    browserPlanResult.append(node("p", "lab-review-disclaimer", reply.interpretation));
  } catch (error) {
    browserPlanResult.replaceChildren(node("p", "message error", error.message));
  } finally { browserPlanButton.disabled = false; }
});


// Source-reviewed requirement traceability; this is a design matrix, not execution status.
const traceButton = document.querySelector("#traceability-button");
const traceMessage = document.querySelector("#traceability-message");
const traceSummary = document.querySelector("#traceability-summary");
const traceResults = document.querySelector("#traceability-results");
traceButton.addEventListener("click", async () => {
  traceButton.disabled = true;
  traceResults.replaceChildren();
  traceSummary.replaceChildren();
  traceMessage.textContent = "Loading story-to-test mappings…";
  traceMessage.className = "message";
  try {
    const response = await fetch("/api/traceability", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw Error(payload.message || "Unable to load traceability.");
    const metrics = [
      ["Stories",payload.summary.documentedStories],
      ["Use cases",payload.summary.useCases],
      ["Manual designs",payload.summary.designedManualCases],
      ["Stories with live probes",payload.summary.storiesWithLiveProbe],
      ["Stories with browser checks",payload.summary.storiesWithFixedPlaywright]
    ];
    for (const [title,count] of metrics) {
      const card=node("div","trace-metric");
      card.append(node("strong","",count));
      card.append(node("span","",title));
      traceSummary.append(card);
    }
    const table=node("table","trace-table");
    const head=node("tr","");
    for(const label of ["Story","Mapped use case","Manual case IDs","Available live probes","Fixed Playwright IDs"])
      head.append(node("th","",label));
    table.append(head);
    for(const rowData of payload.rows) {
      const row=node("tr","");
      row.append(node("td","",rowData.id+" · "+rowData.title));
      row.append(node("td","",rowData.useCase));
      row.append(node("td","",rowData.manualCaseIds.join(", ") || "None"));
      row.append(node("td","",rowData.readOnlyProbeIds.join(", ") || "Not available"));
      row.append(node("td","",rowData.fixedPlaywrightIds.join(", ") || "Not mapped"));
      table.append(row);
    }
    traceResults.append(table);
    traceMessage.textContent=payload.warning;
    traceMessage.className="message success";
  } catch(error) {
    traceMessage.textContent=error.message;
    traceMessage.className="message error";
  } finally { traceButton.disabled=false; }
});


// Reviewer-entered acceptance-criteria assessment. No AI-derived or inferred scores.
// Use three states so untouched criteria are never silently treated as uncovered.
function renderHumanCoverageAssessment(evaluation) {
  const story = stories.find(item => item.id === evaluation.storyId);
  const criteria = Array.isArray(story?.acceptanceCriteria) ? story.acceptanceCriteria : [];
  if (!criteria.length) return;
  const section = node("section", "reviewer-assessment");
  section.append(node("h4", "", "Human review: acceptance criteria"));
  section.append(node("p", "probe-note",
    "Read the AI candidates and the manual baseline examples above. For each criterion, record whether each set covers it. These are reviewer-entered decisions, not automatic AI scores."));
  const table = node("table", "reviewer-score-table");
  const headings = node("tr", "");
  for (const title of ["Acceptance criterion", "AI cases", "Manual cases"]) {
    headings.append(node("th", "", title));
  }
  table.append(headings);
  const choices = ["Not reviewed", "Covered", "Not covered"];
  const ratings = criteria.map((criterion, index) => ({
    index: index + 1, criterion, ai: "Not reviewed", manual: "Not reviewed"
  }));
  const summary = node("p", "lab-reviewer-summary",
    "No acceptance criteria have been scored by a reviewer yet.");
  const notes = node("textarea", "reviewer-notes");
  notes.rows = 3;
  notes.maxLength = 1000;
  notes.placeholder = "Optional reviewer notes: missing steps, quality of expected results, or false positives";
  notes.setAttribute("aria-label", "Reviewer comparison notes");
  function calculate() {
    const count = key => {
      const reviewed = ratings.filter(item => item[key] !== "Not reviewed").length;
      const covered = ratings.filter(item => item[key] === "Covered").length;
      return { reviewed, covered, notCovered: reviewed - covered, total: ratings.length };
    };
    const ai = count("ai");
    const manual = count("manual");
    evaluation.reviewerAssessment = {
      method: "HUMAN_REVIEWED_ACCEPTANCE_CRITERIA",
      notAutomated: true,
      criteria: ratings.map(item => ({ ...item })),
      ai, manual,
      notes: notes.value.slice(0, 1000),
      updatedAt: new Date().toISOString()
    };
    const part = (label, item) => label + ": " + item.covered +
      " covered / " + item.reviewed + " reviewed (of " + item.total + " criteria)";
    summary.textContent = (ai.reviewed || manual.reviewed)
      ? part("AI", ai) + " · " + part("Manual", manual) +
        ". Unreviewed criteria are excluded from coverage conclusions."
      : "No acceptance criteria have been scored by a reviewer yet.";
  }
  criteria.forEach((criterion, index) => {
    const row = node("tr", "");
    row.append(node("td", "", String(index + 1) + ". " + criterion));
    for (const mode of ["ai","manual"]) {
      const cell = node("td", "");
      const control = node("select", "review-criterion-select review-" + mode);
      control.setAttribute("aria-label", mode.toUpperCase() +
        " coverage for acceptance criterion " + String(index + 1));
      choices.forEach(choice => {
        const option = node("option", "", choice);
        option.value = choice;
        control.append(option);
      });
      control.addEventListener("change", () => {
        ratings[index][mode] = control.value;
        calculate();
      });
      cell.append(control);
      row.append(cell);
    }
    table.append(row);
  });
  notes.addEventListener("input", calculate);
  section.append(table);
  section.append(summary);
  section.append(notes);
  evaluationResult.append(section);
  calculate();
}


// Faculty prompt-engineering experiment evidence. Each entry is a real API
// response recorded at generation time, never a fabricated pass or quality score.
// Session storage keeps synthetic story/case text only; no keys, codes or receipts.
const EXPERIMENT_STORAGE_KEY = "testpilot-faculty-prompt-log-v2";
let experimentLog = [];
let currentIterationId = null;
try {
  const persisted = JSON.parse(sessionStorage.getItem(EXPERIMENT_STORAGE_KEY) || "[]");
  if (Array.isArray(persisted)) experimentLog = persisted.slice(-60);
} catch { experimentLog = []; }

function saveExperimentLog() {
  try { sessionStorage.setItem(EXPERIMENT_STORAGE_KEY,
    JSON.stringify(experimentLog.slice(-60))); } catch { /* Export remains available. */ }
  const counter = document.querySelector("#prompt-log-count");
  if (counter) {
    const evaluated = experimentLog.filter(entry =>
      Object.values(entry.humanRatings || {}).every(score => score >= 1 && score <= 5) &&
      entry.reviewerObservation?.trim()).length;
    counter.textContent = experimentLog.length + " actual model run(s) recorded; " +
      evaluated + " with human quality ratings (target: 10 runs across 3 stories).";
  }
}
function rememberRealGeneration(result, storyText, promptVariant, description, durationMs) {
  const entry = {
    iterationId: crypto.randomUUID(),
    timestampUtc: result.generatedAt || new Date().toISOString(),
    storyId: result.storyId, userStoryInput: storyText,
    promptVersion: result.promptVersion || "unknown",
    promptVariant: result.promptVariant || promptVariant,
    promptChangeAndReason: description || "NOT DOCUMENTED BY OPERATOR",
    llmProvider: result.generatedBy, model: result.model || "not returned",
    elapsedGenerationMs: durationMs,
    actualLlmOutput: result.cases,
    humanRatings: { completeness: null, accuracy: null, healthcareRelevance: null },
    reviewerObservation: "", humanReviewElapsedMs: null,
    reviewTimestampUtc: null, kind: "ACTUAL_LLM_GENERATION_NOT_A_TEST_EXECUTION"
  };
  currentIterationId = entry.iterationId;
  experimentLog.push(entry);
  saveExperimentLog();
  for (const select of document.querySelectorAll(".experiment-rating"))
    select.value = "";
  document.querySelector("#experiment-observation").value = "";
  document.querySelector("#experiment-review-ms").value = "";
  document.querySelector("#prompt-log-message").textContent =
    "Actual provider response recorded. Add reviewer ratings and notes; do not score an unreviewed output.";
}
document.querySelector("#save-experiment-rating").addEventListener("click", () => {
  const feedback = document.querySelector("#prompt-log-message");
  const item = experimentLog.find(entry => entry.iterationId === currentIterationId);
  if (!item) {
    feedback.textContent = "Generate a real LLM result before recording quality ratings.";
    feedback.className = "message error";
    return;
  }
  const get = id => Number(document.querySelector("#" + id).value);
  const ratings = {
    completeness: get("rating-completeness"),
    accuracy: get("rating-accuracy"),
    healthcareRelevance: get("rating-relevance")
  };
  const observation = document.querySelector("#experiment-observation").value.trim();
  const msValue = document.querySelector("#experiment-review-ms").value.trim();
  const reviewMs = msValue ? Number(msValue) : null;
  if (Object.values(ratings).some(x => !Number.isInteger(x) || x < 1 || x > 5) ||
      !observation || observation.length > 1500 ||
      (reviewMs !== null && (!Number.isFinite(reviewMs) || reviewMs < 0 || reviewMs > 86400000))) {
    feedback.textContent = "Enter 1–5 for all three dimensions, a specific reviewer observation, and an optional measured review time in milliseconds.";
    feedback.className = "message error";
    return;
  }
  item.humanRatings = ratings;
  item.reviewerObservation = observation;
  item.humanReviewElapsedMs = reviewMs;
  item.reviewTimestampUtc = new Date().toISOString();
  feedback.textContent = "Reviewer-entered ratings saved for this actual generation. Export the log for faculty.";
  feedback.className = "message success";
  saveExperimentLog();
});
document.querySelector("#export-prompt-log").addEventListener("click", () => {
  if (!experimentLog.length) {
    document.querySelector("#prompt-log-message").textContent =
      "No real model responses recorded. Generate at least one set first.";
    return;
  }
  exportJsonFile("testpilot-real-prompt-iterations.json", {
    specification: "BITS Pilani BSDCH ZC229T",
    targetRuns: 10, targetDistinctStories: 3,
    recordedRuns: experimentLog.length,
    distinctStoryIds: [...new Set(experimentLog.map(entry => entry.storyId))],
    notice: "Unrated scores are null. Real LLM responses only; model results are NOT_RUN until independently tested.",
    iterations: experimentLog
  });
});
saveExperimentLog();
