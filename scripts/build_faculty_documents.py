#!/usr/bin/env python3
"""Build Git-tracked editable Word and PDF copies of faculty-source Markdown.

Both sources are textual transcriptions of the supplied report documents.
No experimental outcome, participant signature, or faculty approval is added.
"""
from pathlib import Path
import re
import html

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1] / "docs" / "faculty-submission"
STEMS = (
    "TestPilot_BITS_Final_Report_Updated_2026-11-02",
    "TestPilot_Independent_Review_and_Experiment_Evidence_Packet",
)

def blocks(source):
    # Markdown sources preserve the content of the uploaded evidence drafts.
    raw = source.read_text(encoding="utf-8").replace("\r\n", "\n")
    sections = []
    for piece in re.split(r"\n\s*\n", raw):
        for line in piece.splitlines():
            stripped = line.strip().replace("\t", "  ")
            if not stripped:
                continue
            if stripped.startswith("> "):
                sections.append(("note", stripped[2:]))
            elif stripped.startswith("# "):
                sections.append(("title", stripped[2:]))
            elif stripped.startswith("## "):
                sections.append(("heading", stripped[3:]))
            elif stripped.startswith("### "):
                sections.append(("subheading", stripped[4:]))
            elif re.match(r"^\d{1,2}\.\s+[A-Z]", stripped) or stripped in {"Abstract", "References", "Conclusion"}:
                sections.append(("heading", stripped))
            elif stripped.startswith(("• ", "- ", "* ")):
                sections.append(("bullet", stripped[2:]))
            else:
                sections.append(("paragraph", stripped))
    return sections

def make_docx(stem, parts):
    d = Document()
    sec = d.sections[0]
    sec.top_margin = Inches(.78)
    sec.bottom_margin = Inches(.7)
    sec.left_margin = Inches(.85)
    sec.right_margin = Inches(.85)
    styles = d.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(9)
    normal.font.color.rgb = RGBColor(35, 49, 75)
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.12
    for name, size in [("Title",19),("Heading 1",12),("Heading 2",10)]:
        style=styles[name]
        style.font.name="Aptos Display"
        style.font.size=Pt(size)
        style.font.bold=True
        style.font.color.rgb=RGBColor(25,63,120)
        style.paragraph_format.space_before=Pt(10)
        style.paragraph_format.space_after=Pt(5)
    for kind, text in parts:
        if kind=="title":
            p=d.add_paragraph(text,style="Title")
            p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        elif kind=="heading":
            d.add_paragraph(text,style="Heading 1")
        elif kind=="subheading":
            d.add_paragraph(text,style="Heading 2")
        elif kind=="bullet":
            d.add_paragraph(text,style="List Bullet")
        elif kind=="note":
            p=d.add_paragraph(text)
            p.style="Intense Quote" if "Intense Quote" in styles else "Normal"
        else:
            d.add_paragraph(text)
    # Evidence-based draft: do not suggest that the report is approved.
    footer=sec.footer.paragraphs[0]
    footer.text="BITS Pilani  |  TestPilot  |  Academic evidence draft — validation required"
    footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
    d.core_properties.title=stem.replace("_"," ")
    d.core_properties.subject="Faculty project evidence — draft"
    d.save(ROOT/(stem+".docx"))

def make_pdf(stem, parts):
    font="Helvetica"
    candidate=Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold_candidate=Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if candidate.exists() and bold_candidate.exists():
        pdfmetrics.registerFont(TTFont("DejaVu",str(candidate)))
        pdfmetrics.registerFont(TTFont("DejaVuBold",str(bold_candidate)))
        font="DejaVu"
    bold="DejaVuBold" if font=="DejaVu" else "Helvetica-Bold"
    body=ParagraphStyle("BodyEvidence",fontName=font,fontSize=8.35,leading=12.4,
        spaceAfter=5,textColor=colors.HexColor("#26354C"),wordWrap="CJK")
    h1=ParagraphStyle("H1Evidence",parent=body,fontName=bold,fontSize=12.1,
        leading=16.5,spaceBefore=14,spaceAfter=7,textColor=colors.HexColor("#1E497E"))
    h2=ParagraphStyle("H2Evidence",parent=body,fontName=bold,fontSize=10,
        leading=14.2,spaceBefore=11,spaceAfter=6,textColor=colors.HexColor("#1E497E"))
    title=ParagraphStyle("TitleEvidence",parent=h1,fontSize=17,leading=22,
        alignment=TA_CENTER,spaceBefore=2,spaceAfter=11)
    note=ParagraphStyle("NoteEvidence",parent=body,fontSize=7.7,leading=11.8,
        textColor=colors.HexColor("#586478"))
    dest=ROOT/(stem+".pdf")
    pdf=SimpleDocTemplate(str(dest),pagesize=A4,leftMargin=51,rightMargin=51,
        topMargin=48,bottomMargin=50,title=stem.replace("_"," "),
        author="TestPilot project group — faculty evidence draft")
    story=[]
    for kind, text in parts:
        safe=html.escape(text,quote=False)
        # Avoid literal Markdown formatting while retaining its words.
        if kind=="title": style=title
        elif kind=="heading":style=h1
        elif kind=="subheading":style=h2
        elif kind=="note":style=note
        else:style=body
        if kind=="bullet": safe="• "+safe
        story.append(Paragraph(safe,style))
    def page_header_footer(canvas,doc):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#72839B"))
        canvas.setFont(font,7)
        canvas.drawString(51,25,"BITS Pilani | TestPilot | Evidence draft — human validation pending")
        canvas.drawRightString(A4[0]-51,25,f"Page {doc.page}")
        canvas.restoreState()
    pdf.build(story,onFirstPage=page_header_footer,onLaterPages=page_header_footer)

def main():
    for stem in STEMS:
        md=ROOT/(stem+".md")
        if not md.is_file():
            raise FileNotFoundError(md)
        content=blocks(md)
        if len(content)<40: raise ValueError(f"Source looks incomplete: {md}")
        make_docx(stem,content)
        make_pdf(stem,content)
        print(f"Rendered {stem}: {len(content)} content blocks")

if __name__=="__main__":main()
