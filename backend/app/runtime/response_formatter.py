import re
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Pattern, Match, Optional


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ResponseFormatterConfig:
    """
    Configuration for response formatting behavior.
    """
    empty_response_fallback: str = "No response generated."
    long_paragraph_threshold: int = 450
    paragraph_sentence_chunk_size: int = 2
    enable_llm_noise_cleanup: bool = True
    enable_heading_normalization: bool = True
    enable_list_normalization: bool = True
    enable_spacing_normalization: bool = True
    enable_long_paragraph_split: bool = True
    enable_readability_enhancement: bool = True
    preserve_code_blocks: bool = True


class ResponseFormatter:
    """
    Production-grade response formatter for LLM outputs.

    Responsibilities:
    - Clean escaped / malformed model output
    - Preserve markdown and code blocks
    - Improve readability for UI rendering
    - Normalize bullets, numbering, headings, spacing
    - Remove robotic filler and duplicated structure

    Design goals:
    - Safe and predictable
    - Idempotent where possible
    - Configurable
    - Easy to extend and test
    """

    CODE_BLOCK_TEMPLATE = "[[CODE_BLOCK_{index}]]"

    def __init__(self, config: Optional[ResponseFormatterConfig] = None) -> None:
        self.config = config or ResponseFormatterConfig()

        self._compiled_patterns = self._build_patterns()
        self._unicode_replacements = self._build_unicode_replacements()
        self._escaped_replacements = self._build_escaped_replacements()
        self._text_replacements = self._build_text_replacements()
        self._heading_keywords = self._build_heading_keywords()

    # =========================================================
    # PUBLIC API
    # =========================================================
    def refine(self, text: str) -> str:
        """
        Main entry point for formatting model output.

        Args:
            text: Raw LLM-generated text.

        Returns:
            Cleaned, UI-friendly, markdown-safe text.
        """
        try:
            if not self._is_valid_text(text):
                return self.config.empty_response_fallback

            text = str(text).strip()

            text = self._decode_escaped_text(text)
            text = self._normalize_unicode(text)

            code_blocks: List[str] = []
            if self.config.preserve_code_blocks:
                text = self._extract_code_blocks(text, code_blocks)

            if self.config.enable_llm_noise_cleanup:
                text = self._remove_llm_noise(text)

            if self.config.enable_heading_normalization:
                text = self._normalize_headings(text)

            if self.config.enable_list_normalization:
                text = self._normalize_lists(text)

            if self.config.enable_spacing_normalization:
                text = self._normalize_spacing(text)

            if self.config.enable_long_paragraph_split:
                text = self._split_long_paragraphs(text)

            if self.config.enable_readability_enhancement:
                text = self._enhance_readability(text)

            if self.config.preserve_code_blocks:
                text = self._restore_code_blocks(text, code_blocks)

            text = self._final_markdown_cleanup(text)

            return text.strip() or self.config.empty_response_fallback

        except Exception as error:
            logger.exception(
                "[ResponseFormatter] Failed to refine response | error=%s",
                str(error),
            )
            return str(text).strip() if text else self.config.empty_response_fallback

    # =========================================================
    # INTERNAL BUILDERS
    # =========================================================
    def _build_patterns(self) -> Dict[str, Pattern[str]]:
        return {
            "code_block": re.compile(r"```[\s\S]*?```"),
            "quoted_heading": re.compile(r"^\*\*[^*].*[^*]\*\*$"),
            "numbered_heading": re.compile(r"^\d+\)\s+[A-Za-z]"),
            "bullet_prefix": re.compile(r"^\s*[-*•●▪◦]\s*"),
            "numbered_item": re.compile(r"^\s*(\d+)\)\s*"),
            "numbered_spacing": re.compile(r"^(\d+\.)\s*([^\s].*)$"),
            "double_bullet": re.compile(r"^-+\s*-\s*"),
            "list_or_heading_block": re.compile(r"^(- |\d+\. |#)", flags=re.MULTILINE),
            "sentence_split": re.compile(r'(?<=[.!?])\s+'),
            "heading_line": re.compile(r"^#{1,6}\s"),
            "list_line": re.compile(r"^(- |\d+\. )"),
            "excessive_blank_lines": re.compile(r"\n{3,}"),
            "duplicate_heading": re.compile(r"(## .+)\n\1"),
        }

    def _build_unicode_replacements(self) -> Dict[str, str]:
        return {
            "\u00a0": " ",   # non-breaking space
            "\u200b": "",    # zero-width space
            "\ufeff": "",    # BOM
            "•": "- ",
            "●": "- ",
            "▪": "- ",
            "◦": "- ",
        }

    def _build_escaped_replacements(self) -> Dict[str, str]:
        return {
            "\\r\\n": "\n",
            "\\n": "\n",
            "\\t": "    ",
            "\\\"": '"',
            "\\'": "'",
        }

    def _build_text_replacements(self) -> Dict[str, str]:
        return {
            "Please note that": "Note:",
            "That being said,": "",
            "It is essential to": "You should",
            "It is important to": "You should",
            "It is recommended that": "You should",
            "You may want to": "Try to",
            "One should": "You should",
            "In conclusion,": "",
            "Overall,": "",
            "To summarize,": "",
        }

    def _build_heading_keywords(self) -> List[str]:
        return [
            "what you should do",
            "best strategy",
            "focus on",
            "avoid",
            "plan",
            "roadmap",
            "final advice",
            "next steps",
            "important",
            "priority",
            "solution",
            "fix",
            "recommendation",
            "implementation",
            "production notes",
        ]

    # =========================================================
    # VALIDATION
    # =========================================================
    def _is_valid_text(self, text: str) -> bool:
        return bool(text and str(text).strip())

    # =========================================================
    # STEP 1: Decode escaped model output
    # =========================================================
    def _decode_escaped_text(self, text: str) -> str:
        text = text.strip()

        # Remove wrapping quotes if entire response is quoted
        if len(text) >= 2 and text[0] == text[-1] and text[0] in ('"', "'"):
            text = text[1:-1]

        for old, new in self._escaped_replacements.items():
            text = text.replace(old, new)

        return text

    # =========================================================
    # STEP 2: Unicode / weird symbols cleanup
    # =========================================================
    def _normalize_unicode(self, text: str) -> str:
        for old, new in self._unicode_replacements.items():
            text = text.replace(old, new)
        return text

    # =========================================================
    # STEP 3: Extract fenced code blocks to protect them
    # =========================================================
    def _extract_code_blocks(self, text: str, code_blocks: List[str]) -> str:
        pattern = self._compiled_patterns["code_block"]

        def replacer(match: Match[str]) -> str:
            code_blocks.append(match.group(0))
            return self.CODE_BLOCK_TEMPLATE.format(index=len(code_blocks) - 1)

        return pattern.sub(replacer, text)

    def _restore_code_blocks(self, text: str, code_blocks: List[str]) -> str:
        for index, block in enumerate(code_blocks):
            text = text.replace(self.CODE_BLOCK_TEMPLATE.format(index=index), block)
        return text

    # =========================================================
    # STEP 4: Remove robotic / repetitive LLM noise
    # =========================================================
    def _remove_llm_noise(self, text: str) -> str:
        fluff_patterns = [
            r"\bCertainly[,! ]*",
            r"\bOf course[,! ]*",
            r"\bSure[,! ]*",
            r"\bHere'?s (a|the) (clean|improved|refined|formatted) version[:\-]?\s*",
            r"\bLet me know if you want.*$",
            r"\bI hope this helps\.?",
            r"\bFeel free to ask.*$",
        ]

        for pattern in fluff_patterns:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.MULTILINE)

        for old, new in self._text_replacements.items():
            text = text.replace(old, new)

        return text.strip()

    # =========================================================
    # STEP 5A: Normalize headings
    # =========================================================
    def _normalize_headings(self, text: str) -> str:
        lines = text.splitlines()
        cleaned: List[str] = []
        seen_heading = set()

        quoted_heading_pattern = self._compiled_patterns["quoted_heading"]
        numbered_heading_pattern = self._compiled_patterns["numbered_heading"]

        for line in lines:
            stripped = line.strip()

            if quoted_heading_pattern.match(stripped):
                heading = stripped.strip("*").strip()
                normalized_key = heading.lower()

                if normalized_key not in seen_heading:
                    cleaned.append(f"## {heading}")
                    seen_heading.add(normalized_key)
                continue

            if numbered_heading_pattern.match(stripped):
                stripped = re.sub(r"^(\d+)\)\s+", r"\1. ", stripped)

            cleaned.append(stripped)

        return "\n".join(cleaned)

    # =========================================================
    # STEP 5B: Normalize bullets and numbered lists
    # =========================================================
    def _normalize_lists(self, text: str) -> str:
        lines = text.splitlines()
        formatted: List[str] = []

        bullet_prefix = self._compiled_patterns["bullet_prefix"]
        numbered_item = self._compiled_patterns["numbered_item"]
        numbered_spacing = self._compiled_patterns["numbered_spacing"]
        double_bullet = self._compiled_patterns["double_bullet"]

        for line in lines:
            line = line.rstrip()

            if self._is_code_placeholder(line):
                formatted.append(line)
                continue

            line = bullet_prefix.sub("- ", line)
            line = numbered_item.sub(r"\1. ", line)
            line = numbered_spacing.sub(r"\1 \2", line)
            line = double_bullet.sub("- ", line)

            formatted.append(line)

        return "\n".join(formatted)

    # =========================================================
    # STEP 5C: Normalize spacing
    # =========================================================
    def _normalize_spacing(self, text: str) -> str:
        lines = [line.rstrip() for line in text.splitlines()]
        cleaned_lines: List[str] = []
        previous_blank = False

        for line in lines:
            stripped = line.strip()

            if stripped == "":
                if not previous_blank:
                    cleaned_lines.append("")
                previous_blank = True
            else:
                cleaned_lines.append(line.strip())
                previous_blank = False

        return "\n".join(cleaned_lines).strip()

    # =========================================================
    # STEP 6A: Break giant paragraphs
    # =========================================================
    def _split_long_paragraphs(self, text: str) -> str:
        paragraphs = text.split("\n\n")
        improved: List[str] = []

        list_or_heading_block = self._compiled_patterns["list_or_heading_block"]
        sentence_split = self._compiled_patterns["sentence_split"]

        for para in paragraphs:
            para = para.strip()

            if not para:
                continue

            if self._is_code_placeholder(para):
                improved.append(para)
                continue

            if list_or_heading_block.search(para):
                improved.append(para)
                continue

            if len(para) > self.config.long_paragraph_threshold:
                sentences = sentence_split.split(para)
                chunk: List[str] = []

                for index, sentence in enumerate(sentences, start=1):
                    chunk.append(sentence)

                    if index % self.config.paragraph_sentence_chunk_size == 0:
                        improved.append(" ".join(chunk).strip())
                        chunk = []

                if chunk:
                    improved.append(" ".join(chunk).strip())
            else:
                improved.append(para)

        return "\n\n".join(improved)

    # =========================================================
    # STEP 6B: Improve readability with spacing before sections
    # =========================================================
    def _enhance_readability(self, text: str) -> str:
        lines = text.splitlines()
        improved: List[str] = []

        for line in lines:
            lower = line.lower().strip()

            if any(keyword in lower for keyword in self._heading_keywords):
                if improved and improved[-1] != "":
                    improved.append("")
                improved.append(line)
            else:
                improved.append(line)

        return "\n".join(improved)

    # =========================================================
    # STEP 7: Final cleanup
    # =========================================================
    def _final_markdown_cleanup(self, text: str) -> str:
        lines = text.splitlines()
        cleaned: List[str] = []

        heading_line = self._compiled_patterns["heading_line"]
        list_line = self._compiled_patterns["list_line"]

        for idx, line in enumerate(lines):
            current = line.rstrip()

            if heading_line.match(current):
                if cleaned and cleaned[-1] != "":
                    cleaned.append("")

            if list_line.match(current):
                current = current.strip()

            cleaned.append(current)

            if (
                idx + 1 < len(lines)
                and list_line.match(current.strip())
                and heading_line.match(lines[idx + 1].strip())
            ):
                cleaned.append("")

        result = "\n".join(cleaned)
        result = self._compiled_patterns["excessive_blank_lines"].sub("\n\n", result)
        result = self._compiled_patterns["duplicate_heading"].sub(r"\1", result)

        return result.strip()

    # =========================================================
    # UTILITIES
    # =========================================================
    def _is_code_placeholder(self, text: str) -> bool:
        return text.startswith("[[CODE_BLOCK_") and text.endswith("]]")