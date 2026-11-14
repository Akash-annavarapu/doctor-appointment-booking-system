# Week 5 — Healthcare SUT + Separate TestPilot Lab

**The project has two separate applications, as required by the project direction.** The deployed doctor appointment booking system is the existing GitHub healthcare **system under test**. The independently runnable [TestPilot Lab](testpilot-lab/README.md) is the separate testing application that accepts a healthcare URL and a documented user story, inspects allowlisted public app data, and generates reviewable test cases with privately configured Google Gemini (OpenAI is optional, not required).

- **[25 documented user stories](docs/WEEK5_USER_STORIES.md)**: actors/roles, acceptance criteria, real routes, source traceability across 15 use cases.
- **[Week 5 progress report](docs/WEEK5_PROGRESS_REPORT.md)**: retrospective Weeks 1–4 and Week 5 milestone.
- **[Week 6 progress report — updated through 13 November 2026](docs/WEEK6_PROGRESS_REPORT.md)**: AI candidate generation/review status, TC-0501/TC-0502 CI evidence, limitations and next actions.
- **[Live separate testing application](https://testpilot-lab.onrender.com/)**: independently deployed TestPilot Lab.
- **Existing healthcare URL:** https://doctor-appointment-frontend-9dbs.onrender.com/

## Latest verified progress — 13 November 2026

- US-005 — Browse Approved Doctors has been used to demonstrate the AI-assisted candidate-generation and human-review interface. The displayed screenshot contains four candidates (AI-001 to AI-004); all are shown as **Not reviewed** and **NOT RUN**, with execution mapping marked **Unsupported / needs engineering**. Their presence is evidence of displayed candidates, not evidence of approval or execution.
- **TC-0502** completed successfully in GitHub Actions for US-005: one predefined Playwright browser check passed. It verifies specialty filtering and a no-match search using synthetic fixtures.
- **TC-0501** also has a successful GitHub Actions run.
- The demonstrated CI checks use a local frontend preview and synthetic API fixtures. They do **not** establish production-database testing.
- Arbitrary AI-generated scenarios are not automatically executable. Only predefined, supported Playwright checks mapped to selected stories can run.
- Independent human evaluation, reviewer sign-offs and a complete AI-versus-manual comparison remain subject to documented evidence; do not claim them complete without records.

**Execution evidence:** [TC-0502 successful GitHub Actions run](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/43276851268) · [TC-0501 successful run](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/43277432846) · [TC-0502 artifact](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/43276851268/artifacts/13971476478).

---

# TestPilot — Deployed Healthcare App & Test-Design Milestones

**TestPilot** is an academic AI-assisted test-case-generation design project built around this existing open-source doctor appointment booking application, which is the **system under test**. The independently deployed TestPilot Lab is the separate testing application.

**Live TestPilot frontend:** https://doctor-appointment-frontend-9dbs.onrender.com/  
**Deployed backend:** https://doctor-appointment-booking-system-u1eq.onrender.com/  
**TestPilot Lab:** https://testpilot-lab.onrender.com/

