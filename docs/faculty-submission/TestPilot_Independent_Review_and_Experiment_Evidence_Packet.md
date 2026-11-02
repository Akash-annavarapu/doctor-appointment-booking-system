# TestPilot — Independent Review & Experiment Evidence Packet

> **Source:** Updated user-provided November 2026 Word document. This is a searchable, Git-versioned textual transcription of the report; a separate build step publishes Word and PDF renderings. Original evidence labels are preserved. **Not an approved or signed academic finding.**

BIRLA INSTITUTE OF TECHNOLOGY & SCIENCE, PILANI

                                        Work Integrated Learning Programmes Division

                                             BSc Design and Computing · BSDCH ZC229T

                                                          TESTPILOT
                       Final Evaluation & Human Validation Packet
         Prepared 2 November 2026 · EVIDENCE COLLECTION COPY — NOT A SIGNED RESEARCH RESULT

Purpose. Consolidates verifiable implementation evidence and the actual, documented 26 October Gemini
comparison, provides a defensible preliminary AI assessment, and supplies ready-to-fill human rating and
usability forms. No person, rating, experiment run, or session is fabricated.


1. Verified project evidence
 Indicator                                      Verified result                               Source/interpretation
                                                Existing healthcare React/Node/MongoDB        Healthcare app is tested, not built from
 Application under test
                                                deployment                                    scratch for this project
 Requirements                                   25 documented stories across 15 use cases     Repository story catalog
 Manual test-design baseline                    36 cases                                      Frozen manual case dataset
                                                12 genuine candidates; 4 for each of 3        26 October archived AI comparison; NOT
 Historical Gemini suggestions
                                                stories                                       10 prompt iterations
                                                29 Playwright PASS; 0 FAIL; 1 intentional
 Latest automated CI                                                                          GitHub Actions 41327612679; main branch
                                                SKIP
                                                                                              Synthetic fixtures, not human-reviewed
 Isolated recipe verification                   6 scenario checks passed
                                                                                              study output
                                                                                              Render status: live, updated 1 November
 Live Lab                                       Deployed commit 042e14ae
                                                                                              2026


2. Preliminary AI versus manual design evaluation
The following is a provisional assistant assessment from the previously saved 26 October study. It must be
confirmed or corrected by real independent reviewers. “Covered” means planned test steps and their expected
outcomes sufficiently specify the criterion, not that the test was executed.
                                                                                                                 Preliminary manual
 User story                  AI candidates                 Manual designs            Preliminary AI criteria
                                                                                                                 criteria
 US-001 Registration         4                             6                         2/2                         2/2
 US-005 Doctor browsing      4                             3                         0/2                         2/2
 US-017 Booking              4                             4                         2/2                         2/2
 Total                       12                            13                        4/6                         6/6

Interpretation: the manual baseline specifies all six sampled acceptance criteria, while the original Gemini
candidate descriptions miss or inadequately assert two doctor-directory criteria. The sample is small and
purposive; this does not show that manual design is universally better. There are no human time-savings or
statistical significance estimates.


3. Specific evidence reviewers should inspect

US-001 — Register as patient
Two formal criteria: unique valid registration creates account/JWT; missing fields or short password are rejected.
The archived Gemini case descriptions cover these at a coarse criterion level. Review the numeric mobile input,


                          BITS Pilani · BSDCH ZC229T · TestPilot | Academic evidence — verify before submission
seven/eight-character threshold, duplicate email normalization and explicit expected HTTP/state assertions.
Compare against six manual cases.

US-005 — Browse approved doctors
Two criteria: only approved doctors appear; an empty directory is handled clearly. The original Gemini
“approved-only” case checks response status and array presence but not that pending doctors are excluded. Its
empty-list case lacks a precise empty-array/UI oracle. Compare with TP-011/TP-012 and add explicit assertions
before approval.

US-017 — Book an appointment
Two criteria: valid booking creates Pending; unavailable slot is rejected. Four archived Gemini cases include
success AI-001, occupied slot AI-002, missing fields AI-003 and no-auth AI-004. Manual TP-024 checks outside
working sessions, TP-025 tests simultaneous booking and TP-026 checks conflict. Original model data contain
schematic doctorId DOC-123 and slotTime rather than verified app payload; adapt ONLY in an isolated synthetic
fixture. Original exported candidates remain NOT_RUN on production.

