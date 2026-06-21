import { publicProjectService } from './services/publicProjectService.js';

let allProjects = [];
let activeTag = 'All';

export async function initProjects() {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  try {
    allProjects = await publicProjectService.getPublishedProjects();
    renderFilters();
    renderProjects(allProjects);

    // Auto-open if deep linked
    const urlParams = new URLSearchParams(window.location.search);
    const projectSlug = urlParams.get('project') || 
                        (window.__PRELOADED_CONTENT__?.type === 'project' ? window.__PRELOADED_CONTENT__.slug : null);
                        
    if (projectSlug) {
      setTimeout(() => openDynamicProjectModal(projectSlug), 500);
    }
  } catch (err) {
    console.error('[ProjectsLoader] Failed to init projects:', err);
  }
}

function renderFilters() {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  // Extract unique tags
  const tagsSet = new Set();
  allProjects.forEach(p => {
    p.tags.forEach(t => tagsSet.add(t.name));
  });
  const tags = Array.from(tagsSet).sort();

  // Create filter container
  let filterContainer = document.getElementById('projects-filter-container');
  if (!filterContainer) {
    filterContainer = document.createElement('div');
    filterContainer.id = 'projects-filter-container';
    filterContainer.style = 'margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; align-items: center;';
    
    // Create Search Bar
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search Projects...';
    searchInput.className = 'admin-input'; // Borrowing styling if available, or just basic styling
    searchInput.style = 'padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; margin-right: 1rem;';
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
    filterContainer.appendChild(searchInput);

    container.parentNode.insertBefore(filterContainer, container);
  } else {
    filterContainer.innerHTML = ''; // clear existing tags if re-rendering
  }

  // Create 'All' tag
  const allBtn = createTagButton('All', activeTag === 'All');
  allBtn.addEventListener('click', () => handleTagClick('All'));
  filterContainer.appendChild(allBtn);

  // Create tag buttons
  tags.forEach(tag => {
    const btn = createTagButton(tag, activeTag === tag);
    btn.addEventListener('click', () => handleTagClick(tag));
    filterContainer.appendChild(btn);
  });
}

function createTagButton(tag, isActive) {
  const btn = document.createElement('button');
  btn.innerText = tag;
  btn.className = 'glass-badge'; // reuse existing badge style
  btn.style.cursor = 'pointer';
  btn.style.border = 'none';
  if (isActive) {
    btn.style.background = 'rgba(255,255,255,0.2)'; // active state
    btn.style.color = '#fff';
  } else {
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.color = 'var(--text-muted)';
  }
  return btn;
}

function handleTagClick(tag) {
  activeTag = tag;
  renderFilters(); // Re-render to update active state
  filterProjects();
}

let currentSearchTerm = '';
function handleSearch(term) {
  currentSearchTerm = term.toLowerCase();
  filterProjects();
}

function filterProjects() {
  let filtered = allProjects;

  if (activeTag !== 'All') {
    filtered = filtered.filter(p => p.tags.some(t => t.name === activeTag));
  }

  if (currentSearchTerm) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(currentSearchTerm) ||
      p.short_description.toLowerCase().includes(currentSearchTerm) ||
      p.tags.some(t => t.name.toLowerCase().includes(currentSearchTerm))
    );
  }

  renderProjects(filtered);
}

