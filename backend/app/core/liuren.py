from __future__ import annotations

import hashlib
from datetime import datetime
from zoneinfo import ZoneInfo

from lunar_python import Solar
from engine.daliuren.asker_profile import analyze_asker_profile
from engine.daliuren.question_context import analyze_question_context
from engine.daliuren.wuxing_relations import analyze_wuxing_relations
from engine.timing.time_window import analyze_daliuren_timing

STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
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

STEM_HOME = {
    "甲": "寅",
    "乙": "辰",
    "丙": "巳",
    "丁": "未",
    "戊": "巳",
    "己": "未",
    "庚": "申",
    "辛": "戌",
    "壬": "亥",
    "癸": "丑",
}

STEM_COMBINE = {
    "甲": "己",
    "己": "甲",
    "乙": "庚",
    "庚": "乙",
    "丙": "辛",
    "辛": "丙",
    "丁": "壬",
    "壬": "丁",
    "戊": "癸",
    "癸": "戊",
}

ELEMENT_BY_TOKEN = {
    **dict.fromkeys(["甲", "乙", "寅", "卯"], "木"),
    **dict.fromkeys(["丙", "丁", "巳", "午"], "火"),
    **dict.fromkeys(["戊", "己", "辰", "戌", "丑", "未"], "土"),
    **dict.fromkeys(["庚", "辛", "申", "酉"], "金"),
    **dict.fromkeys(["壬", "癸", "亥", "子"], "水"),
}

CONTROLS = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}
GENERATES = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}

YIN_YANG = {
    **dict.fromkeys(["甲", "丙", "戊", "庚", "壬", "子", "寅", "辰", "午", "申", "戌"], "阳"),
    **dict.fromkeys(["乙", "丁", "己", "辛", "癸", "丑", "卯", "巳", "未", "酉", "亥"], "阴"),
}

CHONG = dict(zip(BRANCHES, BRANCHES[6:] + BRANCHES[:6]))
XING = {
    "子": "卯",
    "卯": "子",
    "寅": "巳",
    "巳": "申",
    "申": "寅",
    "丑": "戌",
    "戌": "未",
    "未": "丑",
    "辰": "辰",
    "午": "午",
    "酉": "酉",
    "亥": "亥",
}
SAN_HE = {
    "申": ["申", "子", "辰"],
    "子": ["申", "子", "辰"],
    "辰": ["申", "子", "辰"],
    "亥": ["亥", "卯", "未"],
    "卯": ["亥", "卯", "未"],
    "未": ["亥", "卯", "未"],
    "寅": ["寅", "午", "戌"],
    "午": ["寅", "午", "戌"],
    "戌": ["寅", "午", "戌"],
    "巳": ["巳", "酉", "丑"],
    "酉": ["巳", "酉", "丑"],
    "丑": ["巳", "酉", "丑"],
}


def parse_question_time(question_time: str, timezone: str) -> datetime:
    tz = ZoneInfo(timezone)
    parsed = datetime.fromisoformat(question_time)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=tz)
    return parsed.astimezone(tz)


def hash_question_text(value: str = "") -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def build_input_fingerprint(
    *,
    datetime_value: str = "",
    timezone: str = "",
    question_text: str = "",
    question_category: str = "general",
    question_intent: str = "trend",
    mode: str,
    source_input: str = "",
    algorithm_version: str,
) -> dict[str, str]:
    return {
        "datetime": datetime_value,
        "timezone": timezone,
        "questionTextHash": hash_question_text(question_text),
        "questionCategory": question_category,
        "questionIntent": question_intent,
        "mode": mode,
        "sourceInput": source_input,
        "algorithmVersion": algorithm_version,
    }


def split_xunkong(value: str) -> list[str]:
    return [char for char in value if char.strip()]


def rotate_branch(start: str, offset: int) -> str:
    return BRANCHES[(BRANCHES.index(start) + offset) % len(BRANCHES)]