Reviewer rule: cite original case IDs and individual actions/expected results. A generic “works correctly” comment
is insufficient. Record disagreements; do not silently average them.


4. Ten actual prompt runs — scoring register
These ten rows are a pre-registered PLAN, not evidence of completed model calls. Run them through the deployed
Lab; preserve genuine model output and timestamp. A real reviewer must enter numeric scores 1–5 and note a
specific observation for EACH iteration.
                                                   Genuine output             Human C/A/H ratings 1–     Reviewer note /
 Run / Story            Prompt variant
                                                   (file/time)                5                          reference
 01 US-001              Baseline                   ________________           ___ / ___ / ___            ____________________
 02 US-001              Boundary                   ________________           ___ / ___ / ___            ____________________
 03 US-001              Assertions                 ________________           ___ / ___ / ___            ____________________
 04 US-005              Baseline                   ________________           ___ / ___ / ___            ____________________
 05 US-005              Boundary                   ________________           ___ / ___ / ___            ____________________
 06 US-005              Assertions                 ________________           ___ / ___ / ___            ____________________
 07 US-017              Baseline                   ________________           ___ / ___ / ___            ____________________
 08 US-017              Boundary                   ________________           ___ / ___ / ___            ____________________
 09 US-017              Authorization              ________________           ___ / ___ / ___            ____________________
 10 US-017              Assertions                 ________________           ___ / ___ / ___            ____________________

C = completeness; A = accuracy; H = healthcare relevance. 1 = poor, 2 = weak, 3 = adequate, 4 = strong, 5 = excellent.
Evidence must be explicit (for example, missing exact 8-character assertion, invalid JSON field, or omitted
concurrency case). Never record a zero as an unreviewed score; leave blank until rated.

Study collection link: https://testpilot-lab.onrender.com/ | Export name: testpilot-real-prompt-iterations.json. The
Lab generation limit may interrupt consecutive runs; only resumed genuine provider responses count. Do not
paste the private Lab access code into this document.

                     BITS Pilani · BSDCH ZC229T · TestPilot | Academic evidence — verify before submission
5. Independent reviewer sign-off sheets
Two different real QA reviewers each assess the SAME unchanged generated case set for all three stories. They
must not copy each other’s ratings. Enter “Covered / Not covered” for both AI and manual cases, cite relevant case
IDs/steps, then compare results and resolve each conflict.

Reviewer A — independent assessment
Reviewer initials: __________________ Date/time (IST): __________________ Original AI export/hash: __________________
 Criterion                     AI covered?                       Manual covered?                  Cited case ID / step / reason
 US-001 / C1                   ________                          ________                         ____________________________
 US-001 / C2                   ________                          ________                         ____________________________
 US-005 / C1                   ________                          ________                         ____________________________
 US-005 / C2                   ________                          ________                         ____________________________
 US-017 / C1                   ________                          ________                         ____________________________
 US-017 / C2                   ________                          ________                         ____________________________

Specific discrepancies / missing cases:
_________________________________________________________________________________

I confirm that these judgments reflect my own inspection of the original AI and manual cases. Initials/signature:
__________________

Reviewer B — independent assessment
Reviewer initials: __________________ Date/time (IST): __________________ Original AI export/hash: __________________
 Criterion                     AI covered?                       Manual covered?                  Cited case ID / step / reason
 US-001 / C1                   ________                          ________                         ____________________________
 US-001 / C2                   ________                          ________                         ____________________________
 US-005 / C1                   ________                          ________                         ____________________________
 US-005 / C2                   ________                          ________                         ____________________________
 US-017 / C1                   ________                          ________                         ____________________________
 US-017 / C2                   ________                          ________                         ____________________________

Specific discrepancies / missing cases:
_________________________________________________________________________________

I confirm that these judgments reflect my own inspection of the original AI and manual cases. Initials/signature:
__________________

Adjudication (after both reviewers submit)
Disagreements (criterion, A view, B view):
______________________________________________________________________________

