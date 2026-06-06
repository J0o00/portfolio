const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

css = css.replace(/#05050A/gi, '#0a0a0a');
css = css.replace(/#0A0A10/gi, '#141414');
css = css.replace(/#8B5CF6/gi, '#FF5722');
css = css.replace(/#A78BFA/gi, '#FF7043');
css = css.replace(/#D946EF/gi, '#FF3D00');
css = css.replace(/rgba\(\s*139\s*,\s*92\s*,\s*246/g, 'rgba(255, 87, 34');
css = css.replace(/rgba\(\s*217\s*,\s*70\s*,\s*239/g, 'rgba(255, 61, 0');
css = css.replace(/#C4B5FD/gi, '#FFAB91');
css = css.replace(/rgba\(\s*20\s*,\s*15\s*,\s*30\s*,\s*0\.4\)/g, 'rgba(25, 15, 10, 0.4)');
css = css.replace(/\.status-completed \{ background: rgba\(16,185,129,0\.1\); color: var\(--accent-secondary\);/g, '.status-completed { background: rgba(16,185,129,0.1); color: #10B981;');

fs.writeFileSync('css/style.css', css);
console.log('CSS updated');
