import os
import subprocess
from openai import OpenAI

MAX_DIFF_CHARS = 180_000  # keep costs predictable; tune as needed

def sh(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True).strip()

def main():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # No key (common on fork PRs). Generate a friendly note.
        with open("ai_review.md", "w", encoding="utf-8") as f:
            f.write(
                "### AI Review\n"
                "OPENAI_API_KEY is not available for this run (often happens on fork PRs). "
                "Skipping AI review.\n"
            )
        return

    base_ref = os.getenv("BASE_REF", "main")
    # Ensure base ref exists locally
    subprocess.check_call(["git", "fetch", "origin", base_ref, "--depth=1"])

    diff = sh(["git", "diff", f"origin/{base_ref}...HEAD", "--unified=3"])
    if not diff:
        with open("ai_review.md", "w", encoding="utf-8") as f:
            f.write("### AI Review\nNo code changes detected in diff.\n")
        return

    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n[diff truncated]\n"

    repo = os.getenv("REPO", "")
    pr_number = os.getenv("PR_NUMBER", "")
    head_sha = os.getenv("HEAD_SHA", "")

    prompt = f"""
You are an expert software engineer doing a pull request review.

Repo: {repo}
PR: {pr_number}
Head SHA: {head_sha}

Review goals:
- Find correctness issues, edge cases, security concerns, and performance problems.
- Flag breaking changes and missing tests.
- Suggest concrete improvements.
- Be concise and actionable.

Output format (Markdown):
1) Summary (3-6 bullets)
2) High-risk issues (if any) with file hints
3) Medium/low issues
4) Tests to add / verify
5) Nitpicks (optional)

Here is the unified diff:
```diff
{diff}
