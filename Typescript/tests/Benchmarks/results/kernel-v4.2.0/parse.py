import re, json, glob, os, statistics as st, sys
import os
O=os.path.join(os.path.dirname(os.path.abspath(__file__)),'logs')
LBL={'benchmark.test':'1','benchmark.2.test':'2','benchmark.3.test':'3','benchmark.4.test':'4'}
def split_fire(txt):
    parts=re.split(r'FIRETEST :: (\S+)\n=+\n', txt)
    out={}; dur={}
    for i in range(1,len(parts),2):
        lab=parts[i]; body=parts[i+1]
        out[lab]=body
    for m in re.finditer(r'(✅|❌) FIRETEST :: (\S+) completed in ([\d.]+)ms', txt):
        dur[m.group(2)]=(m.group(1)=='✅', float(m.group(3)))
    return out, dur
def num(s):
    s=s.strip().strip("'")
    try: return float(s)
    except: return None
def metrics(bench, body):
    m={}
    if bench=='1':
        for x in re.finditer(r'N = (\d+)\s*\| Time: ([\d.]+)\s*ms \| Wave k: (\d+)', body): m[f'N={x[1]} ms']=float(x[2]); m[f'N={x[1]} k']=float(x[3])
    elif bench in('2','3'):
        for x in re.finditer(r'^(\d+),([\d.]+),(\d+),', body, re.M): m[f'n={x[1]} ms']=float(x[2]); m[f'n={x[1]} k']=float(x[3])
    elif bench=='4':
        for x in re.finditer(r'\[(\w+)[^\]]*\]\n> Latency: ([\d.]+)ms\n> Wave k: (\d+)', body): m[f'{x[1]} ms']=float(x[2]); m[f'{x[1]} k']=float(x[3])
    else:
        tables=[]; cur=None
        for line in body.splitlines():
            if line.startswith('┌'): cur=[]; continue
            if line.startswith('└'): tables.append(cur); cur=None; continue
            if cur is not None and line.startswith('│'): cur.append([c.strip() for c in line.strip('│').split('│')])
        for ti,t in enumerate(tables):
            hdr=t[0][1:]; rows=t[1:]
            for r in rows:
                cells=r[1:]; idv=[c for h,c in zip(hdr,cells) if h in('mode','plane','scope','nodes','fanout','window')]
                rid='/'.join(c.strip("'") for c in idv) or r[0]
                for h,c in zip(hdr,cells):
                    v=num(c)
                    if v is not None and h not in('nodes','fanout','inputs'): m[f't{ti}:{rid}:{h}']=v
        for x in re.finditer(r'(p95 drift|p95 overhead|secret-scope p95 slowdown): (-?[\d.]+)%', body): m[x[1]+' %']=float(x[2])
    return m
res={}
for build in ('b420','b409fix','b391'):
    for rd in sorted(glob.glob(f'{O}/{build}/r*')):
        r=os.path.basename(rd)
        f=f'{rd}/fire.log'
        if os.path.exists(f):
            bodies,dur=split_fire(open(f).read())
            for lab,(ok,d) in dur.items(): res.setdefault(build,{}).setdefault('fire',{}).setdefault(lab,[]).append((ok,d))
            for lab,body in bodies.items():
                if lab.startswith('benchmark.'):
                    b=lab.split('.')[1]
                    for k,v in metrics(b,body).items(): res[build].setdefault(b,{}).setdefault(k,[]).append(v)
        for f in glob.glob(f'{rd}/benchmark.*.log'):
            b=os.path.basename(f).split('.')[1]
            b=LBL.get(os.path.basename(f)[:-4], b)
            for k,v in metrics(b,open(f).read()).items(): res.setdefault(build,{}).setdefault(b,{}).setdefault(k,[]).append(v)
med={}
for build,bs in res.items():
    for b,ks in bs.items():
        for k,vs in ks.items():
            if b=='fire': med.setdefault(build,{}).setdefault('fire',{})[k]={'ok':all(o for o,_ in vs),'ms':st.median(d for _,d in vs),'n':len(vs)}
            else: med.setdefault(build,{}).setdefault(b,{})[k]={'med':st.median(vs),'min':min(vs),'max':max(vs),'n':len(vs)}
json.dump(med,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'medians.json'),'w'),indent=1)
for build in med:
    print(build, {b:(len(v), min(x['n'] for x in v.values())) for b,v in med[build].items()})
