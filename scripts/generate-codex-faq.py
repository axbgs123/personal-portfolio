import json
import re
from pathlib import Path
from urllib.parse import unquote

from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / 'src/content/codex-faq-source.md'
ASSET_MAP_PATH = ROOT / 'src/content/codex-faq-assets.json'
HTML_PATH = ROOT / 'src/content/codex-faq.html'
TOC_PATH = ROOT / 'src/content/codex-faq-toc.json'


def clean_markdown(text: str) -> str:
    text = text.replace('\\-', '-').replace('\\+', '+').replace('\\&', '&').replace('\\_', '_')
    lines = text.splitlines()
    output = []

    for index, line in enumerate(lines):
        if index == 0 and line.startswith('# '):
            continue
        if line.startswith('# '):
            output.append(f'## {line[2:].strip()}')
            continue
        if line.startswith('## '):
            output.append(f'### {line[3:].strip()}')
            continue
        if line.startswith('### '):
            output.append(f'#### {line[4:].strip()}')
            continue
        output.append(line)

    return '\n'.join(output)


asset_map = json.loads(ASSET_MAP_PATH.read_text(encoding='utf-8'))
markdown = clean_markdown(SOURCE_PATH.read_text(encoding='utf-8'))


def replace_image(match: re.Match) -> str:
    prefix, raw_path = match.group(1), match.group(2)
    decoded_path = unquote(raw_path).replace('图片和附件/', '')
    mapped = asset_map.get(decoded_path)
    return f'{prefix}({mapped})' if mapped else match.group(0)


markdown = re.sub(r'(!\[[^\]]*\])\((图片和附件/[^)]+)\)', replace_image, markdown)

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
    title = re.sub(r'\\([\\`*_{}\[\]()#+\-.!])', r'\1', title).replace('**', '').replace('`', '').strip()
    anchor = slugify(title)
    token.attrSet('id', anchor)

    if level == 2:
        current_primary = {'id': anchor, 'title': title, 'children': []}
        toc.append(current_primary)
    elif level == 3 and current_primary:
        current_primary['children'].append({'id': anchor, 'title': title})

faq_html = md.renderer.render(tokens, md.options, {})


def group_consecutive_images(match: re.Match) -> str:
    images = re.findall(r'<img\s+[^>]+\s*/>', match.group(0))
    groups = []
    for index in range(0, len(images), 2):
        figures = ''.join(f'<figure>{image}</figure>' for image in images[index : index + 2])
        groups.append(f'<div class="course-image-group">{figures}</div>')
    return '\n'.join(groups) + '\n'


faq_html = re.sub(r'(?:<p><img\s+[^>]+\s*/></p>\n){2,}', group_consecutive_images, faq_html)
HTML_PATH.write_text(faq_html, encoding='utf-8')
TOC_PATH.write_text(f'{json.dumps(toc, ensure_ascii=False, indent=2)}\n', encoding='utf-8')
print(f'Generated {len(toc)} FAQ categories and {sum(len(item["children"]) for item in toc)} questions.')
