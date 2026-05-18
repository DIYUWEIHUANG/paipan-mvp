from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from app.settings import database_path

OUTCOME_KEYS = ("matched", "partial", "missed", "unknown")
TIMING_KEYS = ("early", "on_time", "late", "not_happened", "unknown")
RESULT_TYPE_KEYS = ("da_liuren", "xiao_liuren", "liu_yao")
QUALITY_KEYS = ("valid", "test", "noise", "invalid_datetime", "meaningless_question", "duplicate", "unknown")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_database_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    path = database_path()
    ensure_database_parent(path)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    try:
        init_db(connection)
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS divination_records (
            id TEXT PRIMARY KEY,
            result_type TEXT NOT NULL,
            mode_label TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            question_text TEXT NOT NULL,
            question_category TEXT NOT NULL,
            rule_version TEXT NOT NULL,
            app_result_json TEXT NOT NULL
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS divination_feedbacks (
            record_id TEXT PRIMARY KEY,
            result_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            feedback_at TEXT NOT NULL,
            actual_outcome TEXT NOT NULL,
            outcome_matched TEXT NOT NULL,
            timing_matched TEXT NOT NULL,
            quality_tag TEXT NOT NULL,
            privacy_level TEXT NOT NULL,
            useful_parts_json TEXT NOT NULL,
            wrong_parts_json TEXT NOT NULL,
            user_note TEXT NOT NULL,
            admin_review_note TEXT NOT NULL,
            original_result_json TEXT NOT NULL,
            feedback_json TEXT NOT NULL,
            FOREIGN KEY(record_id) REFERENCES divination_records(id)
        )
        """
    )


def json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def json_loads(value: str) -> Any:
    return json.loads(value)


def normalize_result_type(value: Any) -> str:
    result_type = str(value or "unknown")
    return result_type if result_type in RESULT_TYPE_KEYS else "unknown"


def result_input(result: dict[str, Any]) -> dict[str, Any]:
    value = result.get("input")
    return value if isinstance(value, dict) else {}


def question_text_from_result(result: dict[str, Any], fallback: str = "") -> str:
    input_value = result_input(result)
    return str(input_value.get("questionText") or input_value.get("question_text") or fallback or "")


def question_category_from_result(result: dict[str, Any]) -> str:
    input_value = result_input(result)
    return str(input_value.get("questionCategory") or input_value.get("question_category") or "general")


def rule_version_from_result(result: dict[str, Any]) -> str:
    result_type = normalize_result_type(result.get("type"))
    milestone = result.get("milestone", "unknown")
    return f"{result_type}:milestone-{milestone}"


def record_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "resultType": row["result_type"],
        "modeLabel": row["mode_label"],
        "title": row["title"],
        "createdAt": row["created_at"],
        "questionText": row["question_text"],
        "questionCategory": row["question_category"],
        "ruleVersion": row["rule_version"],
        "result": json_loads(row["app_result_json"]),
    }


def feedback_from_row(row: sqlite3.Row) -> dict[str, Any]:
    payload = json_loads(row["feedback_json"])
    payload["originalResult"] = json_loads(row["original_result_json"])
    return payload


def save_record(payload: dict[str, Any]) -> dict[str, Any]:
    result = payload.get("result")
    if not isinstance(result, dict):
        raise ValueError("record.result must be an AppResult object.")

    record_id = str(payload.get("id") or "")
    if not record_id:
        raise ValueError("record.id is required.")

    result_type = normalize_result_type(payload.get("resultType") or result.get("type"))
    if result_type == "unknown":
        raise ValueError("record.resultType must be da_liuren, xiao_liuren, or liu_yao.")

    title = str(payload.get("title") or question_text_from_result(result) or result_type)
    created_at = str(payload.get("createdAt") or utc_now())
    record = {
        "id": record_id,
        "resultType": result_type,
        "modeLabel": str(payload.get("modeLabel") or result_type),
        "title": title,
        "createdAt": created_at,
        "questionText": question_text_from_result(result, title),
        "questionCategory": question_category_from_result(result),
        "ruleVersion": rule_version_from_result(result),
        "result": result,
    }

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO divination_records (
                id, result_type, mode_label, title, created_at,
                question_text, question_category, rule_version, app_result_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                result_type=excluded.result_type,
                mode_label=excluded.mode_label,
                title=excluded.title,
                created_at=excluded.created_at,
                question_text=excluded.question_text,
                question_category=excluded.question_category,
                rule_version=excluded.rule_version,
                app_result_json=excluded.app_result_json
            """,
            (
                record["id"],
                record["resultType"],
                record["modeLabel"],
                record["title"],
                record["createdAt"],
                record["questionText"],
                record["questionCategory"],
                record["ruleVersion"],
                json_dumps(record["result"]),
            ),
        )
    return record


def get_records() -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute("SELECT * FROM divination_records ORDER BY created_at DESC").fetchall()
    return [record_from_row(row) for row in rows]


def get_record(record_id: str) -> dict[str, Any] | None:
    with connect() as connection:
        row = connection.execute("SELECT * FROM divination_records WHERE id = ?", (record_id,)).fetchone()
    return record_from_row(row) if row else None


