from app.core.liuren import build_four_lessons, build_tian_di_pan, calculate_liuren_basic, calculate_liuren_v1, get_four_pillars, parse_question_time


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


def test_liuren_v1_computes_four_lessons_and_three_transmissions():
    result = calculate_liuren_v1("2026-05-17T10:30:00", "Asia/Shanghai")
    assert result["milestone"] == 3
    assert result["four_lessons"]["status"] == "computed"
    assert len(result["four_lessons"]["items"]) == 4
    assert result["three_transmissions"]["status"] == "computed"
    assert result["three_transmissions"]["gate"] == "涉害"
    assert len(result["three_transmissions"]["items"]) == 3
    assert any("gate_涉害" in step for step in result["debug_trace"])


def test_liuren_v1_can_reach_all_nine_gates():
    cases = {
        "贼克": "2026-01-01T00:00:00",
        "比用": "2026-01-01T04:00:00",
        "涉害": "2026-01-02T12:00:00",
        "遥克": "2026-01-01T02:00:00",
        "昴星": "2026-01-03T08:00:00",
        "别责": "2026-01-23T04:00:00",
        "八专": "2026-02-02T02:00:00",
        "伏吟": "2026-01-03T02:00:00",
        "返吟": "2026-01-03T14:00:00",
    }
    for expected_gate, question_time in cases.items():
        result = calculate_liuren_v1(question_time, "Asia/Shanghai")
        assert result["three_transmissions"]["gate"] == expected_gate


def test_build_four_lessons_shape():
    result = calculate_liuren_basic("2026-05-17T10:30:00", "Asia/Shanghai")
    lessons = build_four_lessons(result["four_pillars"]["day"], result["tian_di_pan"])
    assert [lesson["label"] for lesson in lessons] == ["一课", "二课", "三课", "四课"]
    assert all(set(lesson) >= {"upper", "lower", "relation", "upper_element", "lower_element"} for lesson in lessons)
