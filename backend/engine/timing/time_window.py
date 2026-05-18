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

TRIGGER_INTENTS = {"timing_advice", "go_or_no_go", "risk_check"}

TIMING_PROFILES = {
    "sleep_health": {
        "scale": "immediate",
        "options": ["immediate", "short_term"],
        "basis": "睡眠健康问题时效性强，优先按小时/日观察",
        "windows": ["数小时至当日", "1-3日", "3-7日"],
    },
    "daily_decision": {
        "scale": "immediate",
        "options": ["immediate", "short_term"],
        "basis": "日常决策偏即时反馈，先看近端触发",
        "windows": ["当下至次日", "1-3日", "3-7日"],
    },
    "decision": {
        "scale": "immediate",
        "options": ["immediate", "short_term"],
        "basis": "决策类问题先看近端条件，再看短期反馈",
        "windows": ["当下至次日", "1-3日", "3-7日"],
    },
    "communication": {
        "scale": "short_term",
        "options": ["short_term"],
        "basis": "沟通问题通常按日/周反馈",
        "windows": ["1-3日", "3-7日", "1-3周"],
    },
    "lost_item": {
        "scale": "short_term",
        "options": ["immediate", "short_term"],
        "basis": "失物问题偏短应，优先按小时/日复查",
        "windows": ["当下至次日", "1-3日", "3-7日"],
    },
    "travel": {
        "scale": "short_term",
        "options": ["short_term"],
        "basis": "出行问题按行程前后与短期变动观察",
        "windows": ["1-3日", "3-7日", "1-3周"],
    },
    "money_resource": {
        "scale": "short_term",
        "options": ["short_term", "medium_term"],
        "basis": "资源与财务问题兼看短期现金流和中期兑现",
        "windows": ["3-14日", "2-6周", "1-3个月"],
    },
    "research_project": {
        "scale": "medium_term",
        "options": ["medium_term"],
        "basis": "研究项目以阶段推进为主，默认按周/月观察",
        "windows": ["1-4周", "1-3个月", "3-6个月"],
    },
    "career": {
        "scale": "medium_term",
        "options": ["medium_term", "long_term"],
        "basis": "事业职业类问题不取今晚/明天，按周/月/年度阶段观察",
        "windows": ["1-4周", "1-3个月", "3-12个月"],
    },
    "relationship": {
        "scale": "medium_term",
        "options": ["medium_term", "long_term"],
        "basis": "关系问题通常需要互动周期沉淀，按周/月观察",
        "windows": ["1-4周", "1-3个月", "3-12个月"],
    },
    "exam_learning": {
        "scale": "medium_term",
        "options": ["short_term", "medium_term"],
        "basis": "学习考试兼看近期复习与阶段结果",
        "windows": ["3-14日", "2-6周", "1-3个月"],
    },
    "life_path": {
        "scale": "long_term",
        "options": ["long_term", "life_stage"],
        "basis": "人生方向问题取长期/阶段尺度，不按短日断应",
        "windows": ["1-3个月", "3-12个月", "1-3年或阶段节点"],
    },
    "general": {
        "scale": "short_term",
        "options": ["short_term"],
        "basis": "综合问题默认按短期到中段观察",
        "windows": ["1-7日", "1-4周", "1-3个月"],
    },
}


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
    profile = _timing_profile(question_category)
    debug_trace = [
        f"timing_engine=da_liuren current={dt.isoformat()}",
        f"question_category={question_category} question_intent={question_intent}",
        f"timing_scale={profile['scale']} options={'/'.join(profile['options'])} basis={profile['basis']}",
    ]
    labels = ["近应", "中应", "后应"]
    windows = []
    for index, item in enumerate(three_transmissions[:3]):
        branch = str(item["branch"])
        label = labels[index]
        basis = [
            f"{str(item['stage'])}{branch}",
            f"问题类型为 {question_category}",
            f"提问意图为 {question_intent}",
            f"应期尺度为 {profile['scale']}",
            str(profile["basis"]),
        ]
        confidence = "medium"
        suggestion = _daliuren_suggestion(index, question_category, question_intent)
        window = _daliuren_window(index, branch, profile)

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

    return {"timing_scale": profile["scale"], "timing_windows": windows, "debug_trace": debug_trace}


def _timing_profile(category: str) -> dict[str, Any]:
    return TIMING_PROFILES.get(category, TIMING_PROFILES["general"])


def _parse_datetime(value: str, timezone: str) -> datetime:
    tz = ZoneInfo(timezone)
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=tz)
    return parsed.astimezone(tz)


def _daliuren_window(index: int, branch: str, profile: dict[str, Any]) -> str:
    hour_window = BRANCH_HOUR_WINDOWS.get(branch, f"{branch}时前后")
    if index == 0:
        if profile["scale"] == "immediate":
            return f"近候选：{profile['windows'][0]}，重点看{hour_window}"
        return f"近候选：{profile['windows'][0]}，或逢{branch}日/{hour_window}"
    if index == 1:
        return f"中段候选：{profile['windows'][1]}，或逢{branch}日/{branch}月"
    return f"后续候选：{profile['windows'][2]}，留意{branch}日/{branch}月"


def _daliuren_suggestion(index: int, category: str, intent: str) -> str:
    if category == "career":
        if index == 0:
            return "适合在近几周内确认职责、资源与沟通窗口"
        if index == 1:
            return "适合在1-3个月内复核阶段反馈，再决定加码"
        return "适合作为季度到年度的观察窗口，不宜当作绝对日期"
    if index == 0 and intent in TRIGGER_INTENTS:
        return "适合先处理眼前触发点，不宜拖延"
    if index == 0 and category == "sleep_health":
        return "适合立即收束，优先恢复节律"
    if index == 1:
        return "适合在中段复核条件，再决定是否加速"
    return "适合作为后续观察窗口，不宜当作绝对日期"
