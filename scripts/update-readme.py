#!/usr/bin/env python3
"""
README.md の自動生成セクションを更新するスクリプト。
git pre-commit フックから呼び出される。

更新対象:
  <!-- AUTO:updated --> ... <!-- /AUTO:updated -->
"""

import re
import subprocess
from datetime import datetime
from pathlib import Path

repo_root = Path(
    subprocess.check_output(["git", "rev-parse", "--show-toplevel"])
    .decode()
    .strip()
)

README = repo_root / "README.md"


def replace_section(content: str, marker: str, new_body: str) -> str:
    """<!-- AUTO:marker --> ... <!-- /AUTO:marker --> を new_body で置換する。"""
    pattern = re.compile(
        rf"<!-- AUTO:{re.escape(marker)} -->.*?<!-- /AUTO:{re.escape(marker)} -->",
        re.DOTALL,
    )
    replacement = (
        f"<!-- AUTO:{marker} -->\n"
        f"{new_body}\n"
        f"<!-- /AUTO:{marker} -->"
    )
    return pattern.sub(replacement, content)


def main() -> None:
    updated_str = datetime.now().strftime("最終更新: %Y-%m-%d")

    readme = README.read_text(encoding="utf-8")
    readme = replace_section(readme, "updated", updated_str)
    README.write_text(readme, encoding="utf-8")

    print("[update-readme] README.md を更新しました")


if __name__ == "__main__":
    main()
