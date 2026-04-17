"""Per-student exports: sessions summary, PDF report card, JSON dump."""

from collections import defaultdict
from datetime import datetime, time, timedelta
from io import BytesIO

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from apps.exercises.diagnostic import build_result as build_diagnostic_result
from apps.exercises.models import Attempt
from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

from .models import Session

LEVEL_COPY = {
    "P1": "1ʳᵉ primaire",
    "P2": "2ᵉ primaire",
    "P3": "3ᵉ primaire",
    "P4": "4ᵉ primaire",
    "P5": "5ᵉ primaire",
    "P6": "6ᵉ primaire",
}

BUCKET_COPY = {"green": "En croissance", "orange": "À arroser", "red": "Graine"}

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


def daily_activity_summary(student: Student, days: int = 7) -> dict:
    """Aggregate attempts over the last N days (inclusive of today) in Brussels-local dates."""
    from apps.students.services.streaks import BRUSSELS, brussels_today

    today = brussels_today()
    start_day = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_day, time.min).replace(tzinfo=BRUSSELS)

    attempts = Attempt.objects.filter(session__student=student, responded_at__gte=start_dt)
    session_count = (
        Session.objects.filter(student=student, started_at__gte=start_dt).distinct().count()
    )

    rows = (
        attempts.annotate(day=TruncDate("responded_at", tzinfo=BRUSSELS))
        .values("day")
        .annotate(n=Count("id"), correct=Count("id", filter=Q(is_correct=True)))
    )
    by_day_map = {r["day"]: r for r in rows}

    by_day = []
    total_attempts = 0
    total_correct = 0
    for i in range(days):
        day = start_day + timedelta(days=i)
        row = by_day_map.get(day)
        n = row["n"] if row else 0
        correct = row["correct"] if row else 0
        by_day.append(
            {
                "date": day.isoformat(),
                "attempts": n,
                "accuracy": round(correct / n, 2) if n else 0.0,
            }
        )
        total_attempts += n
        total_correct += correct

    return {
        "sessions": session_count,
        "attempts": total_attempts,
        "accuracy": round(total_correct / total_attempts, 2) if total_attempts else 0.0,
        "by_day": by_day,
    }


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


def build_session_pdf(session: Session) -> bytes:
    """A4 per-session report: summary + ordered question / student answer / correct answer list."""
    from apps.exercises.serializers import render_prompt

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Session — {session.student.display_name}",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "SessTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#2B3A2E"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "SessSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#5C6B5F"),
        spaceAfter=14,
    )
    section_style = ParagraphStyle(
        "SessSection",
        parent=styles["Heading2"],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#3F6F4A"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "SessBody",
        parent=styles["Normal"],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#2B3A2E"),
    )

    mode_label = MODE_LABELS.get(session.mode, session.mode)
    started = session.started_at.strftime("%d/%m/%Y %H:%M") if session.started_at else "—"
    duration = None
    if session.started_at and session.ended_at:
        duration = int((session.ended_at - session.started_at).total_seconds())
    duration_str = (
        (f"{duration // 60}m{duration % 60:02d}s" if duration else "—")
        if duration is not None
        else "—"
    )

    attempts = list(session.attempts.select_related("skill", "template").order_by("responded_at"))
    total = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct)
    pct = round(correct / total * 100) if total else 0

    story = [
        Paragraph(f"{mode_label} — {session.student.display_name}", title_style),
        Paragraph(f"Réalisée le {started} · Durée : {duration_str}", subtitle_style),
        Paragraph("Vue d’ensemble", section_style),
    ]
    overview_rows = [
        ["Exercices", f"{total}"],
        ["Réponses correctes", f"{correct}"],
        ["Réussite", f"{pct} %"],
    ]
    overview_table = Table(overview_rows, colWidths=[6 * cm, 10 * cm])
    overview_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ECF1E7")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#2B3A2E")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
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

    if attempts:
        story.append(Paragraph("Questions", section_style))
        header = ["#", "Question", "Réponse élève", "Bonne réponse", ""]
        rows = [header]
        for i, a in enumerate(attempts, start=1):
            prompt = render_prompt(a.template.template, a.exercise_params or {}) or (
                a.skill.label if a.skill else ""
            )
            status = "✓" if a.is_correct else "✗"
            rows.append(
                [
                    str(i),
                    Paragraph(prompt or "—", body_style),
                    Paragraph(str(a.student_answer or "—"), body_style),
                    Paragraph(str(a.correct_answer or "—"), body_style),
                    status,
                ]
            )
        table = Table(
            rows,
            colWidths=[1 * cm, 8 * cm, 3.5 * cm, 3.5 * cm, 1 * cm],
            repeatRows=1,
        )
        style_cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6FA274")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (4, 0), (4, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ]
        for i, a in enumerate(attempts, start=1):
            if not a.is_correct:
                style_cmds.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FCEBE9")))
                style_cmds.append(("TEXTCOLOR", (4, i), (4, i), colors.HexColor("#C26B65")))
            else:
                style_cmds.append(("TEXTCOLOR", (4, i), (4, i), colors.HexColor("#3F6F4A")))
        table.setStyle(TableStyle(style_cmds))
        story.append(table)
    else:
        story.append(Paragraph("Aucune question enregistrée.", body_style))

    doc.build(story)
    return buffer.getvalue()


