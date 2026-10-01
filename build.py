import re, subprocess, sys, os
ES='/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild/bin/esbuild'
src=open('/home/claude/dead-keys-main/index.html',encoding='utf-8').read()
def mini(code,loader):
    r=subprocess.run([ES,'--minify','--loader='+loader,'--target=es2019','--legal-comments=none'],input=code.encode(),capture_output=True)
    if r.returncode: print(r.stderr.decode()[:600]); sys.exit(1)
    return r.stdout.decode()
out=re.sub(r'<!--.*?-->','',src,count=0,flags=re.S) if False else src
# drop the long design-brief comment only (first comment)
out=re.sub(r'<!--.*?-->\n?','',out,count=1,flags=re.S)
out=re.sub(r'(<style[^>]*>)(.*?)(</style>)',lambda m:m.group(1)+mini(m.group(2),'css')+m.group(3),out,flags=re.S)
out=re.sub(r'(<script>)(.*?)(</script>)',lambda m:m.group(1)+mini(m.group(2),'js')+m.group(3),out,flags=re.S)
os.makedirs('/home/claude/dist',exist_ok=True)
open('/home/claude/dist/index.html','w',encoding='utf-8').write(out)
print(len(src.encode()),'->',len(out.encode()))
