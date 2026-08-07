# -*- coding: utf-8 -*-
"""博客一键构建:从 blog/posts/index.json 生成静态文章页、博客列表和 sitemap。

用法:
    python .github/build/build.py

自动完成:
1. 每篇文章渲染为 blog/<slug>.html(正文内嵌,爬虫无需 JS)
2. blog.html 文章列表静态化(按日期倒序)
3. sitemap.xml 补全全部 URL

本地运行或 GitHub Actions 运行皆可(脚本不做 git 操作)。
"""
import json
import html
import os
import sys
from datetime import date

try:
    import markdown
except ImportError:
    sys.exit('缺少 markdown 库,请先安装: pip install markdown')

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(BUILD, 'templates')
BASE_URL = 'https://elmh.top'
CAT = {'tech': '技术笔记', 'game': '游戏杂谈', 'life': '学习生活'}


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write(path, content):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)


def main():
    changed = []

    # 1. 读文章登记表
    posts = json.loads(read(os.path.join(ROOT, 'blog/posts/index.json')))

    # 2. 生成文章静态页
    post_tpl = read(os.path.join(TEMPLATES, 'post.html'))
    for p in posts:
        slug = p['slug']
        md_text = read(os.path.join(ROOT, 'blog/posts', p['file']))
        body = markdown.markdown(md_text, extensions=['fenced_code', 'tables', 'sane_lists'])
        out = (post_tpl
               .replace('{{TITLE}}', html.escape(p['title']))
               .replace('{{DESC}}', html.escape(p.get('excerpt', '')))
               .replace('{{CAT}}', CAT.get(p['category'], p['category']))
               .replace('{{DATE}}', p['date'])
               .replace('{{SLUG}}', slug)
               .replace('{{BODY}}', body)
               .replace('{{YEAR}}', str(date.today().year)))
        path = os.path.join(ROOT, 'blog', slug + '.html')
        old = read(path) if os.path.exists(path) else None
        if old != out:
            write(path, out)
            changed.append('blog/' + slug + '.html')

    # 3. 生成 blog.html 文章列表(日期倒序,同日保持登记顺序)
    post_tpl_items = []
    for p in sorted(posts, key=lambda x: x['date'], reverse=True):
        cat_name = CAT.get(p['category'], p['category'])
        post_tpl_items.append(
            '            <a class="post-item" data-cat="{cat}" href="blog/{slug}.html">\n'
            '                <div class="post-date">{date} · {cat_name}</div>\n'
            '                <div class="post-title">{title}</div>\n'
            '                <div class="post-excerpt">{excerpt}</div>\n'
            '            </a>'.format(
                cat=p['category'], slug=p['slug'], date=p['date'], cat_name=cat_name,
                title=html.escape(p['title']), excerpt=html.escape(p.get('excerpt', ''))))
    blog_html = read(os.path.join(TEMPLATES, 'blog.html')).replace(
        '{{POST_LIST}}', '\n'.join(post_tpl_items))
    blog_path = os.path.join(ROOT, 'blog.html')
    if read(blog_path) != blog_html:
        write(blog_path, blog_html)
        changed.append('blog.html')

    # 4. 生成 sitemap.xml
    entries = []
    for p in posts:
        entries.append(
            '    <url>\n'
            '        <loc>{base}/blog/{slug}.html</loc>\n'
            '        <lastmod>{date}</lastmod>\n'
            '        <changefreq>yearly</changefreq>\n'
            '        <priority>0.8</priority>\n'
            '    </url>'.format(base=BASE_URL, slug=p['slug'], date=p['date']))
    sitemap = read(os.path.join(TEMPLATES, 'sitemap.xml')).replace(
        '{{TODAY}}', date.today().isoformat()).replace('{{URL_ENTRIES}}', '\n'.join(entries))
    sitemap_path = os.path.join(ROOT, 'sitemap.xml')
    if read(sitemap_path) != sitemap:
        write(sitemap_path, sitemap)
        changed.append('sitemap.xml')

    # 5. 摘要
    if changed:
        print('已更新 %d 个文件:' % len(changed))
        for f in changed:
            print('  +', f)
    else:
        print('无变更,所有文件已是最新。')


if __name__ == '__main__':
    main()
