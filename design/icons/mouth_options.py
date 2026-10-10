# Dombi smirk options in Duolingo's mouth language: one round-capped stroke, asymmetric, off-centre.
B='<circle cx="100" cy="108" r="66" fill="#17171F"/><circle cx="100" cy="104" r="66" fill="#2B2B3C"/><rect x="66" y="78" width="18" height="34" rx="9" fill="#fff"/><rect x="116" y="78" width="18" height="34" rx="9" fill="#fff"/>'
def stroke(d, w=7): return f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
OPTS = [
 ("now · L bars", '<rect x="91" y="124" width="26" height="7" rx="3.5" fill="#fff"/><rect x="110" y="118" width="7" height="13" rx="3.5" fill="#fff"/>'),
 ("A · swoosh", stroke("M88 127 C96 131 108 131 118 119")),
 ("B · soft smirk", stroke("M90 127 C99 130 109 129 116 122")),
 ("C · swoosh + dimple", stroke("M88 127 C96 131 108 131 118 119") + stroke("M120 126 C121 129 121 131 120 133", 4)),
 ("D · long sly", stroke("M84 126 C95 131 110 131 121 117")),
 ("E · short tilt", stroke("M95 128 C102 130 109 128 115 121")),
]
EXTRA = [  # same language for other moods (with option A as the smirk)
 ("happy · curve", stroke("M86 124 C93 133 109 133 117 122")),
 ("laugh · D shape", '<path d="M84 121 L118 117 C120 128 112 138 101 137 C92 136 85 130 84 121 Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'),
 ("focus · flat", stroke("M93 127 C99 127 105 127 110 126")),
 ("unsure · wave", stroke("M90 128 C95 124 99 124 103 128 C107 132 111 131 115 127")),
]
cell=210; items=OPTS+EXTRA; cols=5; rows=(len(items)+cols-1)//cols
s=f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols*cell}" height="{rows*cell}"><rect width="100%" height="100%" fill="#fff"/>'
for i,(n,m) in enumerate(items):
    x=(i%cols)*cell; y=(i//cols)*cell
    s+=f'<rect x="{x+5}" y="{y+5}" width="{cell-10}" height="{cell-10}" rx="22" fill="#EFEBFF"/><g transform="translate({x+30} {y+12}) scale(0.75)">{B}{m}</g>'
    s+=f'<text x="{x+cell/2}" y="{y+cell-16}" font-family="Nunito,Arial" font-weight="800" font-size="15" fill="#6E6E82" text-anchor="middle">{n}</text>'
open('mouth_opts.svg','w',encoding='utf-8').write(s+'</svg>')
