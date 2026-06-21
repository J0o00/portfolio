import { publicResearchService } from './services/publicResearchService.js';

let allResearch = [];
let activeType = 'All';
let activeTag = null; // null means no tag selected
let currentSearchTerm = '';

export async function initResearch() {
  const container = document.getElementById('research-grid');
  if (!container) return;

  try {
    allResearch = await publicResearchService.getPublishedResearch();
    renderFilters();
    filterResearch();

    // Auto-open if deep linked
    const urlParams = new URLSearchParams(window.location.search);
    const researchSlug = urlParams.get('research') || 
                         (window.__PRELOADED_CONTENT__?.type === 'research' ? window.__PRELOADED_CONTENT__.slug : null);
                         
    if (researchSlug) {
      setTimeout(() => openDynamicResearchModal(researchSlug), 500);
    }
  } catch (err) {
    console.error('[ResearchLoader] Failed to init research:', err);
  }
}

function renderFilters() {
  const container = document.getElementById('research-grid');
  if (!container) return;

  // Extract unique tags
  const tagsSet = new Set();
  allResearch.forEach(r => {
    r.tags.forEach(t => tagsSet.add(t.name));
  });
  const tags = Array.from(tagsSet).sort();

  const types = ['All', 'Investigation', 'Publication', 'Patent', 'Conference'];

  // Create filter container
  let filterContainer = document.getElementById('research-filter-container');
  if (!filterContainer) {
    filterContainer = document.createElement('div');
    filterContainer.id = 'research-filter-container';
    filterContainer.style = 'margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center;';
    container.parentNode.insertBefore(filterContainer, container);
  } else {
    filterContainer.innerHTML = ''; 
  }

  // Top row: Search and Types
  const topRow = document.createElement('div');
  topRow.style = 'display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; align-items: center; width: 100%;';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search Research...';
  searchInput.className = 'admin-input';
  searchInput.style = 'padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; margin-right: 1rem; min-width: 200px;';
  searchInput.value = currentSearchTerm;
  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });
  topRow.appendChild(searchInput);

  types.forEach(type => {
    const btn = createFilterButton(type, activeType === type);
    btn.addEventListener('click', () => handleTypeClick(type));
    topRow.appendChild(btn);
  });
  filterContainer.appendChild(topRow);

  // Bottom row: Tags
  if (tags.length > 0) {
    const bottomRow = document.createElement('div');
    bottomRow.style = 'display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; align-items: center; width: 100%; margin-top: 0.5rem;';
    
    tags.forEach(tag => {
      const btn = createFilterButton(tag, activeTag === tag);
      btn.addEventListener('click', () => handleTagClick(tag));
      bottomRow.appendChild(btn);
    });
    filterContainer.appendChild(bottomRow);
  }
}

function createFilterButton(label, isActive) {
  const btn = document.createElement('button');
  btn.innerText = label;
  btn.className = 'glass-badge';
  btn.style.cursor = 'pointer';
  btn.style.border = 'none';
  if (isActive) {
    btn.style.background = 'rgba(255,255,255,0.2)'; 
    btn.style.color = '#fff';
  } else {
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.color = 'var(--text-muted)';
  }
  return btn;
}

function handleTypeClick(type) {
  activeType = type;
  renderFilters();
  filterResearch();
}

function handleTagClick(tag) {
  activeTag = activeTag === tag ? null : tag; // Toggle tag
  renderFilters();
  filterResearch();
}

function handleSearch(term) {
  currentSearchTerm = term.toLowerCase();
  filterResearch();
}

function filterResearch() {
  let filtered = allResearch;

  if (activeType !== 'All') {
    filtered = filtered.filter(r => r.type === activeType);
  }

  if (activeTag) {
    filtered = filtered.filter(r => r.tags.some(t => t.name === activeTag));
  }

  if (currentSearchTerm) {
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(currentSearchTerm) ||
      (r.abstract && r.abstract.toLowerCase().includes(currentSearchTerm)) ||
      r.tags.some(t => t.name.toLowerCase().includes(currentSearchTerm))
    );
  }

  renderResearchCards(filtered);
}

