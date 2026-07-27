import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Adding Context-Aware Digital Triplet System Patent...");

  const patent = {
    title: "Context-Aware Digital Triplet System",
    slug: "context-aware-digital-triplet-system",
    type: "Patent",
    status: "published",
    research_status: "Filed",
    reference_number: "202641051670",
    abstract: 'A three-layer "triplet" architecture that closes the loop between physical state, virtual model, and real-time control. Eliminates the read-only limitation of conventional digital twins by integrating direct actuation pathways — preempting thermal runaway in heavy industrial drives and EV powertrains before failure occurs.',
    content: "<h3>Architecture Flow</h3><p>Sensors (Physical layer) -> Digital Twin Layer -> AI & Analytics Layer</p>",
    featured: true,
    featured_order: 1
  };

  const { data, error } = await supabase
    .from('research')
    .insert([patent])
    .select();
    
  if (error) {
    console.error(`Error adding patent:`, error);
  } else {
    console.log(`Added: ${data[0].title}`);
    
    // Attempt to add tags
    const tags = ['Digital Twin', 'Cyber-Physical', 'Industrial IoT'];
    const researchId = data[0].id;
    
    for (const tagName of tags) {
      const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Upsert tag
      let tagId;
      const { data: existingTag } = await supabase.from('research_tags').select('id').eq('slug', slug).single();
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: tagErr } = await supabase.from('research_tags').insert({ name: tagName, slug }).select().single();
        if (newTag) tagId = newTag.id;
      }
      
      if (tagId) {
        await supabase.from('research_tag_links').insert({ research_id: researchId, tag_id: tagId });
      }
    }
    console.log("Tags linked.");
  }
}

main();
