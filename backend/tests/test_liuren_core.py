from app.core.liuren import build_tian_di_pan, calculate_liuren_basic, get_four_pillars, parse_question_time


def test_four_pillars_use_lunar_python_eight_char():
    dt = parse_question_time("1983-02-15T20:00:00", "Asia/Shanghai")
    assert get_four_pillars(dt) == {
        "year": "癸亥",
        "month": "甲寅",
        "day": "甲戌",
        "hour": "甲戌",
    }


def test_tian_di_pan_places_month_general_on_hour_branch():
    plate = build_tian_di_pan("酉", "巳")
    assert len(plate) == 12
    assert next(item for item in plate if item["earth"] == "巳")["heaven"] == "酉"
    assert next(item for item in plate if item["earth"] == "午")["heaven"] == "戌"


def test_liuren_basic_result_shape():
    result = calculate_liuren_basic("2026-05-17T10:30:00", "Asia/Shanghai")
    assert result["type"] == "da_liuren"
    assert result["milestone"] == 2
    assert set(result["four_pillars"]) == {"year", "month", "day", "hour"}
    assert result["month_general"]["branch"] == "酉"
    assert result["month_general"]["source_qi"] == "谷雨"
    assert len(result["xunkong"]) == 2
    assert len(result["tian_di_pan"]) == 12
    assert result["four_lessons"]["status"] == "reserved"
    assert result["three_transmissions"]["status"] == "reserved"
    assert result["debug_trace"]
