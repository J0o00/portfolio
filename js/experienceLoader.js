import { publicExperienceService } from './services/publicExperienceService.js';
import { supabase } from '../src/lib/supabase.js';

export async function initExperience() {
  console.log("INIT EXPERIENCE");
  const timelineGrid = document.getElementById('experience-timeline');
  if (!timelineGrid) return;

  try {
    const experiences = await publicExperienceService.getPublishedExperience();
    
    if (experiences.length === 0) {
      timelineGrid.innerHTML = `
        <div style="text-align: center; color: var(--admin-placeholder); padding: 2rem;">
          No timeline experience available yet.
        </div>
      `;
      return;
    }

    renderExperienceTimeline(experiences, timelineGrid);

    // Auto-scroll if deep linked
    const urlParams = new URLSearchParams(window.location.search);
    const experienceSlug = urlParams.get('experience') || 
                           (window.__PRELOADED_CONTENT__?.type === 'experience' ? window.__PRELOADED_CONTENT__.slug : null);
                           
    if (experienceSlug) {
      setTimeout(() => {
        const el = document.getElementById(`exp-${experienceSlug}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.border = '1px solid rgba(255, 255, 255, 0.4)';
          el.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
        }
      }, 800); // Wait for page layout
    }
  } catch (err) {
    console.error('Error loading experience:', err);
    timelineGrid.innerHTML = '<p>Failed to load experience. Please try again later.</p>';
  }
}

function renderExperienceTimeline(experiences, container) {
  container.innerHTML = '';
  
  experiences.forEach((exp, index) => {
    // Generate dates
    const startStr = exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const endStr = exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
    const dateDisplay = startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr || exp.type);
    
    const tagsHtml = exp.tags && exp.tags.length > 0 
      ? `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">
          ${exp.tags.map(t => `<span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.1); border-radius: 12px; color: #cbd5e1;">${t.name}</span>`).join('')}
         </div>`
      : '';

    const el = document.createElement('div');
    el.className = 'timeline-item';
    if (exp.slug) el.id = `exp-${exp.slug}`;
    el.innerHTML = `
      <canvas class="timeline-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:0.6; mix-blend-mode: screen;"></canvas>
      <div class="timeline-dot"></div>
      <div class="timeline-content" style="position:relative; z-index:10;">
          <p class="timeline-date">${dateDisplay}</p>
          <h3>${exp.role_title} - ${exp.organization}</h3>
          ${exp.summary ? `<p>${exp.summary}</p>` : ''}
          ${tagsHtml}
      </div>
    `;
    
    // Minimal interactivity setup for canvas if the logic exists globally, else just static HTML for now.
    // The original site had canvas logic, we'll just preserve the structure.
    
    container.appendChild(el);
    
    // Trigger the staggered reveal animation manually since they are loaded asynchronously
    setTimeout(() => {
      el.style.transitionDelay = `${index * 70}ms`;
      el.classList.add('child-visible');
    }, 100);
  });
}
