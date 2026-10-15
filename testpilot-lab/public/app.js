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
