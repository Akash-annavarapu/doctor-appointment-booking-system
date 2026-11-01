# Finishing the BITS Pilani final TestPilot evaluation — operational instructions

**Current technical milestone:** working separate TestPilot and healthcare applications; 25 documented stories, 36 manual case catalog, signed AI-candidate review and approved isolated test recipes; main-branch CI: 28 Playwright PASS, one guard SKIP, six synthetic recipe tests PASS. These are engineering evidence, **not** the required independent empirical study.

## Actual ten-run Gemini study — now supported directly by the Lab

Open [TestPilot Lab](https://testpilot-lab.onrender.com/) and find **Prompt engineering experiment log**. Enter the private **Lab access code** (never the provider key). Before generating, confirm the Lab says Gemini is configured and that the configured Google AI Studio project is on the intended free/non-billable tier.

Choose **Generate next real study iteration** (one request) or **Generate remaining real iterations** (up to ten calls, sequential; stops on provider or Lab rate-limit error). The Lab follows the preregistered protocol: three US-001 registration variants, three US-005 approved-doctor variants, and four US-017 booking variants. It changes the story and prompt variant automatically, but sends only the synthetic story context to the existing `/api/generate` endpoint. **Only actual verified-shape Gemini responses are recorded.** The backend currently limits generation to **four attempts per IP per 15 minutes**, so the run may stop after four calls; repeat after the limit resets to resume. No estimated model outputs, ratings, pass rates or review timestamps are generated.

Every response appears in **Choose a recorded model response to evaluate**. Have an actual team reviewer select EACH run, inspect its full test cases, assign the three 1–5 ratings, enter specific observed gaps, and save. Repeat for all ten; then export **testpilot-real-prompt-iterations.json**. The Lab's session storage is tab-scoped and can be cleared by browser/session events; export before closing the tab. The export includes the actual returned cases and model metadata but never the access code, API key or short-lived signed receipt.

**Important:** The browser and CI tests for this feature use explicitly mocked provider responses. Passing UI tests do not represent real Gemini usage or human ratings.

## Independent human evaluation

Generate a genuine case set for US-001, US-005, and US-017, then have two different actual people independently evaluate the unchanged AI cases and the manual baseline against each acceptance criterion. Record cited case IDs and steps in the Lab's **Independent reviews and peer usability sessions** section, compare the reviews, resolve discrepancies with reviewer initials/date, and export review evidence **once per story**. Self-declared identity is not authenticated; the team/faculty must confirm the work and sign off.

For the peer usability study, obtain consent from two real participants. Each should use the Lab and complete/attempt the six listed tasks under observation. Record observed task outcome, duration, browser/device, and specific feedback. Export the session JSON. Do **not** substitute Playwright UI test records for human sessions or invent participant data.

## Faculty validation

Prepare an evidence-private manifest referring to the ten-run JSON, two-person peer JSON and separate reviewer JSON exports for all three stories. Execute `node testpilot-lab/facultyReadiness.cjs ./evidence-private/evidence-manifest.json`. The validator reports incomplete if outputs are unrated, reviewers disagree, or participant observations are missing. This validates format, not the authenticity of human/provider identities.

Attach those genuine exports, the specific CI URLs, and the six-page `TestPilot_BITS_Pilani_Final_Project_Report_Draft.docx` to the mentor's final review packet. The report must remain a **draft** until the findings are incorporated and the team/mentor approves them. No code tool can grant faculty acceptance or forge real independent peer reviews.

### Completion matrix

| Requirement | Implemented | Evidence still needed |
| --- | --- | --- |
| Ten Gemini responses across three stories | Yes — Lab sequential runner and resumable CLI | Ten actual responses and ten human quality ratings |
| Independent AI vs manual comparison | Yes — scoring UI, source hash and disagreement checks | Two real reviewers per story, dispute resolution, sign-off |
| Peer usability | Yes — consent/timer/task form and export | Two actual participants and observations |
| CI / reviewed Playwright execution | Yes — isolated scenarios and traceable pass/fail | Only add new scenarios if faculty requests broader executed coverage |
| Failure screenshots | Yes — uploaded failing Chromium evidence with limits | Failure screenshot only when a real failed browser test occurs |
| Final project report | Yes — verified pre-submission report draft | Genuine empirical results, final approval, submission |

**Safety:** The Lab does not execute arbitrary Gemini-supplied code, access real patient records, or mutate the live appointment database.
