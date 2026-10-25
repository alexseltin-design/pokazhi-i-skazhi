"""Cut a grid of picture cards (like the parent's flashcard sheets) into separate pictures.

    python3 tools/cut_grid.py SHEET.png name1,name2,...  [--cols 4 --rows 3 --caption 0.20]

Each card: the caption at the bottom is dropped, the coloured background, small
decorations (clouds) and the coloured floor shadow are removed, and the picture is
saved as assets/img/<name>.webp (320x320, transparent background).
"""
import sys,argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ap=argparse.ArgumentParser();ap.add_argument('sheet');ap.add_argument('names')
ap.add_argument('--cols',type=int,default=4);ap.add_argument('--rows',type=int,default=3);ap.add_argument('--caption',type=float,default=0.03,help='share of the card bottom to cut off (captions are erased letter by letter, so keep this small)')
ap.add_argument('--out',default='assets/img')
ap.add_argument('--ai',action='store_true',help='cut out with a neural network (pip install rembg onnxruntime); best quality')
ap.add_argument('--only',default='',help='comma-separated names: save only these pictures')
ap.add_argument('--minpart',type=float,default=0.12,help='keep separate pieces at least this share of the biggest piece (lower it when a picture has several loose parts)')
ap.add_argument('--keepshadow',default='',help='comma-separated names: do not remove pale shadows (e.g. a cloud)')
ap.add_argument('--glass',action='append',default=[],help='name of a see-through object (a glass): card colour seen through it is made neutral')
ap.add_argument('--erase',action='append',default=[],help='name:x0,y0,x1,y1 (0..1) — clear whitish bits (clouds) in this box of the finished picture');ap.add_argument('--preview',default='/tmp/cut_preview.png')
a=ap.parse_args();names=a.names.split(',')
if a.ai:
    from rembg import remove,new_session
    S=new_session('isnet-general-use')
im=np.asarray(Image.open(a.sheet).convert('RGB')).astype(np.float32)
sat=im.max(2)-im.min(2);colmask=sat>18
def runs(idx,minlen):
    out=[];s=p=idx[0]
    for v in idx[1:]:
        if v!=p+1: out.append((s,p));s=v
        p=v
    out.append((s,p));return [r for r in out if r[1]-r[0]>minlen]
