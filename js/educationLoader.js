import { publicEducationService } from './services/publicEducationService.js';

export async function initEducation() {
  const container = document.getElementById('education-list');
  if (!container) return;

  try {
    const educationEntries = await publicEducationService.getPublishedEducation();
    
    if (educationEntries.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--admin-placeholder); padding: 2rem;">
          No education entries available yet.
        </div>
      `;
      return;
    }

    renderEducation(educationEntries, container);
  } catch (err) {
    console.error('Error loading education:', err);
    container.innerHTML = '<p>Failed to load education. Please try again later.</p>';
  }
}

function renderEducation(entries, container) {
  container.innerHTML = '';
  
  entries.forEach((ed, index) => {
    // Generate dates
    const startStr = ed.start_date ? new Date(ed.start_date).toLocaleDateString('en-US', { year: 'numeric' }) : '';
    const endStr = ed.end_date ? new Date(ed.end_date).toLocaleDateString('en-US', { year: 'numeric' }) : 'Present';
    const dateDisplay = startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr);
    
    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.innerHTML = `
      <canvas class="timeline-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:0.6; mix-blend-mode: screen;"></canvas>
      <div class="timeline-dot"></div>
      <div class="timeline-content" style="position:relative; z-index:10;">
          <p class="timeline-date">${dateDisplay}</p>
          <h3>${ed.institution}</h3>
          <p style="color: var(--text-heading); font-weight: 500; margin-bottom: 0.5rem;">${ed.degree || ''} ${ed.field_of_study ? `in ${ed.field_of_study}` : ''} ${ed.cgpa ? `| CGPA: ${ed.cgpa}` : ''}</p>
          ${ed.description ? `<p>${ed.description}</p>` : ''}
      </div>
    `;
    
    container.appendChild(el);
    
    // Trigger staggered reveal animation manually since they are loaded asynchronously
    setTimeout(() => {
      el.style.transitionDelay = `${index * 70}ms`;
      el.classList.add('child-visible');
    }, 100);
  });
}