def branch_distance(start: str, end: str) -> int:
    return (BRANCHES.index(end) - BRANCHES.index(start)) % len(BRANCHES)


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


def plate_map(plate: list[dict[str, str | int]]) -> dict[str, str]:
    return {str(item["earth"]): str(item["heaven"]) for item in plate}


def earth_under_heaven(plate: list[dict[str, str | int]], heaven: str) -> str:
    for item in plate:
        if item["heaven"] == heaven:
            return str(item["earth"])
    raise ValueError(f"heaven branch not found on plate: {heaven}")


def relation_between(upper: str, lower: str) -> str:
    upper_element = ELEMENT_BY_TOKEN[upper]
    lower_element = ELEMENT_BY_TOKEN[lower]
    if CONTROLS[lower_element] == upper_element:
        return "下贼上"
    if CONTROLS[upper_element] == lower_element:
        return "上克下"
    if upper_element == lower_element:
        return "比和"
    if GENERATES[lower_element] == upper_element:
        return "下生上"
    if GENERATES[upper_element] == lower_element:
        return "上生下"
    raise ValueError(f"unknown relation: {upper}/{lower}")


def build_four_lessons(day_ganzhi: str, plate: list[dict[str, str | int]]) -> list[dict[str, str | int]]:
    sky = plate_map(plate)
    day_stem = day_ganzhi[0]
    day_branch = day_ganzhi[1]
    first_lower = STEM_HOME[day_stem]
    first_upper = sky[first_lower]
    second_lower = first_upper
    second_upper = sky[second_lower]
    third_lower = day_branch
    third_upper = sky[third_lower]
    fourth_lower = third_upper
    fourth_upper = sky[fourth_lower]
    raw_lessons = [
        ("一课", first_upper, first_lower),
        ("二课", second_upper, second_lower),
        ("三课", third_upper, third_lower),
        ("四课", fourth_upper, fourth_lower),
    ]
    lessons = []
    for index, (label, upper, lower) in enumerate(raw_lessons, start=1):
        lessons.append(
            {
                "index": index,
                "label": label,
                "upper": upper,
                "lower": lower,
                "relation": relation_between(upper, lower),
                "upper_element": ELEMENT_BY_TOKEN[upper],
                "lower_element": ELEMENT_BY_TOKEN[lower],
            }
        )
    return lessons


def chain_three_transmissions(first: str, plate: list[dict[str, str | int]]) -> list[str]:
    sky = plate_map(plate)
    second = sky[first]
    third = sky[second]
    return [first, second, third]


def transmission_items(branches: list[str]) -> list[dict[str, str | int]]:
    return [
        {"stage": stage, "branch": branch, "index": index}
        for index, (stage, branch) in enumerate(zip(["初传", "中传", "末传"], branches, strict=True), start=1)
    ]


def unique_by_upper(candidates: list[dict[str, str | int]]) -> list[dict[str, str | int]]:
    seen = set()
    result = []
    for candidate in candidates:
        upper = str(candidate["upper"])
        if upper not in seen:
            seen.add(upper)
            result.append(candidate)
    return result


def shehai_score(candidate: dict[str, str | int], day_branch: str) -> int:
    upper = str(candidate["upper"])
    lower = str(candidate["lower"])
    return branch_distance(lower, upper) + branch_distance(day_branch, upper)


def find_bieze_first(day_stem: str, day_branch: str, plate: list[dict[str, str | int]]) -> str:
    sky = plate_map(plate)
    if YIN_YANG[day_stem] == "阳":
        combined_home = STEM_HOME[STEM_COMBINE[day_stem]]
        return sky[combined_home]
    sanhe = SAN_HE[day_branch]
    return sanhe[(sanhe.index(day_branch) + 1) % 3]


def find_maoxing_first(day_stem: str, plate: list[dict[str, str | int]]) -> str:
    if YIN_YANG[day_stem] == "阳":
        return plate_map(plate)["酉"]
    return earth_under_heaven(plate, "酉")


