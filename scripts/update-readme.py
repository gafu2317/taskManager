#!/usr/bin/env python3
"""
README.md の自動生成セクションを更新するスクリプト。
git pre-commit フックから呼び出される。

更新対象:
  <!-- AUTO:api-endpoints --> ... <!-- /AUTO:api-endpoints -->
  <!-- AUTO:updated -->        ... <!-- /AUTO:updated -->
"""

import re
import subprocess
from datetime import datetime
from pathlib import Path

# ルートディレクトリを取得
repo_root = Path(
    subprocess.check_output(["git", "rev-parse", "--show-toplevel"])
    .decode()
    .strip()
)

MAIN_GO = repo_root / "backend" / "main.go"
README   = repo_root / "README.md"

# パスごとの説明（main.go のルート登録順と対応）
ROUTE_DESCRIPTIONS: dict[tuple[str, str], str] = {
    ("GET",    "/health"):           "ヘルスチェック",
    ("POST",   "/tasks"):            "タスク作成",
    ("GET",    "/tasks"):            "タスク一覧（`?completed=true/false`）",
    ("GET",    "/task/:id"):         "タスク取得",
    ("PUT",    "/task/:id"):         "タスク更新",
    ("DELETE", "/task/:id"):         "タスク削除",
    ("GET",    "/tags"):             "タグ一覧",
    ("POST",   "/sessions"):         "作業セッション記録",
    ("GET",    "/sessions"):         "セッション一覧（`?date_from=&date_to=`）",
    ("POST",   "/bgm-presets"):      "BGMプリセット作成",
    ("GET",    "/bgm-presets"):      "BGMプリセット一覧",
    ("DELETE", "/bgm-preset/:id"):   "BGMプリセット削除",
    ("GET",    "/mascot"):           "マスコット取得（`?slot=1`）",
    ("POST",   "/mascot/action"):    "ポイント付与（task_complete / work_session / login）",
    ("POST",   "/mascot/preset"):    "性格プリセット変更・解放",
    ("POST",   "/mascot/shop/buy"):  "アクセサリ購入",
    ("PUT",    "/mascot/equip"):     "アクセサリ装備",
    ("POST",   "/mascot/unlock"):    "スロット解放",
}


def extract_routes(main_go: Path) -> list[tuple[str, str]]:
    """main.go から r.METHOD("path", ...) のルートを順番通りに抽出する。"""
    pattern = re.compile(r'r\.(GET|POST|PUT|DELETE)\("([^"]+)"')
    routes = []
    for line in main_go.read_text(encoding="utf-8").splitlines():
        m = pattern.search(line)
        if m:
            routes.append((m.group(1), m.group(2)))
    return routes


def build_api_table(routes: list[tuple[str, str]]) -> str:
    rows = ["| メソッド | パス | 説明 |", "|---------|------|------|"]
    for method, path in routes:
        desc = ROUTE_DESCRIPTIONS.get((method, path), "")
        rows.append(f"| `{method}` | `{path}` | {desc} |")
    return "\n".join(rows)


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
    routes      = extract_routes(MAIN_GO)
    api_table   = build_api_table(routes)
    updated_str = datetime.now().strftime("最終更新: %Y-%m-%d")

    readme = README.read_text(encoding="utf-8")
    readme = replace_section(readme, "api-endpoints", api_table)
    readme = replace_section(readme, "updated",       updated_str)
    README.write_text(readme, encoding="utf-8")

    print(f"[update-readme] README.md を更新しました（{len(routes)} ルート）")


if __name__ == "__main__":
    main()
