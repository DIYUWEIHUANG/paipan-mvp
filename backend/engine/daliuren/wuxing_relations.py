from __future__ import annotations

from itertools import combinations
from typing import Any

BRANCH_ELEMENT = {
    **dict.fromkeys(["子", "亥"], "水"),
    **dict.fromkeys(["寅", "卯"], "木"),
    **dict.fromkeys(["巳", "午"], "火"),
    **dict.fromkeys(["申", "酉"], "金"),
    **dict.fromkeys(["辰", "戌", "丑", "未"], "土"),
}

STEM_ELEMENT = {
    **dict.fromkeys(["甲", "乙"], "木"),
    **dict.fromkeys(["丙", "丁"], "火"),
    **dict.fromkeys(["戊", "己"], "土"),
    **dict.fromkeys(["庚", "辛"], "金"),
    **dict.fromkeys(["壬", "癸"], "水"),
}

GENERATES = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
CONTROLS = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}


def element_of_branch(branch: str) -> str:
    return BRANCH_ELEMENT[branch]


def element_of_stem(stem: str) -> str:
    return STEM_ELEMENT[stem]


def relation_to(subject_element: str, object_element: str) -> str:
    if subject_element == object_element:
        return "比和"
    if GENERATES[subject_element] == object_element:
        return "泄"
    if GENERATES[object_element] == subject_element:
        return "生"
    if CONTROLS[subject_element] == object_element:
        return "克"
    if CONTROLS[object_element] == subject_element:
        return "耗"
    raise ValueError(f"unknown wuxing relation: {subject_element}/{object_element}")


def relation_between_tokens(subject: str, object_: str) -> str:
    return relation_to(_element_of_token(subject), _element_of_token(object_))


def analyze_wuxing_relations(
    day_ganzhi: str,
    three_transmissions: list[dict[str, Any]],
    four_lessons: list[dict[str, Any]],
) -> dict[str, Any]:
    day_stem = day_ganzhi[0]
    daymaster_element = element_of_stem(day_stem)
    transmissions = [
        {
            "stage": str(item["stage"]),
            "branch": str(item["branch"]),
            "element": element_of_branch(str(item["branch"])),
        }
        for item in three_transmissions
    ]
    if len(transmissions) != 3:
        raise ValueError("three_transmissions must contain initial, middle and final")

    initial, middle, final = transmissions
    energy_flow_elements = [item["element"] for item in transmissions]

    return {
        "daymaster": day_stem,
        "daymaster_element": daymaster_element,
        "initial_relation_to_daymaster": relation_to(initial["element"], daymaster_element),
        "middle_relation_to_initial": relation_to(middle["element"], initial["element"]),
        "final_relation_to_middle": relation_to(final["element"], middle["element"]),
        "energy_flow": " -> ".join(energy_flow_elements),
        "overall_pattern": _overall_pattern(energy_flow_elements),
        "daymaster_to_transmissions": [
            {
                "target_stage": item["stage"],
                "target_branch": item["branch"],
                "target_element": item["element"],
                "relation": relation_to(daymaster_element, item["element"]),
            }
            for item in transmissions
        ],
        "transmissions_to_daymaster": [
            {
                "stage": item["stage"],
                "branch": item["branch"],
                "element": item["element"],
                "relation": relation_to(item["element"], daymaster_element),
            }
            for item in transmissions
        ],
        "transmission_relations": [
            _pair_relation("初传", initial["branch"], "中传", middle["branch"]),
            _pair_relation("中传", middle["branch"], "末传", final["branch"]),
        ],
        "four_lesson_internal_relations": [
            {
                "lesson": str(item["label"]),
                "upper": str(item["upper"]),
                "upper_element": _element_of_token(str(item["upper"])),
                "lower": str(item["lower"]),
                "lower_element": _element_of_token(str(item["lower"])),
                "relation": relation_between_tokens(str(item["upper"]), str(item["lower"])),
            }
            for item in four_lessons
        ],
        "four_lesson_upper_relations": [
            _pair_relation(str(left["label"]), str(left["upper"]), str(right["label"]), str(right["upper"]))
            for left, right in combinations(four_lessons, 2)
        ],
    }


def _element_of_token(token: str) -> str:
    if token in BRANCH_ELEMENT:
        return BRANCH_ELEMENT[token]
    if token in STEM_ELEMENT:
        return STEM_ELEMENT[token]
    raise ValueError(f"unknown wuxing token: {token}")


def _pair_relation(from_label: str, from_token: str, to_label: str, to_token: str) -> dict[str, str]:
    from_element = _element_of_token(from_token)
    to_element = _element_of_token(to_token)
    return {
        "from_label": from_label,
        "from": from_token,
        "from_element": from_element,
        "to_label": to_label,
        "to": to_token,
        "to_element": to_element,
        "relation": relation_to(from_element, to_element),
    }


def _overall_pattern(elements: list[str]) -> str:
    if elements[0] == elements[1] == elements[2]:
        return "三传比和"
    if GENERATES[elements[0]] == elements[1] and GENERATES[elements[1]] == elements[2]:
        return "连续相生"
    if CONTROLS[elements[0]] == elements[1] and CONTROLS[elements[1]] == elements[2]:
        return "连续相克"
    if elements[0] == elements[2] and elements[0] != elements[1]:
        return "首末同气"
    return "生克混杂"
