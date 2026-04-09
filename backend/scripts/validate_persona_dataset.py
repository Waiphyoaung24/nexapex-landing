#!/usr/bin/env python3
"""Validate backend/data/nexapex-train.jsonl against the design spec.

Runs all 7 checks from docs/plans/2026-04-10-nexapex-persona-dataset-design.md
and exits non-zero if any fail.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PATH = Path(__file__).parent.parent / "data" / "nexapex-train.jsonl"

CTA = (
    "This is exactly the kind of solution NexApex builds. "
    "Want to see how it would work for your business?"
)
REDIRECT = (
    "I'm best at helping with business AI solutions. "
    "What challenges is your business facing?"
)
SYSTEM_START = "You are NexApex AI"
TH_SUFFIX = "The user prefers Thai"
MY_SUFFIX = "The user prefers Burmese"


def main() -> int:
    failures: list[str] = []
    lines = PATH.read_text(encoding="utf-8").splitlines()

    # Check 1: line count
    if len(lines) == 160:
        print(f"[OK ] Check 1: line count = 160")
    else:
        failures.append(f"Check 1 FAILED: line count = {len(lines)}, expected 160")

    # Check 2-6: parse + structural checks
    rows: list[dict] = []
    parse_fail = 0
    for idx, line in enumerate(lines, start=1):
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            parse_fail += 1
            if parse_fail <= 3:
                failures.append(f"Check 2 FAILED line {idx}: {exc}")
    if parse_fail == 0:
        print(f"[OK ] Check 2: all {len(rows)} lines parse as JSON")
    else:
        failures.append(f"Check 2 FAILED: {parse_fail} lines did not parse")

    # Check 3: every row has 3 turns, roles in order
    shape_ok = 0
    for idx, row in enumerate(rows, start=1):
        conv = row.get("conversations")
        if not isinstance(conv, list) or len(conv) != 3:
            failures.append(f"Check 3 FAILED row {idx}: conversations len = {len(conv) if isinstance(conv, list) else 'N/A'}")
            continue
        roles = [t.get("role") for t in conv]
        if roles != ["system", "user", "assistant"]:
            failures.append(f"Check 3 FAILED row {idx}: roles = {roles}")
            continue
        shape_ok += 1
    if shape_ok == len(rows):
        print(f"[OK ] Check 3: all rows are [system, user, assistant]")
    else:
        failures.append(f"Check 3 FAILED: {len(rows) - shape_ok} rows bad shape")

    # Check 4: system content starts with expected string
    sys_ok = sum(
        1
        for r in rows
        if r["conversations"][0]["content"].startswith(SYSTEM_START)
    )
    if sys_ok == len(rows):
        print(f'[OK ] Check 4: all system prompts start with "{SYSTEM_START}"')
    else:
        failures.append(
            f"Check 4 FAILED: {len(rows) - sys_ok} system prompts don't start with '{SYSTEM_START}'"
        )

    # Check 5: language split by suffix presence
    en_count = 0
    th_count = 0
    my_count = 0
    for r in rows:
        sysc = r["conversations"][0]["content"]
        if TH_SUFFIX in sysc:
            th_count += 1
        elif MY_SUFFIX in sysc:
            my_count += 1
        else:
            en_count += 1
    expected = {"en": 100, "th": 30, "my": 30}
    actual = {"en": en_count, "th": th_count, "my": my_count}
    if actual == expected:
        print(f"[OK ] Check 5: language split = {actual}")
    else:
        failures.append(f"Check 5 FAILED: expected {expected}, got {actual}")

    # Check 6: redirect line appears in exactly 8 rows
    redirect_count = sum(
        1 for r in rows if REDIRECT in r["conversations"][2]["content"]
    )
    if redirect_count == 8:
        print(f"[OK ] Check 6: redirect line appears in exactly 8 rows")
    else:
        failures.append(f"Check 6 FAILED: redirect line in {redirect_count} rows, expected 8")

    # Check 7: CTA line appears in >= 140 rows
    cta_count = sum(
        1 for r in rows if CTA in r["conversations"][2]["content"]
    )
    if cta_count >= 140:
        print(f"[OK ] Check 7: CTA line appears in {cta_count} rows (>= 140)")
    else:
        failures.append(f"Check 7 FAILED: CTA line in {cta_count} rows, expected >= 140")

    # Summary
    print()
    if failures:
        print(f"FAILED: {len(failures)} issue(s)")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("All 7 checks passed.")
    # Bonus stats
    total_chars = sum(len(line) for line in lines)
    print(f"\nStats:")
    print(f"  Total size: {total_chars:,} chars ({total_chars / 1024:.1f} KB)")
    print(f"  Avg row size: {total_chars // len(lines):,} chars")
    assistant_lengths = [
        len(r["conversations"][2]["content"]) for r in rows
    ]
    print(f"  Assistant response length: min={min(assistant_lengths)}, max={max(assistant_lengths)}, avg={sum(assistant_lengths)//len(assistant_lengths)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
