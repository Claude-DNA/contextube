import re, json, sys
t = open(sys.argv[1], encoding='utf-8-sig').read().replace('\r', '')
t = t[t.index('*** START'):t.index('*** END')]
t = t[t.index('\nPART I\n') if '\nPART I\n' in t else t.index('Book I. The History Of A Family'):]
chapters = []; book = ''; cur = None
lines = t.split('\n'); i = 0
while i < len(lines):
    l = lines[i].strip()
    if re.match(r'^(Book [IVX]+\.|Epilogue)', l, re.I): book = l.title() if l.isupper() else l
    m = re.match(r'^Chapter ([IVX]+)\.\s*(.*)$', l)
    if m:
        title = m.group(2).strip()
        j = i + 1
        while not title and j < len(lines):
            title = lines[j].strip(); j += 1
        cur = {'book': book, 'chapter': m.group(1), 'title': title, 'text': []}; chapters.append(cur); i = j if not m.group(2).strip() else i + 1; continue
    if cur is not None and not re.match(r'^(Book [IVX]+\.|Epilogue|PART [IVX]+)', l): cur['text'].append(lines[i])
    i += 1
for c in chapters: c['text'] = re.sub(r'\n{3,}', '\n\n', '\n'.join(c['text'])).strip()
json.dump(chapters, open('chapters.json', 'w'), ensure_ascii=False)
print(len(chapters), sum(len(c['text']) for c in chapters), max(len(c['text']) for c in chapters))
for c in chapters[:3] + chapters[-2:]: print(c['book'], '|', c['chapter'], '|', c['title'], '|', len(c['text']), '|', c['text'][:60].replace('\n', ' '))
