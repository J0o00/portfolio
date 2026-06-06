const fs = require('fs');
let css = fs.readFileSync('css/animations.css', 'utf8');

css = css.replace(/#2563EB/gi, '#FF5722');
css = css.replace(/#10B981/gi, '#FF7043');
css = css.replace(/#8B5CF6/gi, '#FF3D00');
css = css.replace(/rgba\(37,\s*99,\s*235,\s*0\.7\)/g, 'rgba(255, 87, 34, 0.7)');

fs.writeFileSync('css/animations.css', css);
console.log('Animations CSS updated');