Resolution with case-level evidence:
____________________________________________________________________________________

Reviewer A sign-off: __________________ Reviewer B sign-off: __________________ Date: __________________

                     BITS Pilani · BSDCH ZC229T · TestPilot | Academic evidence — verify before submission
6. Actual peer usability sessions
Two consenting real people must use TestPilot. An observer records actual task outcome and difficulty. Automated
browser tests and AI-authored imaginary feedback do not qualify as peer sessions.

Participant 1 — observer record
Participant initials/pseudonym: __________ Date: __________ Device/browser: __________________

Consent to collect de-identified usability observations: YES / NO (If NO, do not record or submit.)

Actual start time: __________ Actual end time: __________ Measured duration (seconds): __________
 Observed task                                 Completed / Blocked / Not attempted         Observed problem or time
 Select and enter a documented story           _____________________                       ________________
 Generate and inspect Gemini suggestions       _____________________                       ________________
 Edit a case and identify a missing scenario   _____________________                       ________________
 Approve one case and reject another           _____________________                       ________________
 Interpret PASS versus NOT_RUN and
                                               _____________________                       ________________
 inspect evidence
 Export reviewed cases / study log             _____________________                       ________________

Participant’s actual feedback (quote or faithful notes):
_________________________________________________________________

Observer’s improvement recommendation:
_________________________________________________________________________________

Participant consent record reference: __________________ Observer initials: __________________

Participant 2 — observer record
Participant initials/pseudonym: __________ Date: __________ Device/browser: __________________

Consent to collect de-identified usability observations: YES / NO (If NO, do not record or submit.)

Actual start time: __________ Actual end time: __________ Measured duration (seconds): __________
 Observed task                                 Completed / Blocked / Not attempted         Observed problem or time
 Select and enter a documented story           _____________________                       ________________
 Generate and inspect Gemini suggestions       _____________________                       ________________
 Edit a case and identify a missing scenario   _____________________                       ________________
 Approve one case and reject another           _____________________                       ________________
 Interpret PASS versus NOT_RUN and
                                               _____________________                       ________________
 inspect evidence
 Export reviewed cases / study log             _____________________                       ________________

Participant’s actual feedback (quote or faithful notes):
_________________________________________________________________

Observer’s improvement recommendation:
_________________________________________________________________________________

Participant consent record reference: __________________ Observer initials: __________________

                         BITS Pilani · BSDCH ZC229T · TestPilot | Academic evidence — verify before submission
7. Faculty validation and submission gate
The following are requirements for the final academic submission. The codebase and a draft report do NOT
establish that these activities were performed. Mark complete only against actual evidence files.

 Requirement                                Attach authentic evidence                    Verified now?
                                            10 individual complete JSON responses /
 Ten real Gemini provider runs                                                           NO
                                            timestamps
                                            10 reviewer judgments, rationales, review
 Human 1–5 quality ratings                                                               NO
                                            dates
                                            US-001, US-005, US-017 records from
 Two independent reviews per story                                                       NO
                                            Reviewer A and B
 Dispute resolution                         Signed rationale for disagreements           NO
                                            Measured tasks, independent feedback
 Two consenting usability sessions                                                       NO
                                            and consent
                                            GitHub Actions 41327612679; 29 passed; 1
 Technical execution evidence                                                            YES
                                            skip
 Final signed faculty report                Updated conclusions + mentor approval        NO

Final mentor: Kavi Arasu V       Faculty confirmation/date: __________________          Team confirmation/date:
__________________

Research integrity note. The assistant may prepare preliminary case analysis and scoring instructions but is not an
independent human participant. Neither Playwright fixtures nor made-up human names, times, consent, or quotes
should be submitted as observed findings.

Traceable sources: GitHub repository https://github.com/Akash-annavarapu/doctor-appointment-booking-system ;
verified main run https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/
41327612679 ; 26 October archival comparison TestPilot_AI_Comparison_2026-10-26.md ; user-stories.json; original
US-017 Gemini case JSON.

                       BITS Pilani · BSDCH ZC229T · TestPilot | Academic evidence — verify before submission
