from __future__ import annotations

from typing import Any

QUESTION_CATEGORIES = {
    "general": {
        "label": "综合",
        "class_spirit": "日干/三传",
        "focus_points": ["整体趋势", "关键阻力", "可借之力"],
        "suggested_action": "先抓主要矛盾，再决定推进节奏。",
        "avoid_action": "避免只凭单一信号下结论。",
    },
    "sleep_health": {
        "label": "睡眠健康",
        "class_spirit": "身/病",
        "focus_points": ["身体消耗", "恢复节律", "压力来源"],
        "suggested_action": "优先稳住作息和恢复窗口。",
        "avoid_action": "避免继续透支精力。",
    },
    "research_project": {
        "label": "研究项目",
        "class_spirit": "文书/课题/资源",
        "focus_points": ["证据链", "资源配合", "阶段推进"],
        "suggested_action": "先补齐关键证据，再推进下一步。",
        "avoid_action": "避免在证据不足时扩大范围。",
    },
    "career": {
        "label": "事业职业",
        "class_spirit": "官/职事",
        "focus_points": ["职责压力", "上级规则", "机会窗口"],
        "suggested_action": "按规则推进，保留沟通余地。",
        "avoid_action": "避免硬碰硬或越级冒进。",
    },
    "money_resource": {
        "label": "金钱资源",
        "class_spirit": "财/资源",
        "focus_points": ["投入产出", "资源占用", "现金压力"],
        "suggested_action": "先确认成本边界，再做投入。",
        "avoid_action": "避免超预算承诺。",
    },
    "relationship": {
        "label": "关系",
        "class_spirit": "人际/合冲",
        "focus_points": ["双方位置", "沟通阻力", "关系张力"],
        "suggested_action": "先澄清真实诉求，再谈推进。",
        "avoid_action": "避免情绪化回应。",
    },
    "travel": {
        "label": "出行",
        "class_spirit": "行人/道路",
        "focus_points": ["路线安排", "时间窗口", "临时变动"],
        "suggested_action": "提前留出缓冲时间。",
        "avoid_action": "避免赶点和临时改计划。",
    },
    "lost_item": {
        "label": "失物",
        "class_spirit": "物/所在",
        "focus_points": ["物品位置", "移动痕迹", "可回收性"],
        "suggested_action": "按最后接触点向外复查。",
        "avoid_action": "避免盲目扩大搜索范围。",
    },
    "decision": {
        "label": "决策",
        "class_spirit": "用神/取舍",
        "focus_points": ["利弊权重", "执行成本", "退出余地"],
        "suggested_action": "把选择拆成可逆与不可逆部分。",
        "avoid_action": "避免一次性押注。",
    },
    "exam_learning": {
        "label": "考试学习",
        "class_spirit": "文书/学业",
        "focus_points": ["吸收效率", "复习重点", "临场稳定"],
        "suggested_action": "集中处理高频薄弱点。",
        "avoid_action": "避免平均用力。",
    },
    "communication": {
        "label": "沟通",
        "class_spirit": "口舌/信息",
        "focus_points": ["信息清晰度", "对方反应", "误解风险"],
        "suggested_action": "先写清楚边界和请求。",
        "avoid_action": "避免含糊表达。",
    },
}

QUESTION_INTENTS = {
    "trend": "看趋势",
    "timing_advice": "择时建议",
    "risk_check": "风险检查",
    "go_or_no_go": "是否推进",
    "strategy": "策略选择",
    "diagnosis": "原因诊断",
}


def analyze_question_context(
    *,
    question_text: str = "",
    question_category: str = "general",
    question_intent: str = "trend",
    wuxing_relations: dict[str, Any],
    asker_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    category_key = question_category if question_category in QUESTION_CATEGORIES else "general"
    intent_key = question_intent if question_intent in QUESTION_INTENTS else "trend"
    category = QUESTION_CATEGORIES[category_key]

    favorable_signals = _favorable_signals(wuxing_relations, asker_profile)
    risk_signals = _risk_signals(wuxing_relations, asker_profile)

    return {
        "questionText": question_text,
        "questionCategory": category_key,
        "questionIntent": intent_key,
        "category_label": category["label"],
        "intent_label": QUESTION_INTENTS[intent_key],
        "class_spirit": category["class_spirit"],
        "focus_points": _focus_points(category["focus_points"], intent_key),
        "favorable_signals": favorable_signals,
        "risk_signals": risk_signals,
        "suggested_action": _suggested_action(category["suggested_action"], intent_key, favorable_signals, risk_signals),
        "avoid_action": _avoid_action(category["avoid_action"], intent_key, risk_signals),
    }


def _focus_points(base_points: list[str], intent: str) -> list[str]:
    intent_focus = {
        "trend": "后续走势",
        "timing_advice": "时间窗口",
        "risk_check": "风险触发点",
        "go_or_no_go": "推进条件",
        "strategy": "行动路径",
        "diagnosis": "成因结构",
    }
    return [*base_points, intent_focus[intent]]


def _favorable_signals(wuxing_relations: dict[str, Any], asker_profile: dict[str, Any] | None) -> list[str]:
    signals: list[str] = []
    if wuxing_relations.get("overall_pattern") == "连续相生":
        signals.append("三传连续相生，结构上有顺承")
    if wuxing_relations.get("initial_relation_to_daymaster") in {"生", "比和"}:
        signals.append("初传对日干有扶助或同气")
    if asker_profile and asker_profile.get("impact") in {"同气助身", "印旺生身"}:
        signals.append(f"对提问者为{asker_profile['impact']}")
    if not signals:
        signals.append("暂无明显扶助信号")
    return signals


def _risk_signals(wuxing_relations: dict[str, Any], asker_profile: dict[str, Any] | None) -> list[str]:
    signals: list[str] = []
    if wuxing_relations.get("overall_pattern") == "生克混杂":
        signals.append("三传生克混杂，节奏容易反复")
    if wuxing_relations.get("initial_relation_to_daymaster") in {"克", "耗"}:
        signals.append("初传对日干有克耗")
    if asker_profile and asker_profile.get("impact") in {"财旺耗身", "官杀压身", "食伤泄身"}:
        signals.append(f"对提问者为{asker_profile['impact']}")
    if not signals:
        signals.append("暂无明显风险信号")
    return signals


def _suggested_action(base_action: str, intent: str, favorable: list[str], risk: list[str]) -> str:
    if intent == "go_or_no_go":
        return "有扶助信号时小步推进；风险信号多时先暂停复核。"
    if intent == "timing_advice":
        return "选择阻力较少、资源更稳的时间段行动。"
    if intent == "risk_check" and risk != ["暂无明显风险信号"]:
        return "先处理风险点，再进入执行。"
    if intent == "strategy":
        return "采用分阶段策略，先做低成本验证。"
    if intent == "diagnosis":
        return "优先定位阻力来源，再判断是否调整路径。"
    if favorable != ["暂无明显扶助信号"]:
        return base_action
    return "先收集更多信息，再小范围试探。"


def _avoid_action(base_action: str, intent: str, risk: list[str]) -> str:
    if intent == "go_or_no_go":
        return "避免在条件未明时直接重押。"
    if intent == "risk_check":
        return "避免忽视已出现的克耗与反复信号。"
    if risk != ["暂无明显风险信号"]:
        return base_action
    return "避免过度解读单一吉凶信号。"