def decide_three_transmissions(
    day_ganzhi: str,
    hour_ganzhi: str,
    month_general_branch: str,
    plate: list[dict[str, str | int]],
    four_lessons: list[dict[str, str | int]],
) -> dict:
    day_stem = day_ganzhi[0]
    day_branch = day_ganzhi[1]
    day_yinyang = YIN_YANG[day_stem]
    hour_branch = hour_ganzhi[1]
    direct_relations = {"下贼上", "上克下"}
    direct_candidates = [lesson for lesson in four_lessons if str(lesson["relation"]) in direct_relations]
    thief_candidates = [lesson for lesson in four_lessons if lesson["relation"] == "下贼上"]
    upper克_candidates = [lesson for lesson in four_lessons if lesson["relation"] == "上克下"]
    has_fuyin = month_general_branch == hour_branch
    has_fanyin = all(item["heaven"] == CHONG[str(item["earth"])] for item in plate)
    is_bazhuan = STEM_HOME[day_stem] == day_branch
    unique_lesson_pairs = {(item["upper"], item["lower"]) for item in four_lessons}
    is_incomplete_lessons = len(unique_lesson_pairs) < 4
    trace = [
        f"gate_context day={day_ganzhi} hour={hour_ganzhi} day_yinyang={day_yinyang}",
        f"gate_context fuyin={has_fuyin} fanyin={has_fanyin} bazhuan={is_bazhuan} incomplete_lessons={is_incomplete_lessons}",
        f"gate_贼克 direct_candidates={[item['label'] + ':' + str(item['upper']) + '/' + str(item['lower']) + ':' + str(item['relation']) for item in direct_candidates]}",
    ]

    first: str | None = None
    gate = ""
    variant = ""

    primary_direct = thief_candidates if thief_candidates else upper克_candidates
    primary_direct = unique_by_upper(primary_direct)
    if len(primary_direct) == 1:
        first = str(primary_direct[0]["upper"])
        gate = "贼克"
        variant = "重审" if primary_direct[0]["relation"] == "下贼上" else "元首"
        trace.append(f"gate_贼克 selected={first} variant={variant}")
    elif len(primary_direct) > 1:
        same_yinyang = [item for item in primary_direct if YIN_YANG[str(item["upper"])] == day_yinyang]
        trace.append(
            f"gate_比用 candidates={[str(item['upper']) for item in primary_direct]} same_yinyang={[str(item['upper']) for item in same_yinyang]}"
        )
        if len(same_yinyang) == 1:
            first = str(same_yinyang[0]["upper"])
            gate = "比用"
            variant = "知一"
            trace.append(f"gate_比用 selected={first}")
        else:
            scored = sorted(
                [{"lesson": item, "score": shehai_score(item, day_branch)} for item in primary_direct],
                key=lambda item: (-int(item["score"]), int(item["lesson"]["index"])),
            )
            first = str(scored[0]["lesson"]["upper"])
            gate = "涉害"
            variant = "涉害深度V1"
            trace.append(f"gate_涉害 scores={[(item['lesson']['label'], item['lesson']['upper'], item['score']) for item in scored]} selected={first}")
    else:
        trace.append("gate_贼克 skipped=no_direct_ke")
        remote_candidates = []
        for lesson in four_lessons:
            upper = str(lesson["upper"])
            relation_to_day = relation_between(upper, day_stem)
            if relation_to_day in direct_relations:
                remote_candidates.append({**lesson, "remote_relation": relation_to_day})
        trace.append(f"gate_遥克 candidates={[str(item['label']) + ':' + str(item['upper']) + ':' + str(item['remote_relation']) for item in remote_candidates]}")
        remote_same_yinyang = [item for item in remote_candidates if YIN_YANG[str(item["upper"])] == day_yinyang]
        if remote_same_yinyang:
            first = str(remote_same_yinyang[0]["upper"])
            gate = "遥克"
            variant = "蒿矢" if remote_same_yinyang[0]["remote_relation"] == "上克下" else "弹射"
            trace.append(f"gate_遥克 selected={first} variant={variant}")
        elif remote_candidates:
            first = str(remote_candidates[0]["upper"])
            gate = "遥克"
            variant = "蒿矢" if remote_candidates[0]["remote_relation"] == "上克下" else "弹射"
            trace.append(f"gate_遥克 selected={first} variant={variant} reason=no_same_yinyang")
        else:
            trace.append("gate_遥克 skipped=no_remote_ke")
            if has_fanyin:
                first = CHONG[day_branch]
                gate = "返吟"
                variant = "无克取冲"
                trace.append(f"gate_返吟 selected={first}")
            elif has_fuyin:
                first = STEM_HOME[day_stem] if day_yinyang == "阳" else day_branch
                gate = "伏吟"
                variant = "无克取刑"
                trace.append(f"gate_伏吟 selected={first}")
            elif is_bazhuan:
                anchor = str(four_lessons[0]["upper"] if day_yinyang == "阳" else four_lessons[-1]["upper"])
                first = rotate_branch(anchor, 2 if day_yinyang == "阳" else -2)
                gate = "八专"
                variant = "顺逆取用"
                trace.append(f"gate_八专 anchor={anchor} selected={first}")
            elif is_incomplete_lessons:
                first = find_bieze_first(day_stem, day_branch, plate)
                gate = "别责"
                variant = "四课不备"
                trace.append(f"gate_别责 selected={first}")
            else:
                first = find_maoxing_first(day_stem, plate)
                gate = "昴星"
                variant = "俯仰酉神"
                trace.append(f"gate_昴星 selected={first}")

    branches = chain_three_transmissions(first, plate)
    gate_order = ["贼克", "比用", "涉害", "遥克", "昴星", "别责", "八专", "伏吟", "返吟"]
    selected_index = gate_order.index(gate) if gate in gate_order else -1
    for index, gate_name in enumerate(gate_order):
        if index == selected_index:
            trace.append(f"gate_step {gate_name}=selected first={first} variant={variant}")
        elif selected_index >= 0 and index < selected_index:
            trace.append(f"gate_step {gate_name}=checked_no_result")
        else:
            trace.append(f"gate_step {gate_name}=not_reached")
    trace.append(f"three_transmissions chain={branches}")
    return {
        "status": "computed",
        "gate": gate,
        "variant": variant,
        "items": transmission_items(branches),
        "debug_trace": trace,
    }


