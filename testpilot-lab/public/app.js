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
    const approval = node("label", "approval-label");
    const checkbox = node("input", "ai-case-approval");
    checkbox.type = "checkbox";
    checkbox.value = item.id;
    checkbox.checked = false;
    approval.append(checkbox);
    approval.append(node("span", "", "Approve " + item.id));
    top.append(approval);
    card.append(top);
    card.append(node("p", "probe-label", item.probeId && item.probeId !== "NONE"
      ? "Executable as verified read-only assertion: " + item.probeId
      : "Requires staging/isolated CI; live execution will SKIP"));
    card.append(node("h3", "", item.title));
    const details = [
      ["Preconditions", item.preconditions],
      ["Synthetic test data", item.testData],
      ["Steps", item.steps.map((step, i) => (i + 1) + ". " + step).join("\n")],
      ["Expected result", item.expectedResult]
    ];
    for (const [name, value] of details) {
      card.append(node("h4", "", name));
      const p = node("p", name === "Steps" ? "preserve-lines" : "", value);
      card.append(p);
    }
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
  try {
    const result = await request("/api/generate", {
      targetUrl: urlInput.value,
      storyId: select.value,
      storyText: storyInput.value,
      accessCode: document.querySelector("#access-code").value
    });
    renderResult(result);
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
  const selectedIds = [...document.querySelectorAll(".ai-case-approval:checked")].map(el => el.value);
  if (!selectedIds.length) {
    generatedRunMessage.textContent = "Review and explicitly approve at least one generated case.";
    generatedRunMessage.className = "message error";
    return;
  }
  executeGeneratedButton.disabled = true;
  generatedRunResults.replaceChildren();
  generatedRunMessage.textContent = "Executing audited read-only assertions for approved cases…";
  generatedRunMessage.className = "message";
  try {
    const response = await request("/api/execute-generated", {
      storyId: currentResult.storyId,
      targetUrl: currentResult.targetUrl,
      cases: currentResult.cases,
      selectedIds,
      receipt: currentResult.receipt,
      accessCode: document.querySelector("#access-code").value
    });
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
  const selectedIds = [...document.querySelectorAll(".ai-case-approval:checked")].map(el => el.value);
  if (!selectedIds.length) {
    browserPlanResult.replaceChildren(node("p", "message error", "Review and approve at least one AI candidate above."));
    return;
  }
  browserPlanButton.disabled = true;
  browserPlanResult.replaceChildren(node("p", "probe-note", "Validating approved candidates and source-reviewed browser mappings…"));
  try {
    const reply = await request("/api/browser-plan", { ...candidateReviewPayload(), selectedIds });
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
