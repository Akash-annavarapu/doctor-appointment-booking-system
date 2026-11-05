# TestPilot — Tasks 4, 5 and 6: AI/manual comparison and measured execution

**Project:** TestPilot — AI-Assisted Test Case Generation for a Full-Stack Healthcare Platform  
**Course:** BITS Pilani / BSDCH ZC229T  
**Assessment date:** 6 November 2026  
**Status:** Task 4 technical comparison documented; Task 5 fixed Playwright execution is implemented; Task 6 produces a case-level evidence artifact on each CI run. **No independent human sign-off or unmeasured PASS is asserted.**

## 4. Final technical AI-versus-manual design comparison

**Source integrity.** The latest genuine user-exported file, \`testpilot-real-prompt-iterations (14).json\`, has SHA-256:

\`b627b702e25167d32100eb20b91928b2f5d5236006b0b22f393fc08c6008623f\`

The full private export includes **13** recorded real Google Gemini responses. Exactly **10** are tagged \`BITS-10-GEMINI-V1\` and are analyzed here: 3 registration (US-001), 3 approved-doctor browsing (US-005), and 4 appointment booking (US-017). Each guided response returned 4 case designs: **40 AI-designed cases**, all labeled \`NOT_RUN\` in the source. Three extra genuine model runs were excluded from the guided-study denominator. The recorded model was \`gemini-3.5-flash-lite\`.

The frozen manual reference contains **36 designs**, with **13** cases concerning the selected UC-01, UC-04 and UC-09 workflows. Only those 13 are direct comparators; **TP-013** is adjacent doctor-detail coverage, so a strict 12-case selected-story view is also provided.

### Observed design coverage — NOT Playwright pass rate

| Scope | Fully covered | Partial | Missing | Fully covered / total |
| --- | ---: | ---: | ---: | ---: |
| 13 relevant manual designs | 4 | 4 | 5 | 4/13 = **30.8%** |
| Strict 12 selected-story designs (excluding TP-013) | 4 | 4 | 4 | 4/12 = **33.3%** |

**Covered** means an actual guided AI output describes the manual scenario and an observable expected behavior. **Partial** means some key inputs, preconditions or assertions are missing or ambiguous. **Missing** means no sufficiently matching guided case was found. These are technical *assistant-assessed design matches* and have **not been independently signed off by the human reviewers**.

| Manual ID | Story | Assessment | Specific source-backed gap or match |
| --- | --- | --- | --- |
| TP-001 | US-001 | Covered | Run 5 AI-001 specifies successful registration, 201 and JWT; its sample inputs still need correction |
| TP-002 | US-001 | Covered | Run 5 AI-002 omits a required field and expects 400 |
| TP-003 | US-001 | Missing | Guided AI uses generic 3-/5-character examples, not exactly 7 |
| TP-004 | US-001 | Missing | No guided case asserts acceptance at exactly 8 characters; the off-protocol Run 9 is excluded |
| TP-005 | US-001 | Partial | Duplicate email appears but case-normalized duplicate input does not |
| TP-006 | US-001 | Missing | No intentional invalid Indian mobile-number scenario |
| TP-011 | US-005 | Partial | AI says unapproved doctors should be excluded but only checks generic HTTP 200 and array |
| TP-012 | US-005 | Partial | AI mentions empty catalog but does not demand an empty array or clear empty-state UI |
| TP-013 | US-005 | Missing | No invalid MongoDB ObjectId doctor-detail check |
| TP-023 | US-017 | Covered | Runs 10/13 specify valid booking -> 201 and Pending |
| TP-024 | US-017 | Missing | No direct outside-working-hours scenario |
| TP-025 | US-017 | Covered | Run 13 AI-004 specifies concurrent booking -> one 201 and one 409 |
| TP-026 | US-017 | Partial | Occupied slot check permits either 409 or 400, rather than the required specific assertion |

**Saved operator-entered rating means (1–5):** completeness **2.70**, accuracy **2.00**, healthcare relevance **4.40** over the 10 guided responses. These were recorded in the original export; they are **not two authenticated independent reviewer scores**. The Gemini API response time average was **7.61 seconds** per guided call; it is not measured end-to-end human test-design productivity.

**Important data defects:** multiple registration suggestions use \`mobile\` instead of the backend's \`phone\` field and invalid phone examples. An otherwise plausible success-case title is not enough to make its literal generated test data executable. The manually designed cases cover exact password boundaries and out-of-hours booking that the guided AI outputs omitted.

### Task 4 conclusion

The controlled ten-run Gemini experiment is **genuinely recorded**, and this comparison is a **completed provisional technical analysis**. It is not a human-validated final effectiveness finding. Reviewer agreement, independence declarations and formal sign-off remain separate requirements; nothing in this document substitutes for them. Keep the original unmodified export in the team's private evidence archive rather than committing participant-level raw data to this public repository.

## 5. Execute representative AI scenario intents using Playwright

Tests already implemented in the codebase:

- \`e2e/tests/generated-booking.api.spec.cjs\` contains four fixed tests for the **different, original 26 October 2026 Gemini US-017 export**: \`AI-001\` success, \`AI-002\` occupied slot, \`AI-003\` missing fields, \`AI-004\` unauthorized booking.
- That file also contains a **source-derived**, **not 26 October Gemini-generated** \`US-018\` concurrent booking assertion.
- \`e2e/tests/story-category.api.spec.cjs\` contains fixed **source-derived** US-001 registration and US-005 doctor-catalog checks.
- All changes to database state operate on a dedicated \`127.0.0.1\` MongoDB test database, with synthetic users/doctors; no LLM JavaScript, production appointment data or production mutation endpoint is executed.
- The separate synthetic \`reviewed-dynamic.api.spec.cjs\` recipe-fixture run is *not* real human-reviewed AI evidence.

The newer **5 November ten-run Gemini study** was generated *after* several of these source-written checks existed. Three guided model scenario **intents** are explicitly associated with matching pre-existing fixed assertions in the new case-level export:

| Guided Gemini case | Fixed assertion | Interpretation |
| --- | --- | --- |
| Run 5 AI-001, US-001 | \`SOURCE-US001-REGISTER\` | Registration goal matches; source-reviewed valid fixtures replace invalid generated phone/name fields |
| Run 7 AI-002, US-005 | \`SOURCE-US005-EMPTY\` | Empty catalog goal matches; fixed assertion is stricter than AI's generic 200 + array |
| Run 13 AI-004, US-017 | \`SOURCE-US018-CONCURRENT\` | Concurrent booking goal matches the already-written source-derived assertion |

These three links **do not count as three extra Playwright tests**, do not mark the original 40 designs as individually executed, and do not constitute independent human approval. They show **reviewed intent alignment with measured fixed tests** when the associated CI tests actually run.

### Reproduce the suite (CI automatically does this on main push)

\`\`\`bash
# Requires Node 22, the local built frontend and MongoDB 7 test service.
# See .github/workflows/testpilot-ci.yml for exact setup and environment guards.
npm ci --prefix client
npm ci --prefix server
npm install --prefix e2e --no-audit --no-fund
npm run test:unit --prefix e2e
# Configure isolated environment as in the CI job, then:
npm test --prefix e2e
\`\`\`

**Do not report success solely because the command, workflow or script exists.** Check the run conclusion and per-case JSON, including skipped and retried outcomes.

## 6. Measured traceability: case IDs, PASS/FAIL, logs and screenshots

The main-branch \`TestPilot regression checks\` job now:

1. Runs the fixed isolated Chromium/API Playwright suite.
2. Saves the actual Playwright JSON to \`e2e/artifacts/results.json\`.
3. Calls \`node e2e/scripts/buildCaseEvidence.cjs e2e/artifacts/results.json e2e/artifacts/task-4-6-case-evidence.json\`.
4. Uploads \`testpilot-source-reviewed-case-evidence\` and \`playwright-chromium-report\` GitHub Actions artifacts (14-day retention).

The case-evidence file includes exact test titles and IDs, \`PASS\`, \`FAIL\`, \`PASS_WITH_RETRY\`, \`SKIPPED\`, \`PARTIAL\` or \`NOT_RECORDED\` as actually observed; durations, attempts, available screenshot/trace paths, run URL, SHA and source provenance. **No reported status is hardcoded as PASS.** Only files actually present in the Playwright report are referenced as attachments.

View the latest measured runs on [GitHub Actions — TestPilot regression checks](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-ci.yml). For specific claims, cite the *individual run URL* and download the case-evidence and HTML report artifacts. GitHub can remove uploaded artifacts after their 14-day retention window; archive required evidence privately before then.

### What has and has not been established

| Evidence question | What the artifacts establish |
| --- | --- |
| Do fixed synthetic API assertions pass? | Yes **only if** their latest measured case rows say PASS |
| Are 26 October Gemini US-017 scenario intents mapped to reviewed assertions? | Yes; source and test IDs are linked, but original case steps were adapted |
| Do some 5 November Gemini candidate goals match fixed checks? | Yes; exactly the three links listed above, **not** 40 executed candidates |
| Are all 40 Gemini designs executable, human-approved and PASS? | **No — never claimed** |
| Are reviewer declarations, peer-session sign-offs or faculty approval completed? | **Not verified by this code** |
| Is a screenshot guaranteed? | **No** — only real failing browser checks can produce screenshots or traces |

**Source files:** \`testpilot-lab/manual-baseline.json\`, \`testpilot-lab/user-stories.json\`, \`testpilot-lab/evidence/gemini-us-017-2026-10-26.redacted.json\`, \`e2e/tests/generated-booking.api.spec.cjs\`, and \`e2e/tests/story-category.api.spec.cjs\`.

**Privacy:** Do not commit the private Lab access code, API keys, signed receipts, reviewer signatures or personal participant records.
