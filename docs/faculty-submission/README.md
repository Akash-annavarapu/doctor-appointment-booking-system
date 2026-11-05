# BITS Pilani TestPilot — Final academic documentation

## 6 November 2026 mentor-call report (latest)

Use **[TestPilot final mentor-call report, 6 November 2026](./TestPilot_Final_Mentor_Call_Report_2026-11-06.md)** for the current team progress update, 10 genuine Gemini runs, AI/manual technical comparison, verified main-branch Playwright results and Tasks 1-6 declaration.

**Task tracking:** Tasks 1-3 are recorded as **team-confirmed completed activities**, with signed/human-authentication evidence not attached in the latest accessible export archive. Tasks 4-6 have verified technical implementation and CI evidence. Final faculty approval is not yet documented. Older files below are preserved historical snapshots, not the current summary.

This folder versions the two documents previously prepared for the TestPilot BSc Design and Computing project. The checked-in Markdown files are full text extractions from the supplied Word source files; Word and PDF derivatives are rebuilt by [the faculty document publication workflow](../../.github/workflows/publish-faculty-documents.yml).

| Document | Editable Word | PDF | Source text |
| --- | --- | --- | --- |
| Updated project report (2 November 2026) | [DOCX](./TestPilot_BITS_Final_Report_Updated_2026-11-02.docx) | [PDF](./TestPilot_BITS_Final_Report_Updated_2026-11-02.pdf) | [Markdown](./TestPilot_BITS_Final_Report_Updated_2026-11-02.md) |
| Independent review & experiment evidence packet | [DOCX](./TestPilot_Independent_Review_and_Experiment_Evidence_Packet.docx) | [PDF](./TestPilot_Independent_Review_and_Experiment_Evidence_Packet.pdf) | [Markdown](./TestPilot_Independent_Review_and_Experiment_Evidence_Packet.md) |

**Document provenance:** The Markdown versions preserve the original document text. The checked-in DOCX/PDF formats are *regenerated from the Markdown transcripts*, not byte-for-byte copies of the chat-uploaded versions, and their pagination or table formatting may differ. The original Word/PDF files remain in the conversation's attachments.

**Academic integrity:** Both documents are evidence-collection drafts. The preliminary AI/manual analysis (12 historical genuine Gemini candidates; 4/6 versus 6/6 acceptance criteria) has not been independently confirmed by two human reviewers. The 10 separate genuine model outputs with three human quality ratings per run, independent review records, peer usability observations, and faculty sign-off remain pending until authentic records are added. Neither the document generator nor CI tests fabricate these results.

**Rebuild manually:** From the repository root:

```bash
python -m pip install python-docx==1.2.0 reportlab==4.4.4
python scripts/build_faculty_documents.py
```
