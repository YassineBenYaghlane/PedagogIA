import pytest


def _make_session_with_attempts(client, *, mode="drill", answers):
    student = client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    session = client.post(
        "/api/sessions/", {"student": student["id"], "mode": mode}, format="json"
    ).json()
    for ans in answers:
        ex = client.get("/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1").json()
        client.post(
            f"/api/sessions/{session['id']}/attempts/",
            {"signature": ex["signature"], "student_answer": ans},
            format="json",
        )
    return student, session


@pytest.mark.django_db
def test_summary_list_returns_aggregates(auth_client):
    _, session = _make_session_with_attempts(auth_client, mode="drill", answers=["999", "1", "2"])

    res = auth_client.get("/api/sessions/?summary=1")
    assert res.status_code == 200
    payload = res.json()
    rows = payload["results"] if isinstance(payload, dict) and "results" in payload else payload
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == session["id"]
    assert row["mode"] == "drill"
    assert row["attempt_count"] == 3
    assert "correct_count" in row
    assert row["accuracy"] is not None
    assert isinstance(row["skills"], list)
    assert row["skills"][0]["id"] == "add_avec_retenue_20"


@pytest.mark.django_db
def test_summary_filter_by_student(auth_client):
    s1, _ = _make_session_with_attempts(auth_client, answers=["1"])
    s2 = auth_client.post(
        "/api/students/", {"display_name": "B", "grade": "P1"}, format="json"
    ).json()
    auth_client.post("/api/sessions/", {"student": s2["id"], "mode": "drill"}, format="json")

    res = auth_client.get(f"/api/sessions/?summary=1&student={s1['id']}")
    rows = res.json()
    rows = rows["results"] if isinstance(rows, dict) and "results" in rows else rows
    assert len(rows) == 1


@pytest.mark.django_db
def test_summary_scoping(auth_client, api, other_user):
    _make_session_with_attempts(auth_client, answers=["1"])
    api.force_authenticate(other_user)
    res = api.get("/api/sessions/?summary=1")
    rows = res.json()
    rows = rows["results"] if isinstance(rows, dict) and "results" in rows else rows
    assert rows == []


@pytest.mark.django_db
def test_default_list_unchanged(auth_client):
    _make_session_with_attempts(auth_client, answers=["1"])
    res = auth_client.get("/api/sessions/")
    assert res.status_code == 200
    rows = res.json()
    rows = rows["results"] if isinstance(rows, dict) and "results" in rows else rows
    assert "attempt_count" not in rows[0]
    assert "mode" in rows[0]
