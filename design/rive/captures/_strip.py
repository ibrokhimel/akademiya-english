
import json,sys
from PIL import Image, ImageDraw
tag=sys.argv[1]; ts=json.load(open('captures/%s.json'%tag)); n=len(ts); im0=Image.open('captures/%s-0.png'%tag); W=130 if im0.width>=im0.height else 104; H=int(W*im0.height/im0.width); cols=min(n,12 if W>=120 else 16); rows=(n+cols-1)//cols
S=Image.new('RGB',(cols*W,rows*(H+14)),'#F7F5FF'); d=ImageDraw.Draw(S)
for i,t in enumerate(ts):
    im=Image.open('captures/%s-%d.png'%(tag,i)).convert('RGB').resize((W,H)); x=(i%cols)*W; y=(i//cols)*(H+14); S.paste(im,(x,y)); d.text((x+3,y+H+1),'%d'%t,fill='#6E6E82')
S.save('captures/%s-strip.png'%tag); print(tag,n,'frames',S.size)
