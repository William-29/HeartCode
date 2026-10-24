"""Structural checks for generated markup; these do not measure browser layout."""
import json
from html.parser import HTMLParser
from pathlib import Path
import sys

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())


class Markup(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = set()
        self.errors = []

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                self.errors.append('Duplicate id: ' + attrs['id'])
            self.ids.add(attrs['id'])
        if tag in ('button', 'a') and tag in self.stack:
            self.errors.append('Nested interactive element: ' + tag)
        for key in ('src', 'href'):
            value = attrs.get(key, '')
            if value.startswith('assets/') and not (Path('dist') / value).is_file():
                self.errors.append('Missing asset: ' + value)
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            self.errors.append('Unbalanced close: ' + tag + ' within ' + '/'.join(self.stack[-4:]))
        else:
            self.stack.pop()


failures = {}
pages = json.load(sys.stdin)
for name, html in pages.items():
    parser = Markup()
    parser.feed(html)
    if parser.stack:
        parser.errors.append('Unclosed: ' + '/'.join(parser.stack))
    if parser.errors:
        failures[name] = parser.errors[:12]
print(json.dumps({'pages': len(pages), 'failures': failures}))