def save_feedback(payload: dict[str, Any]) -> dict[str, Any]:
    record_id = str(payload.get("recordId") or "")
    if not record_id:
        raise ValueError("feedback.recordId is required.")
    record = get_record(record_id)
    if not record:
        raise ValueError("feedback.recordId must correspond to an existing record.id.")

    original_result = payload.get("originalResult") or record["result"]
    if not isinstance(original_result, dict):
        raise ValueError("feedback.originalResult must be an AppResult object.")

    feedback = {
        "recordId": record_id,
        "resultType": normalize_result_type(payload.get("resultType") or record["resultType"]),
        "createdAt": str(payload.get("createdAt") or record["createdAt"]),
        "feedbackAt": str(payload.get("feedbackAt") or utc_now()),
        "actualOutcome": str(payload.get("actualOutcome") or ""),
        "outcomeMatched": str(payload.get("outcomeMatched") or "unknown"),
        "timingMatched": str(payload.get("timingMatched") or "unknown"),
        "qualityTag": str(payload.get("qualityTag") or "unknown"),
        "privacyLevel": str(payload.get("privacyLevel") or "private_raw"),
        "usefulParts": payload.get("usefulParts") if isinstance(payload.get("usefulParts"), list) else [],
        "wrongParts": payload.get("wrongParts") if isinstance(payload.get("wrongParts"), list) else [],
        "userNote": str(payload.get("userNote") or ""),
        "adminReviewNote": str(payload.get("adminReviewNote") or ""),
        "originalResult": original_result,
    }

    if feedback["resultType"] == "unknown":
        raise ValueError("feedback.resultType must be da_liuren, xiao_liuren, or liu_yao.")
    if feedback["outcomeMatched"] not in OUTCOME_KEYS:
        feedback["outcomeMatched"] = "unknown"
    if feedback["timingMatched"] not in TIMING_KEYS:
        feedback["timingMatched"] = "unknown"
    if feedback["qualityTag"] not in QUALITY_KEYS:
        feedback["qualityTag"] = "unknown"
    if feedback["privacyLevel"] not in ("private_raw", "anonymized", "public_stats"):
        feedback["privacyLevel"] = "private_raw"

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO divination_feedbacks (
                record_id, result_type, created_at, feedback_at, actual_outcome,
                outcome_matched, timing_matched, quality_tag, privacy_level,
                useful_parts_json, wrong_parts_json, user_note, admin_review_note,
                original_result_json, feedback_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(record_id) DO UPDATE SET
                result_type=excluded.result_type,
                created_at=excluded.created_at,
                feedback_at=excluded.feedback_at,
                actual_outcome=excluded.actual_outcome,
                outcome_matched=excluded.outcome_matched,
                timing_matched=excluded.timing_matched,
                quality_tag=excluded.quality_tag,
                privacy_level=excluded.privacy_level,
                useful_parts_json=excluded.useful_parts_json,
                wrong_parts_json=excluded.wrong_parts_json,
                user_note=excluded.user_note,
                admin_review_note=excluded.admin_review_note,
                original_result_json=excluded.original_result_json,
                feedback_json=excluded.feedback_json
            """,
            (
                feedback["recordId"],
                feedback["resultType"],
                feedback["createdAt"],
                feedback["feedbackAt"],
                feedback["actualOutcome"],
                feedback["outcomeMatched"],
                feedback["timingMatched"],
                feedback["qualityTag"],
                feedback["privacyLevel"],
                json_dumps(feedback["usefulParts"]),
                json_dumps(feedback["wrongParts"]),
                feedback["userNote"],
                feedback["adminReviewNote"],
                json_dumps(feedback["originalResult"]),
                json_dumps(feedback),
            ),
        )
    return feedback


def get_feedbacks() -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute("SELECT * FROM divination_feedbacks ORDER BY feedback_at DESC").fetchall()
    return [feedback_from_row(row) for row in rows]


def stats() -> dict[str, Any]:
    feedbacks = get_feedbacks()
    valid_feedbacks = [feedback for feedback in feedbacks if feedback.get("qualityTag") == "valid"]
    payload = {
        "total": len(valid_feedbacks),
        "byOutcomeMatched": {key: 0 for key in OUTCOME_KEYS},
        "byTimingMatched": {key: 0 for key in TIMING_KEYS},
        "byResultType": {key: 0 for key in RESULT_TYPE_KEYS},
    }
    for feedback in valid_feedbacks:
        outcome = feedback.get("outcomeMatched") if feedback.get("outcomeMatched") in OUTCOME_KEYS else "unknown"
        timing = feedback.get("timingMatched") if feedback.get("timingMatched") in TIMING_KEYS else "unknown"
        result_type = feedback.get("resultType") if feedback.get("resultType") in RESULT_TYPE_KEYS else "liu_yao"
        payload["byOutcomeMatched"][outcome] += 1
        payload["byTimingMatched"][timing] += 1
        payload["byResultType"][result_type] += 1
    return payload


def private_raw_export() -> dict[str, Any]:
    return {
        "exportType": "private_raw",
        "exportedAt": utc_now(),
        "privacyWarning": "该文件包含问题原文、出生时间和反馈数据，请勿上传 GitHub。",
        "records": get_records(),
        "feedbacks": get_feedbacks(),
    }


def anonymized_export() -> dict[str, Any]:
    items = []
    for feedback in get_feedbacks():
        result = feedback.get("originalResult")
        result = result if isinstance(result, dict) else {}
        items.append(
            {
                "resultType": feedback.get("resultType", "unknown"),
                "questionCategory": question_category_from_result(result),
                "outcomeMatched": feedback.get("outcomeMatched", "unknown"),
                "timingMatched": feedback.get("timingMatched", "unknown"),
                "qualityTag": feedback.get("qualityTag", "unknown"),
                "ruleVersion": rule_version_from_result(result),
            }
        )
    return {
        "exportType": "anonymized",
        "exportedAt": utc_now(),
        "feedbacks": items,
    }