function renderResearchCards(researchItems) {
  const container = document.getElementById('research-grid');
  if (!container) return;

  container.innerHTML = ''; 

  if (researchItems.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center; width:100%; padding: 2rem;">No published research available yet.</p>';
    return;
  }

  researchItems.forEach(r => {
    const card = document.createElement('a');
    card.href = `/research/${r.slug}`;
    card.className = 'research-notebook-card premium-card'; // keeping premium-card styles
    card.setAttribute('data-tilt', '');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.display = 'block';
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';
    
    if (r.cover_media && r.cover_media.url) {
      card.style.backgroundImage = `url('${r.cover_media.url}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }

    const typeBadge = r.type || 'Investigation';
    const publishedDate = r.published_date ? new Date(r.published_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const tagsString = r.tags.map(t => t.name).join(' • ');

    // Truncate abstract
    let abstractText = r.abstract || '';
    if (abstractText.length > 100) abstractText = abstractText.substring(0, 100) + '...';

    card.innerHTML = `
      <div class="premium-overlay"></div>
      <div class="premium-content" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div class="premium-top">
              <span class="glass-badge">${typeBadge}</span>
          </div>
          <div class="premium-bottom" style="margin-top: auto;">
              <h4 class="premium-title">${r.title}</h4>
              ${abstractText ? `<p class="premium-subtitle" style="font-size: 0.9rem; margin-top: 0.5rem; line-height: 1.4;">${abstractText}</p>` : ''}
              <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted);">
                  <span>${tagsString}</span>
                  <span>${publishedDate}</span>
              </div>
          </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      openDynamicResearchModal(r.slug);
    });
    container.appendChild(card);
  });
}

window.openDynamicResearchModal = async function(slug) {
  const modalContainer = document.getElementById('dynamic-research-modal');
  if (!modalContainer) {
    console.error('[ResearchLoader] #dynamic-research-modal container not found');
    return;
  }

  // Show loading
  modalContainer.innerHTML = `
    <div class="modal-header">
        <button class="close-modal" onclick="closeModal()" aria-label="Close">×</button>
    </div>
    <div class="modal-content" style="padding: 4rem; text-align: center;">
        <p>Loading research details...</p>
    </div>
  `;
  
  if (typeof window.openModal === 'function') {
    window.openModal('dynamic-research-modal');
  } else {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('active');
    modalContainer.classList.add('active');
  }

  // Update URL for deep linking
  window.history.pushState({ modal: 'research', slug }, '', `/research/${slug}`);

  // Import dynamically to avoid circular dependency
  import('./seoManager.js').then(module => module.updateCanonicalUrl(window.location.href));

  try {
    const details = await publicResearchService.getResearchBySlug(slug);
    if (!details) throw new Error('Research not found');

    const tagsHtml = details.tags.map(t => `<span class="tech-badge">${t.name}</span>`).join('');
    
    let coverStyle = '';
    if (details.cover_media && details.cover_media.url) {
      coverStyle = `background-image: linear-gradient(to bottom, rgba(0,0,0,0.2), var(--bg-surface)), url('${details.cover_media.url}'); background-size: cover; background-position: center;`;
    }

    const publishedDate = details.published_date ? new Date(details.published_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
    const statusBadge = details.is_ongoing ? '<span class="status-badge" style="background: rgba(243, 156, 18, 0.2); color: #f39c12; border: 1px solid rgba(243, 156, 18, 0.5);">Status: Ongoing</span>' : '';

    modalContainer.innerHTML = `
      <div class="modal-header">
          <button class="close-modal" onclick="closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-content">
          <div class="modal-hero" style="${coverStyle}">
              ${statusBadge}
              <span class="glass-badge" style="margin-bottom: 1rem; display: inline-block;">${details.type || 'Investigation'}</span>
              <h1>${details.title}</h1>
              <div style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem; display: flex; flex-wrap: wrap; gap: 1rem;">
                  ${details.authors ? `<span><strong>Authors:</strong> ${details.authors}</span>` : ''}
                  ${details.venue ? `<span><strong>Venue:</strong> ${details.venue}</span>` : ''}
                  ${details.reference_number ? `<span><strong>Ref:</strong> ${details.reference_number}</span>` : ''}
                  ${publishedDate ? `<span><strong>Date:</strong> ${publishedDate}</span>` : ''}
              </div>
              <div class="modal-links mt-md">
                  ${details.url ? `<a href="${details.url}" target="_blank" class="btn-outline">External Link</a>` : ''}
              </div>
          </div>
          <div class="modal-body">
              <div class="tags mb-md">
                  ${tagsHtml}
              </div>
              
              ${details.abstract ? `
              <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border-left: 3px solid var(--accent);">
                  <h4 style="margin-top: 0; margin-bottom: 0.5rem;">Abstract</h4>
                  <p style="margin: 0; font-size: 0.95rem; line-height: 1.6;">${details.abstract}</p>
              </div>
              ` : ''}
              
              <div class="rich-text-content">
                ${details.content || ''}
              </div>

              ${(details.research_status || details.next_steps) ? `
              <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                  ${details.research_status ? `<h4 style="margin-bottom: 0.5rem;">Current Status</h4><p>${details.research_status}</p>` : ''}
                  ${details.next_steps ? `<h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Next Steps</h4><p>${details.next_steps}</p>` : ''}
              </div>
              ` : ''}
          </div>
      </div>
    `;

  } catch (err) {
    console.error('[ResearchLoader] Error loading research modal:', err);
    modalContainer.innerHTML = `
      <div class="modal-header">
          <button class="close-modal" onclick="closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-content" style="padding: 4rem; text-align: center;">
          <p style="color: #ff3333;">Failed to load research details.</p>
      </div>
    `;
  }
};