C=runs(np.where(colmask.mean(0)>0.25)[0],120)
# rows: only look at the part of the sheet below any title
R=runs(np.where(colmask.mean(1)>0.45)[0],150)
R=sorted(R,key=lambda r:r[1]-r[0],reverse=True)[:a.rows];R.sort()
assert len(C)==a.cols and len(R)==a.rows,(C,R)
saved=[];k=0
for (y0,y1) in R:
    for (x0,x1) in C:
        card=im[y0+6:y1-6,x0+6:x1-6].copy();h=card.shape[0];card=card[:int(h*(1-a.caption))]
        # erase the caption letters (dark navy text in the lower part) instead of cutting the picture off
        hh=card.shape[0];band=card[int(hh*0.82):]
        r_,g_,b_=band[...,0],band[...,1],band[...,2];lm=band.mean(2)
        txt=(lm<105)&((b_-r_)>12)&((b_-r_)<70)&((g_-r_)>-5)&((g_-r_)<30)
        txt=ndi.binary_dilation(txt,iterations=3)
        bgc=np.median(np.concatenate([card[:12,:].reshape(-1,3),card[:,:12].reshape(-1,3),card[:,-12:].reshape(-1,3)]),0)
        band[txt]=bgc;card[int(hh*0.82):]=band
        h,w,_=card.shape
        if a.ai and (not a.only or names[k] in a.only.split(',')):
            res=np.asarray(remove(Image.fromarray(card.astype(np.uint8)),session=S)).astype(np.float32)
            alpha=res[...,3]/255;fg=alpha>0.5
            opened=ndi.binary_opening(fg,iterations=2);lab3,n=ndi.label(opened)
            if n>1:
                sizes=ndi.sum(opened,lab3,range(1,n+1));big=sizes.max();satc=card.max(2)-card.min(2);keepl=[]
                for i,s_ in enumerate(sizes):
                    mk=lab3==i+1
                    if s_==big or (s_>=a.minpart*big and not (satc[mk].mean()<28 and card[mk].mean()>205)): keepl.append(i+1)
                alpha=alpha*ndi.binary_dilation(np.isin(lab3,keepl),iterations=4)
            # soft coloured floor shadow under the object: pale, close to the card colour, at the very bottom
            bgc=np.median(np.concatenate([card[:12,:].reshape(-1,3),card[:,:12].reshape(-1,3),card[:,-12:].reshape(-1,3)]),0)
            dd=np.sqrt(((card-bgc)**2).sum(2));ys=np.where((alpha>0.5).any(1))[0]
            if len(ys) and names[k] not in a.keepshadow.split(','):
                yb0=int(ys.max()-(ys.max()-ys.min())*0.22);low=np.zeros(dd.shape,bool);low[yb0:]=True
                satn=card.max(2)-card.min(2);bsat=bgc.max()-bgc.min()
                shadow=low&(dd<46)&(satn<=bsat+28)&(card.mean(2)<=bgc.mean()+6)
                alpha[shadow]=0
            alpha[alpha<0.08]=0
            out=card
        else:
            out=None
        if out is None:
          bg=np.median(np.concatenate([card[:12,:].reshape(-1,3),card[:,:12].reshape(-1,3),card[:,-12:].reshape(-1,3)]),0)
          d=np.sqrt(((card-bg)**2).sum(2))
          white=card.min(2)>225;corner=np.zeros(white.shape,bool);corner[:40,:40]=corner[:40,-40:]=corner[-40:,:40]=corner[-40:,-40:]=True
          lab,_=ndi.label((d<30)|(white&corner))
          border=set(np.unique(np.concatenate([lab[0],lab[:,0],lab[:,-1],lab[-1]])))-{0}
          bgm=np.isin(lab,list(border))
          s=card.sum(2,keepdims=True)+1e-3;chd=np.abs(card/s-bg/bg.sum()).sum(2);lum=card.mean(2);bl=bg.mean()
          sh=(chd<0.06)&(lum<bl+2)&(lum>bl-95)&(~bgm)&(card.min(2)<215)
          # coloured floor shadows: same hue as the card, a bit stronger, in the lower part of the card
          cv=card-card.mean(2,keepdims=True);bv=bg-bg.mean()
          cosh=(cv*bv).sum(2)/(np.sqrt((cv**2).sum(2))*np.sqrt((bv**2).sum())+1e-6)
          low=np.zeros(d.shape,bool);low[int(h*0.55):]=True
          satn=card.max(2)-card.min(2);bsat=bg.max()-bg.min()
          sh=sh|((cosh>0.88)&low&(~bgm)&(satn>6)&(satn<bsat*1.9+18)&(lum>bl-70)&(lum<bl+4))
          lab2,_=ndi.label(sh|bgm);keep=set(np.unique(lab2[bgm]))-{0}
          bgm=bgm|(np.isin(lab2,list(keep))&sh)
          fg=~bgm
          # drop small separate bits (clouds, sparkles): keep pieces at least 12% of the biggest one
          # separate bits that touch the picture only by a thin bridge (e.g. a cloud behind a tail)
          opened=ndi.binary_opening(fg,iterations=3)
          lab3,n=ndi.label(opened)
          if n>1:
              sizes=ndi.sum(opened,lab3,range(1,n+1));big=sizes.max()
              satc=card.max(2)-card.min(2);keepl=[]
              for i,s_ in enumerate(sizes):
                  if s_==big: keepl.append(i+1);continue
                  mk=lab3==i+1
                  whiteblob=satc[mk].mean()<28 and card[mk].mean()>205   # a separate white cloud
                  if s_>=a.minpart*big and not whiteblob: keepl.append(i+1)
              fg=fg&ndi.binary_dilation(np.isin(lab3,keepl),iterations=5)
          alpha=fg.astype(np.float32)
          near=ndi.binary_dilation(~fg,iterations=2)&fg
          av=np.clip(d/60,0,1);alpha[near]=np.maximum(av[near],0.15)
          out=card.copy();m=near
          out[m]=np.clip((card[m]-(1-alpha[m,None])*bg)/alpha[m,None],0,255)
          alpha[alpha<0.45]=0   # drop faint leftovers (soft shadow edges) so they do not shrink the picture
        if names[k] in a.glass:   # a see-through glass: card colour inside it becomes neutral
            bgc=np.median(np.concatenate([card[:12,:].reshape(-1,3),card[:,:12].reshape(-1,3)]),0)
            cv=card-card.mean(2,keepdims=True);bv=bgc-bgc.mean()
            cosg=(cv*bv).sum(2)/(np.sqrt((cv**2).sum(2))*np.sqrt((bv**2).sum())+1e-6)
            dg=np.sqrt(((card-bgc)**2).sum(2));out=out.copy()
            tint=(alpha>0.3)&(dg<80)&(cosg>0.6)
            gg=out[tint].mean(1,keepdims=True);out[tint]=np.clip(gg*np.array([.97,.99,1.02]),0,255)
        img=Image.fromarray(np.dstack([out,alpha*255]).astype(np.uint8),'RGBA')
        bb=img.getchannel('A').point(lambda v:255 if v>110 else 0).getbbox();img=img.crop(bb)
        side=max(img.size);sq=Image.new('RGBA',(side+6,side+6),(0,0,0,0));sq.paste(img,((side+6-img.size[0])//2,(side+6-img.size[1])//2))
        sq=sq.resize((320,320),Image.LANCZOS)
        for e in a.erase:
            en,box=e.split(':')
            if en!=names[k]:continue
            ex0,ey0,ex1,ey1=[float(v) for v in box.split(",")];arr=np.asarray(sq).copy();H_,W_=arr.shape[:2]
            reg=arr[int(ey0*H_):int(ey1*H_),int(ex0*W_):int(ex1*W_)];rgb=reg[...,:3].astype(int)
            wh=((rgb.max(2)-rgb.min(2))<40)&(rgb.mean(2)>170);reg[...,3][wh]=0;sq=Image.fromarray(arr,'RGBA')
            bb=sq.getchannel('A').point(lambda v:255 if v>110 else 0).getbbox();t=sq.crop(bb);sd=max(t.size)
            sq=Image.new('RGBA',(sd+6,sd+6),(0,0,0,0));sq.paste(t,((sd+6-t.size[0])//2,(sd+6-t.size[1])//2));sq=sq.resize((320,320),Image.LANCZOS)
        fn=f'{a.out}/{names[k]}.webp'
        if not a.only or names[k] in a.only.split(','): sq.save(fn,'WEBP',quality=90,method=6)
        saved.append(fn);k+=1
cols=['#FFD6A5','#CAFFBF','#9BF6FF','#BDB2FF','#FFC6FF','#FDFFB6']
sheet=Image.new('RGB',(a.cols*180,a.rows*180),'white')
for i,fn in enumerate(saved):
    bgc=Image.new('RGB',(170,170),cols[i%6]);t=Image.open(fn).resize((160,160));bgc.paste(t,(5,5),t)
    sheet.paste(bgc,((i%a.cols)*180+5,(i//a.cols)*180+5))
sheet.save(a.preview);print('saved',len(saved))
