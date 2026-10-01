"""Build dist/index.html from src/.

src/index.html holds the page shell. Any <style> or <script> tag with a
data-src="path" attribute is filled in from that file (path is relative to src/).

Usage:
  python build.py              # inline + minify  -> dist/index.html
  python build.py --no-min     # inline only (readable output, for debugging)
  python build.py --out FILE   # write somewhere else (e.g. index.html in the repo root)
"""
import argparse, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')

ap = argparse.ArgumentParser()
ap.add_argument('--no-min', action='store_true', help='inline files but do not minify')
ap.add_argument('--out', default=os.path.join(HERE, 'dist', 'index.html'))
args = ap.parse_args()

ES = (shutil.which('esbuild')
      or next((p for p in [
          os.path.join(HERE, 'node_modules', '.bin', 'esbuild'),
          '/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild/bin/esbuild',
      ] if os.path.exists(p)), None))
if not args.no_min and not ES:
    sys.exit('esbuild not found. Run: npm i -D esbuild   (or use --no-min)')

def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()

def mini(code, loader):
    r = subprocess.run(
        [ES, '--minify', '--loader=' + loader, '--target=es2020',
         '--charset=utf8', '--legal-comments=none'],
        input=code.encode('utf-8'), capture_output=True)
    if r.returncode:
        sys.exit(r.stderr.decode('utf-8', 'replace')[:600])
    return r.stdout.decode('utf-8')

def inline(m):
    tag, attrs = m.group(1), m.group(2)
    rel = re.search(r'\sdata-src="([^"]+)"', attrs).group(1)
    path = os.path.join(SRC, rel)
    if not os.path.exists(path):
        sys.exit('missing file: ' + path)
    body = read(path)
    if not args.no_min:
        body = mini(body, 'css' if tag == 'style' else 'js')
    attrs = re.sub(r'\sdata-src="[^"]+"', '', attrs)
    return f'<{tag}{attrs}>{body}</{tag}>'

html = read(os.path.join(SRC, 'index.html'))
out = re.sub(r'<(style|script)\b([^>]*\sdata-src="[^"]+"[^>]*)></\1>', inline, html)

# Drop HTML comments from the shell (keeps IE conditional comments).
if not args.no_min:
    out = re.sub(r'<!--(?!\[if).*?-->\n?', '', out, flags=re.S)

os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
with open(args.out, 'w', encoding='utf-8', newline='') as f:
    f.write(out)
print(len(html.encode()), '(shell) ->', len(out.encode()), 'bytes:', args.out)
