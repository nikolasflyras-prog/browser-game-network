"""Build Daybook into one static page: public/daybook/index.html.

Run from anywhere:  python3 daybook/build.py
Sources: daybook/src/core.js, social.js, style.css and games/*.js, concatenated
into one script scope (core first, then social, then games in name order).
"""
import glob, os

here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'src')
out_path = os.path.join(here, '..', 'public', 'daybook', 'index.html')
API = '/api/daybook/lb'

css = open(os.path.join(src, 'style.css')).read()
js = open(os.path.join(src, 'core.js')).read() + '\n' + open(os.path.join(src, 'social.js')).read()
js += ''.join('\n/* ===== ' + os.path.basename(p) + ' ===== */\n' + open(p).read()
              for p in sorted(glob.glob(os.path.join(src, 'games', '*.js'))))

reset = (':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
         'body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}')
favicon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2319202E'/%3E"
           "%3Crect x='6' y='8' width='4' height='16' rx='1' fill='%23F06AA6'/%3E%3Crect x='12' y='12' width='4' height='12' rx='1' fill='%23FF9A57'/%3E"
           "%3Crect x='18' y='8' width='4' height='16' rx='1' fill='%239195FF'/%3E%3Crect x='24' y='14' width='3' height='10' rx='1' fill='%237DCB65'/%3E%3C/svg%3E")
page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Daybook · Browser Game Network</title>
<meta name="description" content="Daybook: 32 original daily puzzles across words, numbers, logic, memory, knowledge, skill and niche topics. New every midnight, with timers, history and leaderboards.">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="canonical" href="/daybook">
<link rel="icon" href="{favicon}">
<style>{reset}</style>
<script>window.DAYBOOK_API = {API!r}; window.DAYBOOK_HOME = '/'; window.DAYBOOK_HOME_NAME = 'Browser Game Network';</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@500;700&display=swap">
<style>{css}</style>
</head><body>
<div id="app"></div>
<script>
(() => {{
{js}
boot();
}})();
</script>
</body></html>
'''
os.makedirs(os.path.dirname(out_path), exist_ok=True)
open(out_path, 'w').write(page)
print('built public/daybook/index.html', len(page) // 1024, 'KB')
