# TestPilot AI vs manual evaluation protocol

This is a **measurement protocol**, not a completed experiment. Do not invent Gemini outputs, human scores, or Playwright results.

## Required three-story sample

| Story | Role | Reference | Manual baseline |
| --- | --- | --- | --- |
| US-001 | Visitor | Registration | UC-01 cases TP-001–TP-006 |
| US-005 | Visitor | Doctor browsing | UC-04 cases TP-011–TP-013 |
| US-017 | Patient | Appointment booking | UC-09 cases TP-023–TP-026 |

For each story, save the *actual* Gemini response using the Lab's JSON export, with model identifier, UTC timestamp, prompt version, and synthetic-only inputs. Do not log API keys, tokens, emails, or real patient information. Keep the 36-case manual baseline unchanged while comparing.

## Reviewer assessment

For each acceptance criterion, independently score AI and manual cases as `covered`, `not_covered`, or `not_reviewed`. Explain which test ID and exact step proves the decision. Two reviewers should resolve disagreements or document them. Rate each case set from 1–5 for **completeness**, **accuracy**, and **healthcare relevance**, with evidence notes for each rating. Record generation time and human review time separately.

## Reporting

1. Use Lab → **Compare with manual test cases** and export the comparison JSON for each story.
2. Record positive, negative, boundary and security case counts; exact duplicate titles; incomplete preconditions; invented routes; ambiguous assertions; and missing acceptance criteria.
3. Report separate numerator/denominator for acceptance-criteria coverage: `covered / (covered + not_covered)`. **Exclude `not_reviewed` and disclose its count**; do not treat it as a pass.
4. Link each claimed execution result to GitHub Actions run ID, Playwright test ID, environment, UTC timestamp, and failure screenshot/trace if present.
5. Clearly separate (a) manually designed cases, (b) AI suggestions, (c) read-only probes against live public endpoints, and (d) source-reviewed Chromium checks against synthetic fixtures. A mapped Playwright check does **not** execute every step of an AI narrative.
6. Summarize where AI found additional valid cases and where manual cases were more accurate, with concrete traceable examples. If an experiment has not run, mark it `NOT EVALUATED`.

## Prompt-engineering log

Run at least ten **actual** iterations spanning the three stories above. Each record must contain `storyId`, prompt version, sanitized user input, full generated response (or artifact reference), model, timestamp, completeness/accuracy/healthcare-relevance scores (1–5), exact change, and reviewer observation. Do not backfill invented experiments.

## Safety boundary for Playwright

Run reviewed browser tests only on local/isolated synthetic fixtures. Never pass LLM-generated JavaScript or arbitrary URLs into the runner. Keep production booking/admin mutations disabled. The existing `.github/workflows/reviewed-playwright.yml` accepts only approved story/test ID pairs, and Playwright configuration collects failure screenshots, traces, and video as CI artifacts.
