import { publicProjectService } from './services/publicProjectService.js';
import { publicResearchService } from './services/publicResearchService.js';

export async function initSEO() {
  injectPersonSchema();
  await injectContentSchemas();
}

function injectPersonSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Jovial Joyson",
    "url": "https://jovialjoyson.com",
    "jobTitle": "EEE Engineer",
    "description": "B.Tech EEE student specialising in power electronics, embedded control, industrial automation, and digital twin systems.",
    "knowsAbout": ["Power Electronics", "Embedded Systems", "Digital Twins", "Industrial Automation"],
    "sameAs": [
      "https://github.com/jovialjoyson",
      "https://linkedin.com/in/jovialjoyson" // Placeholder URLs to be updated in CMS later
    ]
  };
  appendJsonLd(schema, 'seo-person');
}

async function injectContentSchemas() {
  try {
    const projects = await publicProjectService.getPublishedProjects();
    const research = await publicResearchService.getPublishedResearch();

    // Inject Projects
    const projectSchemas = projects.map(p => ({
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      "name": p.title,
      "description": p.short_description || p.title,
      "url": `https://jovialjoyson.com/?project=${p.slug}`,
      "author": {
        "@type": "Person",
        "name": "Jovial Joyson"
      },
      "datePublished": p.updated_at
    }));

    if (projectSchemas.length > 0) {
      appendJsonLd(projectSchemas, 'seo-projects');
    }

    // Inject Research
    const researchSchemas = research.map(r => {
      let schemaType = "CreativeWork";
      if (r.type === 'Publication' || r.type === 'Conference') schemaType = "ScholarlyArticle";
      else if (r.type === 'Patent') schemaType = "Patent";

      return {
        "@context": "https://schema.org",
        "@type": schemaType,
        "name": r.title,
        "description": r.abstract || r.title,
        "url": `https://jovialjoyson.com/?research=${r.slug}`,
        "author": {
          "@type": "Person",
          "name": r.authors || "Jovial Joyson"
        },
        "datePublished": r.published_date || r.updated_at
      };
    });

    if (researchSchemas.length > 0) {
      appendJsonLd(researchSchemas, 'seo-research');
    }

  } catch (err) {
    console.error("[SEO Manager] Failed to inject content schemas", err);
  }
}

function appendJsonLd(data, id) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function updateCanonicalUrl(url) {
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}
