"""Tests for HTML chat reply helpers."""

from app.llm.provider import HTML_RESPONSE_RULE
from app.services.chat import _normalize_html_reply


def test_html_response_rule_requires_html() -> None:
    assert "HTML" in HTML_RESPONSE_RULE
    assert "Markdown" in HTML_RESPONSE_RULE


def test_normalize_html_reply_strips_fences() -> None:
    raw = "```html\n<p>Hello</p>\n```"
    assert _normalize_html_reply(raw) == "<p>Hello</p>"


def test_normalize_html_reply_wraps_plain_text() -> None:
    assert _normalize_html_reply("plain answer") == "<p>plain answer</p>"
