
import json
from PIL import Image, ImageDraw
fr=json.load(open('captures/th.json')); n=len(fr)
runs=[]; i=0
while i<n:
    if fr[i]['shape']=='TH':
        j=i
        while j<n and fr[j]['shape']=='TH': j+=1
        runs.append((max(0,i-3), min(n-1,j+2))); i=j
    else: i+=1
runs=runs[:6]
im0=Image.open('captures/th-0.png'); W,H=im0.size; cols=max(b-a+1 for a,b in runs)
S=Image.new('RGB',(cols*(W+4),len(runs)*(H+18)),'#F7F5FF'); d=ImageDraw.Draw(S)
for r,(a,b) in enumerate(runs):
    y=r*(H+18)
    for k,i in enumerate(range(a,b+1)):
        im=Image.open('captures/th-%d.png'%i).convert('RGB'); x=k*(W+4); S.paste(im,(x,y))
        d.text((x+2,y+H+2),'%d %s'%(fr[i]['t'],fr[i]['shape']),fill='#2B2B3C' if fr[i]['shape']=='TH' else '#6E6E82')
S.save('captures/th-sheet.png'); print('runs',runs,S.size)
