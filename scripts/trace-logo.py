# Traces the black-on-transparent logo into a compact single-path SVG.
import sys, numpy as np, potrace
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA").resize((800, 800), Image.LANCZOS)
a = np.array(im)
ink = (a[:, :, 3] > 128) & (a[:, :, :3].mean(axis=2) < 128)
bm = potrace.Bitmap(~ink)
path = bm.trace(turdsize=4, alphamax=1.0, opticurve=True, opttolerance=0.3)
f = lambda p: f"{p.x:.1f} {p.y:.1f}"
d = []
for c in path:
    d.append("M" + f(c.start_point))
    for s in c.segments:
        if s.is_corner:
            d.append("L" + f(s.c) + "L" + f(s.end_point))
        else:
            d.append("C" + f(s.c1) + " " + f(s.c2) + " " + f(s.end_point))
    d.append("Z")
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><path fill-rule="evenodd" fill="currentColor" d="{"".join(d)}"/></svg>'
open(out, "w").write(svg)
print(len(svg))
