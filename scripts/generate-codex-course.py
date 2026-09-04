import json
import re
from pathlib import Path
from urllib.parse import unquote

from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / 'src/content/codex-course-source.md'
ASSET_MAP_PATH = ROOT / 'src/content/codex-course-assets.json'
HTML_PATH = ROOT / 'src/content/codex-course.html'
TOC_PATH = ROOT / 'src/content/codex-course-toc.json'


def clean_markdown(text: str) -> str:
    text = text.replace('\\-', '-').replace('\\+', '+').replace('\\&', '&').replace('\\_', '_')
    while '****' in text:
        text = text.replace('****', '**')
    text = text.replace('** **', '')
    lines = text.splitlines()
    output = []
    lesson_pattern = re.compile(r'^#\s+(?:\\?\*?第|第).+节')
    started = False
    in_code_fence = False

    for index, line in enumerate(lines):
        if line.strip().startswith('```'):
            in_code_fence = not in_code_fence
        if not in_code_fence and 'http' in line and '**' in line:
            line = line.replace('**', '')
        if index == 0 and line.startswith('# '):
            continue
        if index in (2, 4) and line.startswith('# '):
            output.append(line[2:])
            continue
        if lesson_pattern.match(line):
            started = True
            output.append(f'## {line[2:].strip()}')
            continue
        if started and line.startswith('# '):
            output.append(f'### {line[2:].strip()}')
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


def replace_attachment(match: re.Match) -> str:
    prefix, raw_path = match.group(1), match.group(2)
    decoded_path = unquote(raw_path).replace('图片和附件/', '')
    mapped = asset_map.get(decoded_path)
    if mapped:
        return f'{prefix}({mapped})'
    if decoded_path.lower().endswith('.mp4'):
        label_match = re.search(r'\[([^\]]+)\]$', prefix)
        label = label_match.group(1) if label_match else decoded_path
        return f'**{label}（视频原文件未嵌入网页）**'
    return match.group(0)


markdown = re.sub(r'(!?\[[^\]]*\])\((图片和附件/[^)]+)\)', replace_attachment, markdown)

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
    title = re.sub(r'\\([\\`*_{}\[\]()#+\-.!])', r'\1', title)
    title = title.replace('**', '').replace('`', '').lstrip('*').strip()
    anchor = slugify(title)
    token.attrSet('id', anchor)

    if level == 2:
        current_primary = {'id': anchor, 'title': title, 'children': []}
        toc.append(current_primary)
    elif level == 3 and current_primary:
        current_primary['children'].append({'id': anchor, 'title': title})

course_html = md.renderer.render(tokens, md.options, {})
course_html = course_html.replace(
    '<p><a href="https://my.feishu.cn/wiki/HmMHwxEqoi3EO3k0NHJc46GWn4d">常见问题&amp;解决方案</a></p>',
    '<div class="course-faq-cta"><a href="/tutorials/codex-faq"><span><strong>常见问题&amp;解决方案</strong><small>安装、订阅与模型接入问题</small></span><b>打开 ↗</b></a></div>',
)


def group_consecutive_images(match: re.Match) -> str:
    images = re.findall(r'<img\s+[^>]+\s*/>', match.group(0))
    groups = []
    for index in range(0, len(images), 2):
        figures = ''.join(f'<figure>{image}</figure>' for image in images[index : index + 2])
        groups.append(f'<div class="course-image-group">{figures}</div>')
    return '\n'.join(groups) + '\n'


course_html = re.sub(r'(?:<p><img\s+[^>]+\s*/></p>\n){2,}', group_consecutive_images, course_html)

HTML_PATH.write_text(course_html, encoding='utf-8')
TOC_PATH.write_text(f'{json.dumps(toc, ensure_ascii=False, indent=2)}\n', encoding='utf-8')
print(f'Generated {len(toc)} primary sections and {sum(len(item["children"]) for item in toc)} secondary sections.')
