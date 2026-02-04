"""DOCX document formatting utilities."""

import re
from docx.shared import Pt, Inches, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from .docx_cleaners import (
    remove_leading_metadata,
    remove_horizontal_rules,
    remove_shape_lines,
)


def apply_docx_formatting(docx_path):
    """Apply all formatting to a DOCX document.

    Args:
        docx_path: Path to the DOCX file
    """
    from docx import Document

    doc = Document(docx_path)

    apply_page_margins(doc)
    remove_leading_metadata(doc)
    remove_horizontal_rules(doc)
    remove_shape_lines(doc)
    add_page_numbers(doc)
    apply_heading_sizes(doc)
    format_tables(doc)

    doc.save(docx_path)


def apply_page_margins(doc):
    """Apply standard page margins to document.

    Args:
        doc: Document object
    """
    for section in doc.sections:
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)
        section.top_margin = Inches(0.3)
        section.bottom_margin = Inches(0.3)
        section.left_margin = Inches(0.79)
        section.right_margin = Inches(0.33)
        section.header_distance = Inches(0)
        section.footer_distance = Inches(0.2)


def add_page_numbers(doc):
    """Add page numbers to document footer.

    Args:
        doc: Document object
    """
    for section in doc.sections:
        footer = section.footer
        if footer.paragraphs:
            paragraph = footer.paragraphs[0]
        else:
            paragraph = footer.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT

        run = paragraph.add_run()
        fld_char_begin = OxmlElement("w:fldChar")
        fld_char_begin.set(qn("w:fldCharType"), "begin")

        instr_text = OxmlElement("w:instrText")
        instr_text.set(qn("xml:space"), "preserve")
        instr_text.text = " PAGE "

        fld_char_separate = OxmlElement("w:fldChar")
        fld_char_separate.set(qn("w:fldCharType"), "separate")

        fld_char_end = OxmlElement("w:fldChar")
        fld_char_end.set(qn("w:fldCharType"), "end")

        run._r.append(fld_char_begin)
        run._r.append(instr_text)
        run._r.append(fld_char_separate)
        run._r.append(fld_char_end)


def apply_heading_sizes(doc):
    """Apply font sizes to headings.

    Args:
        doc: Document object
    """
    heading_sizes = {
        "Heading 1": 14,
        "Heading 2": 12,
        "Heading 3": 11,
        "Heading 4": 10,
        "Heading 5": 9,
        "Heading 6": 9,
    }

    for style_name, size_pt in heading_sizes.items():
        if style_name in doc.styles:
            style = doc.styles[style_name]
            if style and style.font:
                style.font.size = Pt(size_pt)

    for paragraph in doc.paragraphs:
        if paragraph.style and paragraph.style.name in heading_sizes:
            size_pt = heading_sizes[paragraph.style.name]
            for run in paragraph.runs:
                run.font.size = Pt(size_pt)


def format_tables(doc):
    """Format all tables in the document.

    Args:
        doc: Document object
    """
    if not doc.tables:
        return

    section = doc.sections[0]
    available_width = section.page_width - section.left_margin - section.right_margin

    for table in doc.tables:
        rows_count = len(table.rows)
        cols_count = len(table.columns)

        if cols_count >= 6:
            min_col_width = Inches(0.35)
            max_col_width = Inches(2.6)
            table_font_size = Pt(10)
        elif rows_count >= 6:
            min_col_width = Inches(0.45)
            max_col_width = Inches(3.0)
            table_font_size = Pt(10)
        elif cols_count == 2:
            min_col_width = Inches(0.5)
            max_col_width = Inches(3.2)
            table_font_size = Pt(11)
        else:
            min_col_width = Inches(0.45)
            max_col_width = Inches(3.0)
            table_font_size = Pt(11)

        table.style = "Table"
        table.autofit = False
        set_table_borders(table)

        header_row = table.rows[0] if table.rows else None

        for row_index, row in enumerate(table.rows):
            for cell in row.cells:
                set_cell_borders(cell)
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.size = table_font_size
                        if header_row and row_index == 0:
                            run.bold = True
                    if header_row and row_index == 0:
                        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                if header_row and row_index == 0:
                    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

        if header_row:
            normalize_header_labels(header_row)

        align_table_columns(table)
        adjust_table_column_widths(
            table, available_width, min_col_width, max_col_width, header_row
        )


