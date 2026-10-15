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
  inspectionBox.append(node("strong", "", "Live URL verified · " + info.page.title));
  inspectionBox.append(node("p", "", "Public doctor records: " + info.publicDoctorCatalog.approvedCount +
    " · Specialties: " + info.publicDoctorCatalog.specialties.length));
  inspectionBox.append(node("small", "", info.evidenceScope));
}

function renderResult(data) {
  currentResult = data;
  clearMessage();
  caseBox.replaceChildren();
  empty.hidden = true;
  footer.hidden = false;
  count.textContent = data.cases.length + " cases";
  displayInspection(data);
  for (const item of data.cases) {
    const card = node("article", "test-card");
    const top = node("div", "case-top");
    top.append(node("span", "case-id", item.id));
    top.append(node("span", "type-chip", item.type));
    top.append(node("span", "priority", item.priority));
    top.append(node("span", "not-run", "NOT RUN"));
    card.append(top);
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
  showMessage("AI candidates generated for " + data.storyId + ". Review before automation.");
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
    showMessage("Live URL inspection completed using public read-only requests.");
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
