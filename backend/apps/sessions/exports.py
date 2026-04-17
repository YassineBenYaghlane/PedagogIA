"""Per-student exports: sessions summary, PDF report card, JSON dump."""

from collections import defaultdict
from io import BytesIO

from django.db.models import Count, Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from apps.exercises.models import Attempt
from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

from .models import Session

MODE_LABELS = {"learn": "Entraînement", "diagnostic": "Diagnostic", "drill": "Automatismes"}


def session_summaries(student: Student) -> list[dict]:
    """One row per session (date, mode, duration, accuracy, skills touched)."""
    sessions = (
        Session.objects.filter(student=student)
        .annotate(
            total=Count("attempts"),
            correct=Count("attempts", filter=Q(attempts__is_correct=True)),
            skills=Count("attempts__skill", distinct=True),
        )
        .filter(total__gt=0)
        .order_by("-started_at")
    )
    out = []
    for s in sessions:
        duration = None
        if s.ended_at and s.started_at:
            duration = int((s.ended_at - s.started_at).total_seconds())
        out.append(
            {
                "id": str(s.id),
                "mode": s.mode,
                "mode_label": MODE_LABELS.get(s.mode, s.mode),
                "started_at": s.started_at.isoformat(),
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "duration_seconds": duration,
                "total_attempts": s.total,
                "correct": s.correct,
                "accuracy": round(s.correct / s.total, 2) if s.total else 0.0,
                "skills_touched": s.skills,
            }
        )
    return out


def build_full_json(student: Student) -> dict:
    """Full data dump: student, sessions, attempts, per-skill mastery."""
    sessions = list(
        Session.objects.filter(student=student)
        .annotate(total=Count("attempts"))
        .filter(total__gt=0)
        .order_by("started_at")
        .values("id", "mode", "started_at", "ended_at")
    )
    for s in sessions:
        s["id"] = str(s["id"])
        s["started_at"] = s["started_at"].isoformat() if s["started_at"] else None
        s["ended_at"] = s["ended_at"].isoformat() if s["ended_at"] else None

    attempts = list(
        Attempt.objects.filter(session__student=student)
        .select_related("skill", "template")
        .order_by("responded_at")
        .values(
            "id",
            "session_id",
            "skill_id",
            "template_id",
            "input_type",
            "student_answer",
            "correct_answer",
            "is_correct",
            "responded_at",
        )
    )
    for a in attempts:
        a["id"] = str(a["id"])
        a["session_id"] = str(a["session_id"])
        a["responded_at"] = a["responded_at"].isoformat() if a["responded_at"] else None

    mastery = list(
        StudentSkillState.objects.filter(student=student).values(
            "skill_id",
            "status",
            "mastery_level",
            "total_attempts",
            "consecutive_correct",
            "last_practiced_at",
        )
    )
    for m in mastery:
        m["last_practiced_at"] = (
            m["last_practiced_at"].isoformat() if m["last_practiced_at"] else None
        )

    return {
        "student": {
            "id": str(student.id),
            "display_name": student.display_name,
            "grade": student.grade,
            "created_at": student.created_at.isoformat() if student.created_at else None,
            "xp": student.xp,
            "rank": student.rank,
            "current_streak": student.current_streak,
            "best_streak": student.best_streak,
        },
        "sessions": sessions,
        "attempts": attempts,
        "mastery": mastery,
    }


def build_pdf(student: Student) -> bytes:
    """A4 French report card: overview, per-year mastery, recent sessions."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Rapport — {student.display_name}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#2B3A2E"),
        spaceAfter=10,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#5C6B5F"),
        spaceAfter=18,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#3F6F4A"),
        spaceBefore=12,
        spaceAfter=8,
    )

    story = [
        Paragraph(f"Rapport pédagogique — {student.display_name}", title_style),
        Paragraph(
            f"Niveau déclaré : {student.grade} · XP : {student.xp} · Rang : {student.rank}",
            subtitle_style,
        ),
    ]

    # Session overview
    summaries = session_summaries(student)
    total = len(summaries)
    total_attempts = sum(s["total_attempts"] for s in summaries)
    total_correct = sum(s["correct"] for s in summaries)
    overall = round(total_correct / total_attempts * 100) if total_attempts else 0

    story.append(Paragraph("Vue d’ensemble", section_style))
    overview_rows = [
        ["Sessions", f"{total}"],
        ["Exercices réalisés", f"{total_attempts}"],
        ["Réussite globale", f"{overall} %"],
    ]
    overview_table = Table(overview_rows, colWidths=[6 * cm, 10 * cm])
    overview_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ECF1E7")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#2B3A2E")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(overview_table)

    # Per-year mastery
    skills = {s.id: s for s in Skill.objects.all()}
    attempts = Attempt.objects.filter(session__student=student).select_related("skill")
    per_year: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "correct": 0})
    for a in attempts:
        grade = skills.get(a.skill_id).grade if skills.get(a.skill_id) else "?"
        per_year[grade]["total"] += 1
        if a.is_correct:
            per_year[grade]["correct"] += 1

    if per_year:
        story.append(Paragraph("Maîtrise par année", section_style))
        year_rows = [["Année", "Exercices", "Réussite"]]
        for grade in ["P1", "P2", "P3", "P4", "P5", "P6"]:
            row = per_year.get(grade)
            if not row:
                continue
            rate = round(row["correct"] / row["total"] * 100) if row["total"] else 0
            year_rows.append([grade, str(row["total"]), f"{rate} %"])
        year_table = Table(year_rows, colWidths=[4 * cm, 6 * cm, 6 * cm])
        year_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6FA274")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ]
            )
        )
        story.append(year_table)

    # Recent sessions (latest 12)
    if summaries:
        story.append(Spacer(1, 10))
        story.append(Paragraph("Sessions récentes", section_style))
        sess_rows = [["Date", "Mode", "Exercices", "Réussite"]]
        for s in summaries[:12]:
            date = s["started_at"][:10] if s["started_at"] else ""
            acc = f"{round(s['accuracy'] * 100)} %" if s["total_attempts"] else "—"
            sess_rows.append([date, s["mode_label"], str(s["total_attempts"]), acc])
        sess_table = Table(sess_rows, colWidths=[4 * cm, 5 * cm, 3.5 * cm, 3.5 * cm])
        sess_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6FA274")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ]
            )
        )
        story.append(sess_table)

    doc.build(story)
    return buffer.getvalue()
