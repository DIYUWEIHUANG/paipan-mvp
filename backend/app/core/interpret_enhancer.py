from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.settings import stepfun_auth_token, stepfun_base_url

CONFIDENCE_VALUES = {"low", "medium", "high"}
ABSOLUTE_LANGUAGE = ("必然", "一定", "注定")


class InterpretEnhancerError(RuntimeError):
    pass


def extract_text_content(response_json: dict[str, Any]) -> str:
    if response_json.get("stop_reason") == "max_tokens":
        raise InterpretEnhancerError("LLM 解读被 max_tokens 截断，请提高 max_tokens 后重试。")

    content = response_json.get("content")
    texts: list[str] = []
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    texts.append(text)
    elif isinstance(content, str):
        texts.append(content)

    text = "\n".join(texts).strip()
    if not text:
        raise InterpretEnhancerError("LLM 未返回可解析的 text JSON。")
    return text


def extract_json_text(text: str) -> str:
    block = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if block:
        return block.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return text[start : end + 1].strip()
    return text.strip()


def safe_string(value: Any) -> str:
    text = str(value or "").strip()
    return sanitize_absolute_language(text)


def sanitize_absolute_language(text: str) -> str:
    replacements = {
        "必然": "倾向于",
        "一定": "较适合",
        "注定": "提示为",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [safe_string(item) for item in value if safe_string(item)]


def normalize_llm_interpretation(value: dict[str, Any]) -> dict[str, Any]:
    confidence = str(value.get("confidence") or "medium").strip()
    if confidence not in CONFIDENCE_VALUES:
        confidence = "medium"
    return {
        "summary": safe_string(value.get("summary")),
        "keySignals": string_list(value.get("keySignals")),
        "riskSignals": string_list(value.get("riskSignals")),
        "timingAdvice": safe_string(value.get("timingAdvice")),
        "actionAdvice": safe_string(value.get("actionAdvice")),
        "avoidAction": safe_string(value.get("avoidAction")),
        "confidence": confidence,
    }


def parse_llm_interpretation_text(text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(extract_json_text(text))
    except json.JSONDecodeError as exc:
        raise InterpretEnhancerError("LLM 解读 JSON 解析失败，请重试。") from exc
    if not isinstance(parsed, dict):
        raise InterpretEnhancerError("LLM 解读必须返回 JSON 对象。")
    normalized = normalize_llm_interpretation(parsed)
    if not normalized["summary"]:
        raise InterpretEnhancerError("LLM 解读结果缺少 summary。")
    return normalized


def parse_stepfun_interpretation_response(response_json: dict[str, Any]) -> dict[str, Any]:
    return parse_llm_interpretation_text(extract_text_content(response_json))


def build_interpret_prompt(payload: dict[str, Any]) -> str:
    compact_payload = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return f"""
你是排盘系统的解读优化层。排盘和规则判断已经由本地规则引擎完成，你不能修改 rawResult，也不能新增排盘结论。

请只把结构化结果整理成自然、克制、可执行的建议。最终答案必须只输出 JSON 对象，不要输出 markdown、解释文字或代码块。

禁止使用绝对化语言：必然、一定、注定。
统一使用：倾向、提示、适合、不宜、候选窗口、可以优先、建议先。

输入结构：
{compact_payload}

只输出以下 JSON schema：
{{
  "summary": "一句总述",
  "keySignals": ["关键信号"],
  "riskSignals": ["风险信号"],
  "timingAdvice": "应期/节奏建议，必须使用候选窗口或倾向表达",
  "actionAdvice": "适合采取的行动",
  "avoidAction": "不宜采取的行动",
  "confidence": "low|medium|high"
}}
""".strip()


def enhance_interpretation(payload: dict[str, Any], *, max_tokens: int = 1_000_000) -> dict[str, Any]:
    base_url = stepfun_base_url().rstrip("/")
    token = stepfun_auth_token()
    if not base_url or not token:
        raise InterpretEnhancerError("StepFun 后端配置缺失。")

    request_payload = {
        "model": "step-router-v1",
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "user",
                "content": build_interpret_prompt(payload),
            }
        ],
    }
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = httpx.post(f"{base_url}/v1/messages", headers=headers, json=request_payload, timeout=90)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise InterpretEnhancerError("LLM 解读请求失败。") from exc

    return parse_stepfun_interpretation_response(response.json())
