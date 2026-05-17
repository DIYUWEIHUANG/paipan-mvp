from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

BRANCH_HOUR_WINDOWS = {
    "子": "子时前后（23:00-01:00）",
    "丑": "丑时前后（01:00-03:00）",
    "寅": "寅时前后（03:00-05:00）",
    "卯": "卯时前后（05:00-07:00）",
    "辰": "辰时前后（07:00-09:00）",
    "巳": "巳时前后（09:00-11:00）",
    "午": "午时前后（11:00-13:00）",
    "未": "未时前后（13:00-15:00）",
    "申": "申时前后（15:00-17:00）",
    "酉": "酉时前后（17:00-19:00）",
    "戌": "戌时前后（19:00-21:00）",
    "亥": "亥时前后（21:00-23:00）",
}

FAST_CATEGORIES = {"sleep_health", "communication", "lost_item", "travel"}
SLOW_CATEGORIES = {"research_project", "career", "money_resource", "relationship"}
TRIGGER_INTENTS = {"timing_advice", "go_or_no_go", "risk_check"}


def analyze_daliuren_timing(
    *,
    current_datetime: str,
    timezone: str,
    question_category: str,
    question_intent: str,
    three_transmissions: list[dict[str, Any]],
    xunkong: list[str],
) -> dict[str, Any]:
    dt = _parse_datetime(current_datetime, timezone)
    debug_trace = [
        f"timing_engine=da_liuren current={dt.isoformat()}",
        f"question_category={question_category} question_intent={question_intent}",
    ]
    labels = ["近应", "中应", "后应"]
    windows = []
    for index, item in enumerate(three_transmissions[:3]):
        branch = str(item["branch"])
        label = labels[index]
        basis = [f"{str(item['stage'])}{branch}", f"问题类型为 {question_category}", f"提问意图为 {question_intent}"]
        confidence = "medium"
        suggestion = _daliuren_suggestion(index, question_category, question_intent)
        window = _daliuren_window(index, branch, question_category, question_intent)

        if branch in xunkong:
            basis.append(f"{branch}旬空")
            confidence = "low"
            suggestion = "此候选窗口有延迟或落空倾向，适合复核条件后再行动"
        elif question_intent in TRIGGER_INTENTS and index == 0:
            basis.append("时效性强，优先看初传")
            confidence = "medium"

        windows.append(
            {
                "label": label,
                "window": window,
                "basis": basis,
                "confidence": confidence,
                "suggestion": suggestion,
            }
        )
        debug_trace.append(f"{label}: branch={branch} window={window} confidence={confidence}")

    if question_intent == "timing_advice":
        windows = sorted(windows, key=lambda item: 0 if item["label"] == "近应" else 1)
        debug_trace.append("timing_advice=prioritize_near_window")

    return {"timing_windows": windows, "debug_trace": debug_trace}


def _parse_datetime(value: str, timezone: str) -> datetime:
    tz = ZoneInfo(timezone)
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=tz)
    return parsed.astimezone(tz)


def _daliuren_window(index: int, branch: str, category: str, intent: str) -> str:
    hour_window = BRANCH_HOUR_WINDOWS.get(branch, f"{branch}时前后")
    if index == 0 and category in FAST_CATEGORIES:
        return f"近候选：当下至次日，重点看{hour_window}"
    if index == 0:
        return f"近候选：1-3日内，或逢{branch}日/{hour_window}"
    if index == 1:
        return f"中段候选：3-7日内，或逢{branch}日/{branch}月"
    if category in SLOW_CATEGORIES:
        return f"后续候选：1-3周或阶段后段，留意{branch}日/{branch}月"
    return f"后续候选：7-14日内，或逢{branch}日/{branch}月"


def _daliuren_suggestion(index: int, category: str, intent: str) -> str:
    if index == 0 and intent in TRIGGER_INTENTS:
        return "适合先处理眼前触发点，不宜拖延"
    if index == 0 and category == "sleep_health":
        return "适合立即收束，优先恢复节律"
    if index == 1:
        return "适合在中段复核条件，再决定是否加速"
    return "适合作为后续观察窗口，不宜当作绝对日期"
