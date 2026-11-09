#!/usr/bin/env python3
"""動作確認用に、index.html と css/js/アイコンを1つのHTMLファイルにまとめる。

使い方:  python3 tools/build.py   →  dist/aqua-lab-preview.html ができる
（公開するのは分かれたままのソース一式。まとめたファイルは確認用）
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")


def inline_css(m):
    css = (ROOT / m.group(1)).read_text(encoding="utf-8")
    # css 内の画像（url("../images/xxx.png")）も埋め込む
    css = re.sub(r'url\("\.\./([^"]+\.png)"\)',
                 lambda u: 'url("data:image/png;base64,' + base64.b64encode((ROOT / u.group(1)).read_bytes()).decode() + '")', css)
    return "<style>/* " + m.group(1) + " */\n" + css + "</style>"


def inline_js(m):
    js = (ROOT / m.group(1)).read_text(encoding="utf-8")
    # JS の中で読み込む画像（"icons/xxx.png"）も埋め込む
    js = re.sub(r'"(icons/[^"]+\.png)"',
                lambda u: '"data:image/png;base64,' + base64.b64encode((ROOT / u.group(1)).read_bytes()).decode() + '"', js)
    return "<script>/* " + m.group(1) + " */\n" + js + "</script>"


def inline_png(m):
    data = base64.b64encode((ROOT / m.group(2)).read_bytes()).decode()
    return m.group(1) + 'href="data:image/png;base64,' + data + '"'


html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)
html = re.sub(r'(<link rel="(?:apple-touch-icon|icon)"[^>]*?)href="([^"]+\.png)"', inline_png, html)

html = re.sub(r'(<img [^>]*?)src="([^"]+\.png)"',
              lambda m: m.group(1) + 'src="data:image/png;base64,' + base64.b64encode((ROOT / m.group(2)).read_bytes()).decode() + '"', html)

out = ROOT / "dist" / "aqua-lab-preview.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(out, len(html) // 1024, "KB")
