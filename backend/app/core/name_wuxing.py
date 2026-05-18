from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.settings import stepfun_auth_token, stepfun_base_url

VALID_ELEMENTS = {"木", "火", "土", "金", "水", "未知"}


class NameWuxingError(RuntimeError):
    pass


def build_name_wuxing_prompt(name: str) -> str:
    return f"""
请分析中文姓名的五行倾向。最终答案必须只输出 JSON，不要输出解释、markdown 或额外文字。

姓名：{name}

JSON schema:
{{
  "name": "{name}",
  "elements": ["木|火|土|金|水"],
  "characters": [
    {{"char": "单字", "element": "木|火|土|金|水|未知"}}
  ]
}}

规则：
1. 每个姓名字符必须出现在 characters 中。
2. elements 只列出姓名中出现过的五行，去重。
3. 难以判断时 character.element 使用 "未知"。
4. 最终答案只输出 JSON 对象。
""".strip()


def extract_text_content(response_json: dict[str, Any]) -> str:
    if response_json.get("stop_reason") == "max_tokens":
        raise NameWuxingError("姓名五行分析被 max_tokens 截断，请提高 max_tokens 后重试。")

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
        raise NameWuxingError("StepFun 未返回可解析的 text 内容。")
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


def parse_name_wuxing_text(text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(extract_json_text(text))
    except json.JSONDecodeError as exc:
        raise NameWuxingError("姓名五行 JSON 解析失败，请重试。") from exc
    return normalize_name_wuxing(parsed)


def normalize_name_wuxing(value: dict[str, Any]) -> dict[str, Any]:
    name = str(value.get("name") or "").strip()
    if not name:
        raise NameWuxingError("姓名五行结果缺少 name。")

    characters = []
    for item in value.get("characters") if isinstance(value.get("characters"), list) else []:
        if not isinstance(item, dict):
            continue
        char = str(item.get("char") or "").strip()
        element = str(item.get("element") or item.get("wuxing") or "未知").strip()
        if not char:
            continue
        if element not in VALID_ELEMENTS:
            element = "未知"
        characters.append({"char": char, "element": element})

    if not characters:
        raise NameWuxingError("姓名五行结果缺少 characters。")

    elements: list[str] = []
    for item in value.get("elements") if isinstance(value.get("elements"), list) else []:
        element = str(item).strip()
        if element in VALID_ELEMENTS and element != "未知" and element not in elements:
            elements.append(element)
    for item in characters:
        element = item["element"]
        if element != "未知" and element not in elements:
            elements.append(element)

    return {"name": name, "elements": elements, "characters": characters}


def parse_stepfun_response(response_json: dict[str, Any]) -> dict[str, Any]:
    return parse_name_wuxing_text(extract_text_content(response_json))


def analyze_name_wuxing(name: str, *, max_tokens: int = 2000) -> dict[str, Any]:
    normalized = name.strip()
    if not normalized:
        raise NameWuxingError("姓名不能为空。")

    base_url = stepfun_base_url().rstrip("/")
    token = stepfun_auth_token()
    if not base_url or not token:
        raise NameWuxingError("StepFun 后端配置缺失。")

    payload = {
        "model": "step-router-v1",
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "user",
                "content": build_name_wuxing_prompt(normalized),
            }
        ],
    }
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = httpx.post(f"{base_url}/v1/messages", headers=headers, json=payload, timeout=30)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise NameWuxingError("StepFun 姓名五行请求失败。") from exc

    return parse_stepfun_response(response.json())
