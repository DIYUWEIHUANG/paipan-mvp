from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from lunar_python import Solar

STEM_ELEMENT = {
    **dict.fromkeys(["甲", "乙"], "木"),
    **dict.fromkeys(["丙", "丁"], "火"),
    **dict.fromkeys(["戊", "己"], "土"),
    **dict.fromkeys(["庚", "辛"], "金"),
    **dict.fromkeys(["壬", "癸"], "水"),
}

BRANCH_ELEMENT = {
    **dict.fromkeys(["子", "亥"], "水"),
    **dict.fromkeys(["寅", "卯"], "木"),
    **dict.fromkeys(["巳", "午"], "火"),
    **dict.fromkeys(["申", "酉"], "金"),
    **dict.fromkeys(["辰", "戌", "丑", "未"], "土"),
}

GENERATES = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
CONTROLS = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}


def analyze_asker_profile(
    *,
    gender: str = "unknown",
    birth_time: str | None = None,
    manual_daymaster: str | None = None,
    timezone: str = "Asia/Shanghai",
    chart_day_ganzhi: str,
    three_transmissions: list[dict[str, Any]],
    four_lessons: list[dict[str, Any]],
) -> dict[str, Any]:
    daymaster, source = _resolve_daymaster(
        manual_daymaster=manual_daymaster,
        birth_time=birth_time,
        timezone=timezone,
        chart_day_ganzhi=chart_day_ganzhi,
    )
    asker_element = STEM_ELEMENT[daymaster]
    chart_element = _dominant_chart_element(three_transmissions, four_lessons)
    impact = _impact(chart_element, asker_element)

    return {
        "gender": gender,
        "daymaster_source": source,
        "asker_daymaster": f"{daymaster}{asker_element}",
        "asker_element": asker_element,
        "asker_bias": f"{asker_element}性为主",
        "chart_bias": f"{chart_element}旺",
        "impact": impact,
        "advice": _advice_for_impact(impact),
    }


def _resolve_daymaster(
    *,
    manual_daymaster: str | None,
    birth_time: str | None,
    timezone: str,
    chart_day_ganzhi: str,
) -> tuple[str, str]:
    normalized = _normalize_daymaster(manual_daymaster)
    if normalized:
        return normalized, "manual"

    if birth_time:
        dt = _parse_time(birth_time, timezone)
        solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
        return solar.getLunar().getEightChar().getDay()[0], "birth_time"

    return chart_day_ganzhi[0], "chart_day_fallback"


def _normalize_daymaster(value: str | None) -> str | None:
    if not value:
        return None
    for char in value.strip():
        if char in STEM_ELEMENT:
            return char
    return None


def _parse_time(value: str, timezone: str) -> datetime:
    tz = ZoneInfo(timezone)
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=tz)
    return parsed.astimezone(tz)


def _dominant_chart_element(three_transmissions: list[dict[str, Any]], four_lessons: list[dict[str, Any]]) -> str:
    scores = {element: 0 for element in ["木", "火", "土", "金", "水"]}
    for item in three_transmissions:
        scores[BRANCH_ELEMENT[str(item["branch"])]] += 2
    for item in four_lessons:
        scores[_element_of_token(str(item["upper"]))] += 1
        scores[_element_of_token(str(item["lower"]))] += 1
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))[0][0]


def _element_of_token(token: str) -> str:
    if token in STEM_ELEMENT:
        return STEM_ELEMENT[token]
    return BRANCH_ELEMENT[token]


def _impact(chart_element: str, asker_element: str) -> str:
    if chart_element == asker_element:
        return "同气助身"
    if GENERATES[chart_element] == asker_element:
        return "印旺生身"
    if GENERATES[asker_element] == chart_element:
        return "食伤泄身"
    if CONTROLS[asker_element] == chart_element:
        return "财旺耗身"
    if CONTROLS[chart_element] == asker_element:
        return "官杀压身"
    return "影响混杂"


def _advice_for_impact(impact: str) -> str:
    return {
        "同气助身": "适合借力合作，也要避免分散。",
        "印旺生身": "适合补足资源，先稳住节奏。",
        "食伤泄身": "适合表达输出，注意保留余力。",
        "财旺耗身": "适合推进结果，不宜过度透支。",
        "官杀压身": "适合守规则推进，避免硬碰压力。",
    }.get(impact, "先观察关键节点，避免仓促加码。")
