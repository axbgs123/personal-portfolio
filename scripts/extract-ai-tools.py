"""Extract DOCX text/tables and Word field hyperlinks; emit an apply_patch patch."""
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
metadata = (root / 'src/constants/aiToolDocuments.js').read_text()
documents = re.findall(r"slug: '([^']+)',\s*title: '([^']+)',\s*sourceFile: '([^']+)'", metadata)

def url(instruction):
    match = re.search(r'HYPERLINK\s+(?:"([^"]+)"|(\S+))', instruction, re.I)
    value = (match.group(1) or match.group(2)) if match else ''
    return value if re.match(r'^(https?://|mailto:)', value, re.I) else None

def paragraph(p, rels):
    spans, fields = [], []
    def walk(node, href=None, bold=False):
        if node.tag == W + 'hyperlink':
            href = rels.get(node.get(R + 'id'))
        if node.tag == W + 'fldSimple':
            href = url(node.get(W + 'instr', ''))
        if node.tag == W + 'r':
            b = node.find(W + 'rPr/' + W + 'b')
            bold = b is not None and b.get(W + 'val') not in ('0', 'false')
        if node.tag == W + 'fldChar':
            kind = node.get(W + 'fldCharType')
            if kind == 'begin': fields.append({'instruction': '', 'display': False})
            elif kind == 'separate' and fields: fields[-1]['display'] = True
            elif kind == 'end' and fields: fields.pop()
        elif node.tag == W + 'instrText':
            if fields: fields[-1]['instruction'] += node.text or ''
        elif node.tag in (W + 't', W + 'tab', W + 'br'):
            text = node.text or '' if node.tag == W + 't' else ('\t' if node.tag == W + 'tab' else '\n')
            link = href or next((url(f['instruction']) for f in reversed(fields) if f['display']), None)
            span = {'text': text}
            if link and re.match(r'^(https?://|mailto:)', link, re.I): span['href'] = link
            if bold: span['bold'] = True
            spans.append(span)
        else:
            for child in node: walk(child, href, bold)
    walk(p)
    # Plain visible URLs are clickable too; preserve all visible characters.
    linked = []
    for span in spans:
        if 'href' in span:
            linked.append(span)
            continue
        for part in re.split(r'(https?://[^\s<>]+)', span['text']):
            if part:
                item = {**span, 'text': part}
                if re.match(r'^https?://', part): item['href'] = part
                linked.append(item)
    text = ''.join(s['text'] for s in linked)
    style = p.find(W + 'pPr/' + W + 'pStyle')
    heading = bool(re.match(r'^(?:[一二三四五六七八九十]+[、．]|\d+[、．])', text))
    if style is not None and re.search(r'heading|标题', style.get(W + 'val', ''), re.I): heading = True
    return {'type': 'heading' if heading and len(text) < 100 else 'paragraph', 'spans': linked}

result = {}
for slug, title, filename in documents:
    with ZipFile(source / filename) as z:
        assert z.testzip() is None, filename
        doc = ET.fromstring(z.read('word/document.xml'))
        rels = {e.get('Id'): e.get('Target') for e in ET.fromstring(z.read('word/_rels/document.xml.rels'))}
        blocks = []
        for child in doc.find(W + 'body'):
            if child.tag == W + 'p':
                block = paragraph(child, rels)
                if block['spans']: blocks.append(block)
            elif child.tag == W + 'tbl':
                rows = []
                for row in child.findall(W + 'tr'):
                    cells = []
                    for cell in row.findall(W + 'tc'):
                        cells.append([paragraph(p, rels) for p in cell.iter(W + 'p')])
                    rows.append(cells)
                blocks.append({'type': 'table', 'rows': rows})
        original = ''.join(n.text or '' for n in doc.iter(W + 't'))
        def texts(block):
            if block['type'] == 'table': return ''.join(texts(p) for row in block['rows'] for cell in row for p in cell)
            return ''.join(s['text'] for s in block['spans'])
        assert re.sub(r'\s', '', original) == re.sub(r'\s', '', ''.join(map(texts, blocks))), filename
        result[slug] = blocks
        print(f'{slug}: {len(blocks)} blocks, source text preserved', file=sys.stderr)
print('*** Begin Patch')
print('*** Add File: ' + str(root / 'src/content/ai-tools.json'))
for line in json.dumps(result, ensure_ascii=False, indent=2).splitlines(): print('+' + line)
print('*** End Patch')
