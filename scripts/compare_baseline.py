#!/usr/bin/env python3
"""Compare current lesson fragments to the phase-0 golden master."""
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class VisibleLesson(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.lesson_id = None
        self.record_id = None
        self.sections = []
        self.data_keys = []
        self.checkboxes = 0
        self.questions = 0
        self.text = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = a.get("class", "").split()
        opens_lesson = tag == "div" and "lesson" in classes
        if opens_lesson:
            self.lesson_id = a.get("id")
            self.record_id = self.lesson_id
        if self.lesson_id is not None:
            if tag in ("script", "style"):
                self.skip += 1
            if tag == "section" and a.get("id"):
                self.sections.append(a["id"])
            if tag == "input" and a.get("type") == "checkbox":
                self.checkboxes += 1
            if tag == "details":
                self.questions += 1
            if a.get("data-key") is not None:
                self.data_keys.append(a["data-key"])
            if tag not in ("br", "hr", "img", "input", "meta", "link", "source", "wbr"):
                self.stack.append((tag, opens_lesson))

    def handle_endtag(self, tag):
        if self.lesson_id is None:
            return
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
        idx = next((i for i in range(len(self.stack)-1, -1, -1) if self.stack[i][0] == tag), None)
        if idx is None:
            return
        removed = self.stack[idx:]
        del self.stack[idx:]
        if any(is_lesson for _, is_lesson in removed):
            self.lesson_id = None

    def handle_data(self, data):
        if self.lesson_id is not None and not self.skip:
            self.text.append(data)

    def record(self):
        normalized = re.sub(r"\s+", " ", " ".join(self.text)).strip()
        return {"id": self.record_id, "sections": self.sections, "checkboxes": self.checkboxes,
                "questions": self.questions, "data_keys": self.data_keys,
                "text_sha256": hashlib.sha256(normalized.encode()).hexdigest()}


def lesson_ranges(page):
    pattern = re.compile(r'<div\b(?=[^>]*\bclass=["\'][^"\']*\blesson\b)[^>]*>', re.I)
    # The baseline is built from each complete lesson wrapper; use the same token-balanced
    # extraction strategy without importing the migration script as a runtime dependency.
    from migrate_v1 import blocks_with_class
    return blocks_with_class(page, "div", "lesson")


def main():
    sys.path.insert(0, str(ROOT / "scripts"))
    baseline = json.loads((ROOT / "tests/baseline.json").read_text(encoding="utf-8"))
    failures = []
    total = 0
    subjects = json.loads((ROOT / "content/subjects.json").read_text(encoding="utf-8"))
    subject_data = {item["id"]: item for item in subjects}
    for subject, expected_lessons in baseline["subjects"].items():
        rows = subject_data[subject]["lessons"]
        if len(rows) != len(expected_lessons):
            failures.append("%s: %d dars, baseline %d" % (subject, len(rows), len(expected_lessons)))
            continue
        for i, lesson in enumerate(rows):
            meta = lesson["meta"]
            page_path = ROOT / "site" / subject / ("%02d-%s" % (meta["number"], meta["slug"])) / "index.html"
            page = page_path.read_text(encoding="utf-8")
            from migrate_v1 import blocks_with_class
            actual_ranges = blocks_with_class(page, "div", "lesson")
            if len(actual_ranges) != 1:
                failures.append("%s dars %d: page avec %d leçon(s)" % (subject, i + 1, len(actual_ranges)))
                continue
            start, end, _opening = actual_ranges[0]
            parser = VisibleLesson(); parser.feed(page[start:end])
            actual = parser.record()
            expected = {key: expected_lessons[i][key] for key in ("id", "sections", "checkboxes", "questions", "data_keys", "text_sha256")}
            if actual != expected:
                failures.append("%s dars %d: différence avec la baseline" % (subject, i + 1))
            total += 1
    if failures:
        print("ÉCHEC — %d différence(s):" % len(failures))
        print("\n".join(failures))
        return 1
    print("Baseline conforme : %d dars comparés, aucune perte détectée." % total)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