def liuren_common(question_time: str, timezone: str = "Asia/Shanghai") -> dict:
    dt = parse_question_time(question_time, timezone)
    pillars = get_four_pillars(dt)
    xunkong = get_day_xunkong(dt)
    month_general = get_month_general(dt)
    hour_branch = pillars["hour"][1]
    plate = build_tian_di_pan(month_general["branch"], hour_branch)
    debug_trace = [
        f"localized_datetime={dt.isoformat()}",
        f"question_time_used={question_time} timezone={timezone}",
        f"time_components year={dt.year} month={dt.month} day={dt.day} hour={dt.hour} minute={dt.minute} second={dt.second}",
        f"four_pillars={pillars}",
        f"day_xunkong={xunkong}",
        f"month_general={month_general}",
        f"tian_di_pan_rule=place_month_general_{month_general['branch']}_on_hour_branch_{hour_branch}",
    ]
    return {
        "input": {
            "question_time": question_time,
            "timezone": timezone,
        },
        "localized_datetime": dt.isoformat(),
        "four_pillars": pillars,
        "xunkong": xunkong,
        "month_general": month_general,
        "tian_di_pan": plate,
        "debug_trace": debug_trace,
    }


def calculate_liuren_basic(question_time: str, timezone: str = "Asia/Shanghai") -> dict:
    common = liuren_common(question_time, timezone)
    input_fingerprint = build_input_fingerprint(
        datetime_value=question_time,
        timezone=timezone,
        mode="da_liuren_basic",
        source_input=question_time,
        algorithm_version="daliuren-basic-milestone-13",
    )
    common["debug_trace"] = [*common["debug_trace"], f"input_fingerprint={input_fingerprint}"]
    return {
        "type": "da_liuren",
        "milestone": 2,
        **common,
        "input_fingerprint": input_fingerprint,
        "four_lessons": {
            "status": "reserved",
            "items": [],
        },
        "three_transmissions": {
            "status": "reserved",
            "items": [],
        },
    }