def adjust_table_column_widths(
    table, available_width, min_col_width, max_col_width, header_row
):
    """Adjust table column widths based on content.

    Args:
        table: Table object
        available_width: Available page width
        min_col_width: Minimum column width
        max_col_width: Maximum column width
        header_row: Header row object
    """
    if not table.columns:
        return

    available_width_emu = int(available_width)
    min_col_width_emu = int(min_col_width)
    max_col_width_emu = int(max_col_width)

    header_texts = []
    if header_row:
        for cell in header_row.cells:
            header_texts.append(get_cell_text(cell))
    else:
        header_texts = [""] * len(table.columns)

    column_max_lengths = []
    per_col_min = []
    for col_index, column in enumerate(table.columns):
        max_len = 1
        for cell in column.cells:
            cell_text = get_cell_text(cell)
            if cell_text:
                max_len = max(max_len, len(cell_text))
        column_max_lengths.append(min(max_len, 120))
        per_col_min.append(min_col_width_emu)

    total_weight = sum(column_max_lengths) or 1
    weighted_lengths = []
    for idx, base in enumerate(column_max_lengths):
        header = header_texts[idx] if idx < len(header_texts) else ""
        weight = float(base)

        header_lower = header.lower()
        header_min_width = get_header_min_width(header)
        if header_min_width:
            per_col_min[idx] = max(per_col_min[idx], int(Inches(header_min_width)))

        if "4-7" in header_lower and "data" in header_lower:
            weight *= 1.2
            if idx < len(per_col_min):
                per_col_min[idx] = int(Inches(0.95))
        elif any(
            key in header_lower
            for key in ["примеч", "назнач", "description", "comment"]
        ):
            weight *= 1.6
        elif any(key in header_lower for key in ["устрой", "device"]):
            weight *= 1.2
        elif any(
            key in header_lower
            for key in ["байт", "byte", "cmd", "code", "op", "id", "№"]
        ):
            weight *= 0.6
        elif "блок" in header_lower:
            weight *= 1.6
            if idx < len(per_col_min):
                per_col_min[idx] = int(Inches(0.9))

        column = table.columns[idx]
        texts = [get_cell_text(cell) for cell in column.cells if get_cell_text(cell)]
        if texts:
            numeric_like = sum(1 for t in texts if is_numeric_like(t))
            if numeric_like / len(texts) >= 0.7:
                weight *= 0.6

        weighted_lengths.append(max(weight, 1))

    total_weight = sum(weighted_lengths) or 1
    raw_widths = [
        available_width_emu * (weight / total_weight) for weight in weighted_lengths
    ]

    clamped_widths = []
    for idx, width in enumerate(raw_widths):
        min_width = per_col_min[idx] if idx < len(per_col_min) else min_col_width_emu
        if width < min_width:
            clamped_widths.append(min_width)
        elif width > max_col_width_emu:
            clamped_widths.append(max_col_width_emu)
        else:
            clamped_widths.append(width)

    total_width = sum(clamped_widths) or available_width_emu
    scale = available_width_emu / total_width if total_width else 1
    final_widths = [int(width * scale) for width in clamped_widths]

    for col_index, width in enumerate(final_widths):
        table.columns[col_index].width = Emu(width)
        for cell in table.columns[col_index].cells:
            cell.width = Emu(width)


def align_table_columns(table):
    """Align table columns based on content type.

    Args:
        table: Table object
    """
    if not table.columns:
        return

    for col_index, column in enumerate(table.columns):
        texts = []
        for cell in column.cells:
            text = get_cell_text(cell)
            if text:
                texts.append(text)

        if not texts:
            continue

        numeric_like = sum(1 for t in texts if is_numeric_like(t))
        avg_len = sum(len(t) for t in texts) / len(texts)
        should_center = (numeric_like / len(texts) >= 0.7) or avg_len <= 4

        if should_center:
            for cell in column.cells:
                for paragraph in cell.paragraphs:
                    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER


def is_numeric_like(text):
    """Check if text appears to be numeric.

    Args:
        text: Text to check

    Returns:
        True if text is numeric-like
    """
    value = text.strip()
    if not value:
        return False
    value = value.replace(",", ".")
    if re.fullmatch(r"[+-]?\d+(\.\d+)?", value):
        return True
    if re.fullmatch(r"0x[0-9a-fA-F]+", value):
        return True
    if re.fullmatch(r"[0-9a-fA-F]{2,}", value):
        return True
    return False


def normalize_header_labels(header_row):
    """Normalize and format table header labels.

    Args:
        header_row: Header row object
    """
    for cell in header_row.cells:
        for paragraph in cell.paragraphs:
            text = paragraph.text.strip()
            if not text:
                continue
            if "Блок" in text:
                paragraph.clear()
                run = paragraph.add_run("Блок")
                run.font.size = Pt(10)
                run.bold = True
            if "Устройство" in text:
                paragraph.clear()
                run = paragraph.add_run("Устройство")
                run.font.size = Pt(10)
                run.bold = True
            if "1-й" in text and "байт" in text:
                paragraph.clear()
                run = paragraph.add_run("1-й байт")
                run.font.size = Pt(10)
                run.bold = True
            if "2-й" in text and "байт" in text:
                paragraph.clear()
                run = paragraph.add_run("2-й байт")
                run.font.size = Pt(10)
                run.bold = True
            if "4-7" in text and "Data" in text:
                paragraph.clear()
                run = paragraph.add_run("4-7 ?байт")
                run.font.size = Pt(10)
                run.bold = True
                run.add_break()
                run2 = paragraph.add_run("(Data)")
                run2.font.size = Pt(10)
                run2.bold = True


def get_header_min_width(header_text):
    """Get minimum width for a header based on its content.

    Args:
        header_text: Header text

    Returns:
        Minimum width in inches, or None
    """
    if not header_text:
        return None

    text_lower = header_text.lower()
    if "устрой" in text_lower or "device" in text_lower:
        return 1.2
    if "1-й" in text_lower and "байт" in text_lower:
        return 0.7
    if "2-й" in text_lower and "байт" in text_lower:
        return 0.7
    if "блок" in text_lower:
        return 0.7
    if "4-7" in text_lower and "data" in text_lower:
        return 0.95

    clean_len = len(re.sub(r"\s+", "", header_text))
    if clean_len <= 6:
        return 0.6
    if clean_len <= 12:
        return 0.85
    if clean_len <= 20:
        return 1.2
    return 1.4


def set_table_borders(table):
    """Set borders for a table.

    Args:
        table: Table object
    """
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)

    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        element = borders.find(qn(f"w:{edge}"))
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "8")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "000000")


def set_cell_borders(cell):
    """Set borders for a table cell.

    Args:
        cell: Cell object
    """
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)

    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        edge_tag = qn(f"w:{edge}")
        element = borders.find(edge_tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "8")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "000000")


def get_cell_text(cell):
    """Extract text from a table cell.

    Args:
        cell: Cell object

    Returns:
        Cell text as string
    """
    parts = []
    for paragraph in cell.paragraphs:
        if paragraph.text:
            parts.append(paragraph.text.strip())
    return " ".join(parts).strip()
