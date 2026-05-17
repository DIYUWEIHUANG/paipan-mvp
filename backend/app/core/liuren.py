from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from lunar_python import Solar

BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

MONTH_GENERAL_BY_QI = {
    "雨水": "亥",
    "春分": "戌",
    "谷雨": "酉",
    "小满": "申",
    "夏至": "未",
    "大暑": "午",
    "处暑": "巳",
    "秋分": "辰",
    "霜降": "卯",
    "小雪": "寅",
    "冬至": "丑",
    "大寒": "子",
}


def parse_question_time(question_time: str, timezone: str) -> datetime:
    tz = ZoneInfo(timezone)
    parsed = datetime.fromisoformat(question_time)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=tz)
    return parsed.astimezone(tz)


def split_xunkong(value: str) -> list[str]:
    return [char for char in value if char.strip()]


def get_four_pillars(dt: datetime) -> dict[str, str]:
    solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
    eight_char = solar.getLunar().getEightChar()
    return {
        "year": eight_char.getYear(),
        "month": eight_char.getMonth(),
        "day": eight_char.getDay(),
        "hour": eight_char.getTime(),
    }


def get_day_xunkong(dt: datetime) -> list[str]:
    solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
    return split_xunkong(solar.getLunar().getEightChar().getDayXunKong())


def get_month_general(dt: datetime) -> dict[str, str]:
    solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
    prev_qi = solar.getLunar().getPrevQi()
    qi_name = prev_qi.getName()
    return {
        "branch": MONTH_GENERAL_BY_QI[qi_name],
        "source_qi": qi_name,
        "source_qi_time": prev_qi.getSolar().toYmdHms(),
    }


def build_tian_di_pan(month_general_branch: str, hour_branch: str) -> list[dict[str, str | int]]:
    month_general_index = BRANCHES.index(month_general_branch)
    hour_branch_index = BRANCHES.index(hour_branch)
    plate = []
    for earth_index, earth_branch in enumerate(BRANCHES):
        offset = earth_index - hour_branch_index
        heaven_branch = BRANCHES[(month_general_index + offset) % 12]
        plate.append(
            {
                "index": earth_index + 1,
                "earth": earth_branch,
                "heaven": heaven_branch,
            }
        )
    return plate


def calculate_liuren_basic(question_time: str, timezone: str = "Asia/Shanghai") -> dict:
    dt = parse_question_time(question_time, timezone)
    pillars = get_four_pillars(dt)
    xunkong = get_day_xunkong(dt)
    month_general = get_month_general(dt)
    hour_branch = pillars["hour"][1]
    plate = build_tian_di_pan(month_general["branch"], hour_branch)
    debug_trace = [
        f"localized_datetime={dt.isoformat()}",
        f"four_pillars={pillars}",
        f"day_xunkong={xunkong}",
        f"month_general={month_general}",
        f"tian_di_pan_rule=place_month_general_{month_general['branch']}_on_hour_branch_{hour_branch}",
    ]
    return {
        "type": "da_liuren",
        "milestone": 2,
        "input": {
            "question_time": question_time,
            "timezone": timezone,
        },
        "localized_datetime": dt.isoformat(),
        "four_pillars": pillars,
        "xunkong": xunkong,
        "month_general": month_general,
        "tian_di_pan": plate,
        "four_lessons": {
            "status": "reserved",
            "items": [],
        },
        "three_transmissions": {
            "status": "reserved",
            "items": [],
        },
        "debug_trace": debug_trace,
    }
