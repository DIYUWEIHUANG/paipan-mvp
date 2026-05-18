from __future__ import annotations

import hashlib
from typing import Literal, TypedDict

LinePolarity = Literal["yin", "yang"]


class LineState(TypedDict):
    position: int
    value: int
    polarity: LinePolarity
    moving: bool
    display: str


TRIGRAMS: dict[tuple[int, int, int], str] = {
    (1, 1, 1): "乾",
    (1, 1, 0): "兑",
    (1, 0, 1): "离",
    (1, 0, 0): "震",
    (0, 1, 1): "巽",
    (0, 1, 0): "坎",
    (0, 0, 1): "艮",
    (0, 0, 0): "坤",
}

HEXAGRAMS: dict[tuple[str, str], tuple[int, str]] = {
    ("乾", "乾"): (1, "乾为天"),
    ("乾", "兑"): (10, "天泽履"),
    ("乾", "离"): (13, "天火同人"),
    ("乾", "震"): (25, "天雷无妄"),
    ("乾", "巽"): (44, "天风姤"),
    ("乾", "坎"): (6, "天水讼"),
    ("乾", "艮"): (33, "天山遯"),
    ("乾", "坤"): (12, "天地否"),
    ("兑", "乾"): (43, "泽天夬"),
    ("兑", "兑"): (58, "兑为泽"),
    ("兑", "离"): (49, "泽火革"),
    ("兑", "震"): (17, "泽雷随"),
    ("兑", "巽"): (28, "泽风大过"),
    ("兑", "坎"): (47, "泽水困"),
    ("兑", "艮"): (31, "泽山咸"),
    ("兑", "坤"): (45, "泽地萃"),
    ("离", "乾"): (14, "火天大有"),
    ("离", "兑"): (38, "火泽睽"),
    ("离", "离"): (30, "离为火"),
    ("离", "震"): (21, "火雷噬嗑"),
    ("离", "巽"): (50, "火风鼎"),
    ("离", "坎"): (64, "火水未济"),
    ("离", "艮"): (56, "火山旅"),
    ("离", "坤"): (35, "火地晋"),
    ("震", "乾"): (34, "雷天大壮"),
    ("震", "兑"): (54, "雷泽归妹"),
    ("震", "离"): (55, "雷火丰"),
    ("震", "震"): (51, "震为雷"),
    ("震", "巽"): (32, "雷风恒"),
    ("震", "坎"): (40, "雷水解"),
    ("震", "艮"): (62, "雷山小过"),
    ("震", "坤"): (16, "雷地豫"),
    ("巽", "乾"): (9, "风天小畜"),
    ("巽", "兑"): (61, "风泽中孚"),
    ("巽", "离"): (37, "风火家人"),
    ("巽", "震"): (42, "风雷益"),
    ("巽", "巽"): (57, "巽为风"),
    ("巽", "坎"): (59, "风水涣"),
    ("巽", "艮"): (53, "风山渐"),
    ("巽", "坤"): (20, "风地观"),
    ("坎", "乾"): (5, "水天需"),
    ("坎", "兑"): (60, "水泽节"),
    ("坎", "离"): (63, "水火既济"),
    ("坎", "震"): (3, "水雷屯"),
    ("坎", "巽"): (48, "水风井"),
    ("坎", "坎"): (29, "坎为水"),
    ("坎", "艮"): (39, "水山蹇"),
    ("坎", "坤"): (8, "水地比"),
    ("艮", "乾"): (26, "山天大畜"),
    ("艮", "兑"): (41, "山泽损"),
    ("艮", "离"): (22, "山火贲"),
    ("艮", "震"): (27, "山雷颐"),
    ("艮", "巽"): (18, "山风蛊"),
    ("艮", "坎"): (4, "山水蒙"),
    ("艮", "艮"): (52, "艮为山"),
    ("艮", "坤"): (23, "山地剥"),
    ("坤", "乾"): (11, "地天泰"),
    ("坤", "兑"): (19, "地泽临"),
    ("坤", "离"): (36, "地火明夷"),
    ("坤", "震"): (24, "地雷复"),
    ("坤", "巽"): (46, "地风升"),
    ("坤", "坎"): (7, "地水师"),
    ("坤", "艮"): (15, "地山谦"),
    ("坤", "坤"): (2, "坤为地"),
}


def validate_manual_lines(lines: list[int]) -> list[int]:
    if len(lines) != 6:
        raise ValueError("manual_lines must contain exactly 6 values")
    invalid = [line for line in lines if line not in {6, 7, 8, 9}]
    if invalid:
        raise ValueError("manual_lines values must be one of 6, 7, 8, 9")
    return lines


def line_to_bit(value: int) -> int:
    return 1 if value in {7, 9} else 0


def is_moving(value: int) -> bool:
    return value in {6, 9}


def changed_bit(value: int) -> int:
    bit = line_to_bit(value)
    return 1 - bit if is_moving(value) else bit


def hash_question_text(value: str = "") -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def bit_to_line_state(position: int, bit: int, value: int, moving: bool) -> LineState:
    return {
        "position": position,
        "value": value,
        "polarity": "yang" if bit == 1 else "yin",
        "moving": moving,
        "display": "━━━" if bit == 1 else "━ ━",
    }


def build_hexagram_from_bits(bits: list[int], source_values: list[int] | None = None) -> dict:
    lower_trigram = TRIGRAMS[tuple(bits[:3])]
    upper_trigram = TRIGRAMS[tuple(bits[3:])]
    number, name = HEXAGRAMS[(upper_trigram, lower_trigram)]
    values = source_values or [7 if bit == 1 else 8 for bit in bits]
    return {
        "number": number,
        "name": name,
        "upper_trigram": upper_trigram,
        "lower_trigram": lower_trigram,
        "lines": [
            bit_to_line_state(position=index + 1, bit=bit, value=values[index], moving=is_moving(values[index]))
            for index, bit in enumerate(bits)
        ],
    }


def calculate_manual_liuyao(manual_lines: list[int]) -> dict:
    lines = validate_manual_lines(manual_lines)
    input_fingerprint = {
        "datetime": "",
        "timezone": "",
        "questionTextHash": hash_question_text(""),
        "questionCategory": "general",
        "questionIntent": "trend",
        "mode": "manual",
        "sourceInput": str(lines),
        "algorithmVersion": "liuyao-backend-manual-v1",
    }
    base_bits = [line_to_bit(line) for line in lines]
    changed_bits = [changed_bit(line) for line in lines]
    moving_lines = [index + 1 for index, line in enumerate(lines) if is_moving(line)]
    debug_trace = [
        f"input_fingerprint={input_fingerprint}",
        f"manual_lines(bottom_to_top)={lines}",
        f"base_bits(bottom_to_top)={base_bits}",
        f"changed_bits(bottom_to_top)={changed_bits}",
        f"moving_lines={moving_lines}",
    ]
    return {
        "type": "liu_yao",
        "milestone": 1,
        "input": {
            "method": "manual",
            "manual_lines": lines,
            "line_order": "bottom_to_top",
        },
        "input_fingerprint": input_fingerprint,
        "base_hexagram": build_hexagram_from_bits(base_bits, lines),
        "changed_hexagram": build_hexagram_from_bits(changed_bits),
        "moving_lines": moving_lines,
        "debug_trace": debug_trace,
    }
