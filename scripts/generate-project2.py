import json
import re
from pathlib import Path

from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / 'src/content/project2-source.md'
HTML_PATH = ROOT / 'src/content/project2.html'
TOC_PATH = ROOT / 'src/content/project2-toc.json'

markdown = SOURCE_PATH.read_text(encoding='utf-8')
output = []
for line in markdown.splitlines():
    if line.startswith('# '):
        output.append(f'## {line[2:].strip()}')
    elif line.startswith('## '):
        output.append(f'### {line[3:].strip()}')
    else:
        output.append(line)
markdown = '\n'.join(output)

md = MarkdownIt('commonmark', {'html': False, 'linkify': True, 'typographer': True}).enable('table')
tokens = md.parse(markdown)
slug_counts = {}
toc = []
current_primary = None


def slugify(title: str) -> str:
    base = re.sub(r'[^\w\u3400-\u9fff]+', '-', title.lower()).strip('-') or 'section'
    slug_counts[base] = slug_counts.get(base, 0) + 1
    return base if slug_counts[base] == 1 else f'{base}-{slug_counts[base]}'


for index, token in enumerate(tokens):
    if token.type != 'heading_open':
        continue
    level = int(token.tag[1])
    title = tokens[index + 1].content.strip()
    anchor = slugify(title)
    token.attrSet('id', anchor)

    if level == 2:
        current_primary = {'id': anchor, 'title': title, 'children': []}
        toc.append(current_primary)
    elif level == 3 and current_primary:
        current_primary['children'].append({'id': anchor, 'title': title})

project_html = md.renderer.render(tokens, md.options, {})
HTML_PATH.write_text(project_html, encoding='utf-8')
TOC_PATH.write_text(f'{json.dumps(toc, ensure_ascii=False, indent=2)}\n', encoding='utf-8')
print(f'Generated {len(toc)} chapters and {sum(len(item["children"]) for item in toc)} secondary sections.')
