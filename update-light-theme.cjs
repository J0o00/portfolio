const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');

// Root variables
css = css.replace(/--bg-primary:\s*#0a0a0a;/gi, '--bg-primary: #FAFAFA;');
css = css.replace(/--bg-secondary:\s*#141414;/gi, '--bg-secondary: #F3F4F6;');
css = css.replace(/--text-heading:\s*#F9FAFB;/gi, '--text-heading: #111827;');
css = css.replace(/--text-body:\s*#9CA3AF;/gi, '--text-body: #4B5563;');
css = css.replace(/--border-color:\s*rgba\(255, 255, 255, 0.08\);/gi, '--border-color: rgba(0, 0, 0, 0.08);');
css = css.replace(/--card-bg:\s*rgba\(25, 15, 10, 0.4\);/gi, '--card-bg: rgba(255, 255, 255, 0.7);');

// Hardcoded background colors that were dark
css = css.replace(/rgba\(5, 5, 10, 0.6\)/g, 'rgba(255, 255, 255, 0.6)'); // Header
css = css.replace(/rgba\(10, 10, 12, 0.95\)/g, 'rgba(255, 255, 255, 0.85)'); // Modal overlay
css = css.replace(/rgba\(10, 10, 12, 0.6\)/g, 'rgba(255, 255, 255, 0.6)'); // Modal container
css = css.replace(/rgba\(10, 10, 12, 0.8\)/g, 'rgba(240, 240, 240, 0.8)'); // Tag bg
css = css.replace(/rgba\(255, 255, 255, 0.03\)/g, 'rgba(0, 0, 0, 0.03)'); // Btn secondary
css = css.replace(/rgba\(255, 255, 255, 0.08\)/g, 'rgba(0, 0, 0, 0.08)'); // Btn secondary hover
css = css.replace(/rgba\(255, 255, 255, 0.15\)/g, 'rgba(0, 0, 0, 0.15)'); // Btn primary border
css = css.replace(/rgba\(255, 255, 255, 0.1\)/g, 'rgba(0, 0, 0, 0.1)'); // Various borders
css = css.replace(/rgba\(255, 255, 255, 0.2\)/g, 'rgba(0, 0, 0, 0.2)'); // Btn secondary hover border
css = css.replace(/rgba\(255, 255, 255, 0.3\)/g, 'rgba(0, 0, 0, 0.3)'); // Btn primary hover border
css = css.replace(/#111114/gi, '#E5E7EB'); // card-visual bg
css = css.replace(/#1A1A1E/gi, '#E5E7EB'); // placeholder-diagram bg
css = css.replace(/#666/gi, '#9CA3AF'); // copyright text

// Tech badge color update
css = css.replace(/#FFAB91/gi, '#E64A19'); // tech badge text

// Shadows
css = css.replace(/rgba\(0,\s*0,\s*0,\s*0\.5\)/g, 'rgba(0,0,0,0.15)');
css = css.replace(/rgba\(0,\s*0,\s*0,\s*0\.3\)/g, 'rgba(0,0,0,0.1)');

// Modal backgrounds linear gradients (currently dark)
css = css.replace(/rgba\(10,10,12,0\.2\), rgba\(10,10,12,0\.7\)/g, 'rgba(255,255,255,0.1), rgba(255,255,255,0.5)');
css = css.replace(/rgba\(10,\s*10,\s*12,\s*0\.8\)/g, 'rgba(255, 255, 255, 0.8)');

fs.writeFileSync('css/style.css', css);

let animCss = fs.readFileSync('css/animations.css', 'utf8');
animCss = animCss.replace(/rgba\(255, 255, 255, 0\.12\)/g, 'rgba(0, 0, 0, 0.06)'); // tilt glare
animCss = animCss.replace(/rgba\(255, 255, 255, 0\.04\)/g, 'rgba(0, 0, 0, 0.02)'); // tilt glare

fs.writeFileSync('css/animations.css', animCss);

console.log('Light theme applied.');
