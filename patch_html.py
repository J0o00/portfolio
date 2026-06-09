import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to add a canvas and a floating wrapper to each timeline item.
content = content.replace('<div class="timeline-item">', '''<div class="timeline-item">
            <canvas class="timeline-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:0.6; mix-blend-mode: screen;"></canvas>''')

content = content.replace('<div class="timeline-content">', '<div class="timeline-content" style="position:relative; z-index:10;">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML updated")