def calculate_liuren_v1(
    question_time: str,
    timezone: str = "Asia/Shanghai",
    question_text: str = "",
    question_category: str = "general",
    question_intent: str = "trend",
    asker_gender: str = "unknown",
    asker_birth_time: str | None = None,
    asker_daymaster: str | None = None,
) -> dict:
    common = liuren_common(question_time, timezone)
    pillars = common["four_pillars"]
    plate = common["tian_di_pan"]
    lessons = build_four_lessons(pillars["day"], plate)
    transmissions = decide_three_transmissions(
        day_ganzhi=pillars["day"],
        hour_ganzhi=pillars["hour"],
        month_general_branch=common["month_general"]["branch"],
        plate=plate,
        four_lessons=lessons,
    )
    wuxing_relations = analyze_wuxing_relations(
        day_ganzhi=pillars["day"],
        three_transmissions=transmissions["items"],
        four_lessons=lessons,
    )
    asker_profile = analyze_asker_profile(
        gender=asker_gender,
        birth_time=asker_birth_time,
        manual_daymaster=asker_daymaster,
        timezone=timezone,
        chart_day_ganzhi=pillars["day"],
        three_transmissions=transmissions["items"],
        four_lessons=lessons,
    )
    question_context = analyze_question_context(
        question_text=question_text,
        question_category=question_category,
        question_intent=question_intent,
        wuxing_relations=wuxing_relations,
        asker_profile=asker_profile,
    )
    input_fingerprint = build_input_fingerprint(
        datetime_value=question_time,
        timezone=timezone,
        question_text=question_text,
        question_category=question_context["questionCategory"],
        question_intent=question_context["questionIntent"],
        mode="da_liuren",
        source_input=question_time,
        algorithm_version="daliuren-v1-milestone-13",
    )
    timing = analyze_daliuren_timing(
        current_datetime=common["localized_datetime"],
        timezone=timezone,
        question_category=question_context["questionCategory"],
        question_intent=question_context["questionIntent"],
        three_transmissions=transmissions["items"],
        xunkong=common["xunkong"],
    )
    debug_trace = [
        *common["debug_trace"],
        f"four_lessons={[(item['label'], item['upper'], item['lower'], item['relation']) for item in lessons]}",
        *transmissions["debug_trace"],
        f"wuxing_relations={wuxing_relations['energy_flow']}:{wuxing_relations['overall_pattern']}",
        f"asker_profile={asker_profile['asker_daymaster']}:{asker_profile['chart_bias']}:{asker_profile['impact']}",
        f"question_context={question_context['questionCategory']}:{question_context['questionIntent']}",
        f"input_fingerprint={input_fingerprint}",
        *timing["debug_trace"],
    ]
    return {
        "type": "da_liuren",
        "milestone": 8,
        **common,
        "question_schema": {
            "questionText": question_text,
            "questionCategory": question_context["questionCategory"],
            "questionIntent": question_context["questionIntent"],
        },
        "four_lessons": {
            "status": "computed",
            "items": lessons,
        },
        "three_transmissions": {key: value for key, value in transmissions.items() if key != "debug_trace"},
        "wuxing_relations": wuxing_relations,
        "asker_profile": asker_profile,
        "question_context": question_context,
        "timing": timing,
        "input_fingerprint": input_fingerprint,
        "debug_trace": debug_trace,
    }
