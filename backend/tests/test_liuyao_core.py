import pytest

from app.core.liuyao import calculate_manual_liuyao, validate_manual_lines


def test_manual_all_yang_is_qian():
    result = calculate_manual_liuyao([7, 7, 7, 7, 7, 7])
    assert result["base_hexagram"]["name"] == "乾为天"
    assert result["changed_hexagram"]["name"] == "乾为天"
    assert result["moving_lines"] == []


def test_old_yin_changes_to_yang():
    result = calculate_manual_liuyao([6, 8, 8, 8, 8, 8])
    assert result["base_hexagram"]["name"] == "坤为地"
    assert result["changed_hexagram"]["name"] == "地雷复"
    assert result["moving_lines"] == [1]


def test_old_yang_changes_to_yin():
    result = calculate_manual_liuyao([9, 7, 7, 7, 7, 7])
    assert result["base_hexagram"]["name"] == "乾为天"
    assert result["changed_hexagram"]["name"] == "天风姤"
    assert result["moving_lines"] == [1]


def test_manual_lines_must_have_six_values():
    with pytest.raises(ValueError):
        validate_manual_lines([7, 8, 7])


def test_manual_lines_must_be_6789():
    with pytest.raises(ValueError):
        validate_manual_lines([7, 8, 7, 8, 7, 5])
