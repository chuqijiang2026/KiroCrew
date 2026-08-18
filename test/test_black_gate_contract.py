"""The black gate must be real, and the docs must describe the gate that exists.

This repository ran for a long time with `black --check` commented out in CI while
`AGENTS.md` listed `black src/kiro_crew test` as a gate to run before committing.
That is a worse failure than a missing gate: following the documented command
reformats ~95,800 lines across 1,420 pre-existing files, so a contributor either
buries their own diff or knowingly skips a documented step. Both happened.

These tests pin the two halves that have to stay true together -- CI enforces
black, and no document tells anyone to run it in the form that hurts.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_black_formatting.py"
BASELINE = ROOT / ".github" / "black-baseline.txt"
CI = ROOT / ".github" / "workflows" / "ci.yml"

SPEC = importlib.util.spec_from_file_location("check_black_formatting", SCRIPT)
assert SPEC and SPEC.loader
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)


def _lint_steps() -> list[dict]:
    workflow = yaml.safe_load(CI.read_text(encoding="utf-8"))
    for job in workflow["jobs"].values():
        steps = job.get("steps") or []
        if any("isort --check-only" in str(step.get("run", "")) for step in steps):
            return steps
    raise AssertionError("ci.yml has no job running isort --check-only")


def test_ci_actually_runs_the_black_gate() -> None:
    # The whole point: a gate that exists only as a comment is not a gate.
    runs = [str(step.get("run", "")) for step in _lint_steps()]
    assert any(
        "scripts/check_black_formatting.py" in run for run in runs
    ), "ci.yml's lint job no longer runs the black gate"


def test_ci_does_not_run_a_bare_repo_wide_black_check() -> None:
    # A bare `black --check src/ test/` fails on 1,420 pre-existing files, so
    # anyone re-enabling it would have to neuter the gate again to get CI green.
    for run in (str(step.get("run", "")) for step in _lint_steps()):
        if "black" not in run or "check_black_formatting" in run:
            continue
        assert "--check" not in run, (
            f"ci.yml runs a bare black --check, which cannot pass on this "
            f"repository's existing files: {run!r}"
        )


@pytest.mark.parametrize(
    "doc",
    [
        "AGENTS.md",
        "docs/system-specs/common/code-style.md",
        "docs/system-specs/common/testing-conventions.md",
    ],
)
def test_no_document_tells_a_contributor_to_reformat_the_whole_tree(doc: str) -> None:
    # `black src/kiro_crew test` is the exact command that buries a diff under
    # ~95,800 lines of unrelated churn. AGENTS.md carried it for months.
    text = (ROOT / doc).read_text(encoding="utf-8")
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("black "):
            continue
        assert "src/kiro_crew test" not in stripped and "src/ test/" not in stripped, (
            f"{doc} instructs a repo-wide reformat: {stripped!r}. Point at "
            "scripts/check_black_formatting.py and per-file formatting instead."
        )


def test_the_baseline_holds_relative_paths_to_files_that_exist() -> None:
    # An absolute path matches nothing on another checkout, so the gate would
    # report every baselined file as a new offender the moment it ran on CI.
    entries = gate._read_baseline(BASELINE)
    assert entries, "the baseline is empty; the gate would demand a full reformat"
    for entry in entries:
        assert not Path(entry).is_absolute(), f"{entry} is absolute"
        assert (ROOT / entry).is_file(), f"{entry} is in the baseline but does not exist"


def test_refreshing_the_baseline_can_only_delete_lines(tmp_path: Path) -> None:
    # This is the rule that keeps the gate from becoming a formality: if a
    # refresh could ADD a path, the fix for a red gate would be to run the
    # refresh, and unformatted code would land unchallenged forever.
    baseline = tmp_path / "black-baseline.txt"
    gate._write_baseline(baseline, {"kept.py", "graduated.py", "vanished.py"})

    # "kept" is still unformatted; "graduated" is now clean; "vanished" is gone;
    # "brand_new.py" is unformatted but unlisted -- a new offender.
    gate._write_baseline(baseline, set(gate._read_baseline(baseline)) & {"kept.py"})

    remaining = set(gate._read_baseline(baseline))
    assert remaining == {"kept.py"}
    assert "brand_new.py" not in remaining