def build_diagnostic_pdf(session: Session) -> bytes:
    """A4 rendering of the diagnostic result for a single session."""
    if session.mode != "diagnostic":
        raise ValueError("session is not a diagnostic")

    data = build_diagnostic_result(session)
    student = session.student

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Diagnostic — {student.display_name}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DiagTitle",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#2B3A2E"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "DiagSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#5C6B5F"),
        spaceAfter=16,
    )
    section_style = ParagraphStyle(
        "DiagSection",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#3F6F4A"),
        spaceBefore=14,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "DiagBody",
        parent=styles["Normal"],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#2B3A2E"),
    )

    ended_at = session.ended_at or session.started_at
    date_str = ended_at.strftime("%d/%m/%Y") if ended_at else "—"

    story = [
        Paragraph(f"Diagnostic — {student.display_name}", title_style),
        Paragraph(f"Réalisé le {date_str} · Niveau déclaré : {student.grade}", subtitle_style),
    ]

    # Verdict block
    verdict = data.get("verdict") or {}
    level = verdict.get("level")
    confidence = round((verdict.get("confidence") or 0) * 100)
    narrative = verdict.get("narrative")

    if level:
        story.append(Paragraph("Verdict", section_style))
        verdict_rows = [
            ["Niveau FWB", f"{level} — {LEVEL_COPY.get(level, level)}"],
            ["Confiance", f"{confidence} %"],
        ]
        verdict_table = Table(verdict_rows, colWidths=[5 * cm, 11 * cm])
        verdict_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ECF1E7")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#2B3A2E")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(verdict_table)
        if narrative:
            story.append(Spacer(1, 6))
            story.append(Paragraph(narrative, body_style))
    else:
        story.append(Paragraph("Verdict", section_style))
        story.append(
            Paragraph("Niveau non établi — refaites le diagnostic pour affiner.", body_style)
        )

    # Overall stats
    total = data.get("total_attempts", 0)
    correct = data.get("total_correct", 0)
    overall_pct = round((data.get("overall_rate") or 0) * 100)

    story.append(Paragraph("Vue d’ensemble", section_style))
    stats_rows = [
        ["Exercices", f"{total}"],
        ["Réponses correctes", f"{correct}"],
        ["Réussite", f"{overall_pct} %"],
    ]
    stats_table = Table(stats_rows, colWidths=[6 * cm, 10 * cm])
    stats_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ECF1E7")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#2B3A2E")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(stats_table)

    # Year mastery
    years = data.get("years") or []
    if years:
        story.append(Paragraph("Maîtrise par année", section_style))
        year_rows = [["Année", "Exercices", "Réussite", "Diff. max", "État"]]
        for y in years:
            rate_pct = round((y.get("rate") or 0) * 100)
            year_rows.append(
                [
                    y["grade"],
                    f"{y['correct']}/{y['n']}",
                    f"{rate_pct} %",
                    f"d{y.get('max_difficulty', 1)}",
                    BUCKET_COPY.get(y.get("bucket", "orange"), ""),
                ]
            )
        year_table = Table(year_rows, colWidths=[2.5 * cm, 3 * cm, 3 * cm, 2.5 * cm, 5 * cm])
        year_table.setStyle(
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
                    ("ALIGN", (1, 0), (3, -1), "RIGHT"),
                ]
            )
        )
        story.append(year_table)

    # Strengths / weaknesses
    def _bullets(items):
        return ListFlowable(
            [ListItem(Paragraph(s["label"], body_style), leftIndent=8) for s in items],
            bulletType="bullet",
            start="•",
            leftIndent=12,
        )

    strengths = data.get("strengths") or []
    if strengths:
        story.append(Paragraph("Points forts", section_style))
        story.append(_bullets(strengths))

    weaknesses = data.get("weaknesses") or []
    if weaknesses:
        story.append(Paragraph("À arroser", section_style))
        story.append(_bullets(weaknesses))

    # Detail per skill, grouped by grade
    skills = data.get("skills") or []
    if skills:
        story.append(Paragraph("Détail par compétence", section_style))
        by_grade: dict[str, list[dict]] = defaultdict(list)
        for s in skills:
            by_grade[s.get("grade") or "—"].append(s)
        for grade in ["P1", "P2", "P3", "P4", "P5", "P6"]:
            group = by_grade.get(grade)
            if not group:
                continue
            skill_rows = [["Compétence", "Réussite", "État"]]
            for s in group:
                rate_pct = round((s.get("rate") or 0) * 100)
                skill_rows.append(
                    [
                        s["label"],
                        f"{s['correct']}/{s['total']} · {rate_pct} %",
                        BUCKET_COPY.get(s.get("bucket", "orange"), ""),
                    ]
                )
            skill_table = Table(skill_rows, colWidths=[8.5 * cm, 4.5 * cm, 3 * cm])
            skill_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECF1E7")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3F6F4A")),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7E0B5")),
                        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C7E0B5")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                    ]
                )
            )
            story.append(Paragraph(f"<b>{grade}</b>", body_style))
            story.append(Spacer(1, 2))
            story.append(skill_table)
            story.append(Spacer(1, 6))

    doc.build(story)
    return buffer.getvalue()
