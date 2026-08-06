# -*- coding: utf-8 -*-
"""把 blog/posts/*.md 渲染为静态 HTML 文章页 blog/<slug>.html(供无 JS 爬虫抓取)"""
import json
import html
import markdown
from datetime import datetime

BASE = r'C:/Users/13032/Desktop/Elmh-website-main'
CAT = {'tech': '技术笔记', 'game': '游戏杂谈', 'life': '学习生活'}

posts = json.load(open(BASE + '/blog/posts/index.json', encoding='utf-8'))

TEMPLATE = open(BASE + '/blog/static-template.html', encoding='utf-8').read()

for p in posts:
    slug = p['slug']
    md_text = open(BASE + '/blog/posts/' + p['file'], encoding='utf-8').read()
    body = markdown.markdown(md_text, extensions=['fenced_code', 'tables', 'sane_lists'])
    title = html.escape(p['title'])
    desc = html.escape(p.get('excerpt', ''))
    cat = CAT.get(p['category'], p['category'])
    year = datetime.now().year
    out = (TEMPLATE
           .replace('{{TITLE}}', title)
           .replace('{{DESC}}', desc)
           .replace('{{CAT}}', cat)
           .replace('{{DATE}}', p['date'])
           .replace('{{SLUG}}', slug)
           .replace('{{BODY}}', body)
           .replace('{{YEAR}}', str(year)))
    path = BASE + '/blog/%s.html' % slug
    with open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    print('generated:', path)