function renderProjects(projects) {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  container.innerHTML = ''; // Clear existing

  if (projects.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center; width:100%;">No projects found.</p>';
    return;
  }

  projects.forEach(p => {
    const card = document.createElement('a');
    card.href = `/project/${p.slug}`;
    card.className = 'premium-card';
    card.setAttribute('data-tilt', '');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.display = 'block';
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';
    
    if (p.cover_media && p.cover_media.url) {
      card.style.backgroundImage = `url('${p.cover_media.url}')`;
    }

    // Use the first tag as the badge if available
    const primaryTag = p.tags.length > 0 ? p.tags[0].name : 'Project';

    card.innerHTML = `
      <div class="premium-overlay"></div>
      <div class="premium-content">
          <div class="premium-top">
              <span class="glass-badge">${primaryTag}</span>
          </div>
          <div class="premium-bottom">
              <h3 class="premium-title" style="font-size: clamp(1.8rem, 3vw, 2.5rem);">${p.title}</h3>
              <p class="premium-subtitle">${p.short_description || ''}</p>
          </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      openDynamicProjectModal(p.slug);
    });
    container.appendChild(card);
  });
}

// Ensure openModal and closeModal are defined globally or we define our own dynamic modal handler
async function openDynamicProjectModal(slug) {
  const modalContainer = document.getElementById('dynamic-project-modal');
  if (!modalContainer) {
    console.error('[ProjectsLoader] #dynamic-project-modal container not found');
    return;
  }

  // Show loading state
  modalContainer.innerHTML = `
    <div class="modal-header">
        <button class="close-modal" onclick="closeModal()" aria-label="Close">×</button>
    </div>
    <div class="modal-content" style="padding: 4rem; text-align: center;">
        <p>Loading project details...</p>
    </div>
  `;
  
  // Need to call existing openModal logic to show the overlay and container
  if (typeof window.openModal === 'function') {
    window.openModal('dynamic-project-modal');
  } else {
    // Fallback if openModal is not global
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('active');
    modalContainer.classList.add('active');
  }

  // Update URL for deep linking
  window.history.pushState({ modal: 'project', slug }, '', `/project/${slug}`);

  // Import dynamically to avoid circular dependency at top level
  import('./seoManager.js').then(module => module.updateCanonicalUrl(window.location.href));

  try {
    const projectDetails = await publicProjectService.getProjectBySlug(slug);
    if (!projectDetails) throw new Error('Project not found');

    const tagsHtml = projectDetails.tags.map(t => `<span class="tech-badge">${t.name}</span>`).join('');
    
    let coverStyle = '';
    if (projectDetails.cover_media && projectDetails.cover_media.url) {
      coverStyle = `background-image: url('${projectDetails.cover_media.url}'); background-size: cover; background-position: center;`;
    }

    let galleryHtml = '';
    if (projectDetails.gallery && projectDetails.gallery.length > 0) {
      galleryHtml = `
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Gallery</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          ${projectDetails.gallery.map(g => `<img src="${g.url}" alt="${g.alt_text || projectDetails.title}" style="width: 100%; border-radius: 8px; object-fit: cover; aspect-ratio: 16/9;" />`).join('')}
        </div>
      `;
    }

    modalContainer.innerHTML = `
      <div class="modal-header">
          <button class="close-modal" onclick="closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-content">
          <div class="modal-hero" style="${coverStyle}">
              ${projectDetails.status === 'published' ? '<span class="status-badge status-completed">Published</span>' : ''}
              <h1>${projectDetails.title}</h1>
              <div class="modal-links mt-md">
                  ${projectDetails.github_url ? `<a href="${projectDetails.github_url}" target="_blank" class="btn-outline">GitHub</a>` : ''}
                  ${projectDetails.project_url ? `<a href="${projectDetails.project_url}" target="_blank" class="btn-outline">Live Demo</a>` : ''}
              </div>
          </div>
          <div class="modal-body">
              <div class="tags mb-md">
                  ${tagsHtml}
              </div>
              
              <div class="rich-text-content">
                ${projectDetails.full_description || '<p>No description available.</p>'}
              </div>

              ${galleryHtml}
          </div>
      </div>
    `;

  } catch (err) {
    console.error('[ProjectsLoader] Error loading project modal:', err);
    modalContainer.innerHTML = `
      <div class="modal-header">
          <button class="close-modal" onclick="closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-content" style="padding: 4rem; text-align: center;">
          <p style="color: #ff3333;">Failed to load project details.</p>
      </div>
    `;
  }
}
