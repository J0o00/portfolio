import sys

with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\r\n', '\n')

old_block = """.timeline-item {
  position: relative;
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background:
    linear-gradient(160deg, rgba(255,255,255,0.02) 0%, transparent 50%),
    var(--bg-card);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.timeline-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent);
}

.timeline-item:hover {
  border-color: rgba(96, 165, 250, 0.25);
  box-shadow: var(--shadow-1);
}"""

new_block = """.timeline-item {
  position: relative;
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease-out;
  background-color: hsl(222, 47%, 11%);
  background-image:
    radial-gradient(at 88% 40%, hsl(222, 47%, 11%) 0px, transparent 85%),
    radial-gradient(at 49% 30%, hsl(222, 47%, 11%) 0px, transparent 85%),
    radial-gradient(at 14% 26%, hsl(222, 47%, 11%) 0px, transparent 85%),
    radial-gradient(at 0% 64%, hsl(188, 95%, 55%) 0px, transparent 85%),
    radial-gradient(at 41% 94%, hsl(205, 92%, 62%) 0px, transparent 85%),
    radial-gradient(at 100% 99%, hsl(195, 100%, 55%) 0px, transparent 85%);
}

.timeline-item:hover {
  transform: translateY(-0.125rem);
  border-color: rgba(34, 211, 238, 0.4);
  box-shadow: 0 10px 40px -10px rgba(34, 211, 238, 0.35), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("timeline-item replaced")
else:
    print("old_block not found")

old_text_block = """.timeline-content h3 {
  font-size: 1.05rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
  color: var(--text-heading);
}

.timeline-date {
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-mono);
}"""

new_text_block = """.timeline-content p {
  color: #94a3b8;
}

.timeline-content h3 {
  font-size: 1.05rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
  color: #ffffff;
}

.timeline-date {
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #cbd5e1;
  font-family: var(--font-mono);
}"""

if old_text_block in content:
    content = content.replace(old_text_block, new_text_block)
    print("text block replaced")
else:
    print("old_text_block not found")

# Remove light theme overrides
light_theme_block = """[data-theme="light"] .timeline-item {
  background: var(--bg-card);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
}
[data-theme="light"] .timeline-item:hover {
  border-color: rgba(96, 165, 250, 0.4);
  box-shadow: 0 8px 30px rgba(96, 165, 250, 0.15);
}"""

if light_theme_block in content:
    content = content.replace(light_theme_block, "/* timeline-item light theme removed */")
    print("light theme block replaced")
else:
    print("light theme block not found")

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)
