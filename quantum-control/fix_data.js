import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  } else if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  } else if (!supabaseKey && line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating Projects...");
  // 1. Digital Twin Motor -> Industrial Control Systems text
  const { data: projects } = await supabase.from('projects').select('*');
  
  const digitalTwin = projects.find(p => p.title.toLowerCase().includes('digital twin'));
  if (digitalTwin) {
    console.log(`Found project: ${digitalTwin.title}`);
    await supabase.from('projects').update({
      short_description: 'TIA Portal • PLC • SCADA',
      full_description: '<p>Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.</p>'
    }).eq('id', digitalTwin.id);
  }

  // 2. eBAJA EV
  const ebaja = projects.find(p => p.title.toLowerCase().includes('ebaja') || p.title.toLowerCase().includes('energy management'));
  if (ebaja) {
    console.log(`Found project: ${ebaja.title}`);
    await supabase.from('projects').update({
      short_description: 'BMS • Simulation • Integration',
      full_description: '<p>Engineered a complete Battery Management System for an electric all-terrain vehicle. Validated cell balancing algorithms in MATLAB before physical assembly.</p>'
    }).eq('id', ebaja.id);
  }

  // 3. Autonomous Detection
  const deterrent = projects.find(p => p.title.toLowerCase().includes('autonomous') || p.title.toLowerCase().includes('deterrent'));
  if (deterrent) {
    console.log(`Found project: ${deterrent.title}`);
    await supabase.from('projects').update({
      short_description: 'Computer Vision • Raspberry Pi',
      full_description: '<p>Created an AI-powered field monitoring system using OpenCV and Raspberry Pi to detect unauthorized access and trigger automated deterrence mechanisms in real-time.</p>'
    }).eq('id', deterrent.id);
  }

  console.log("Updating Experience...");
  const { data: experiences } = await supabase.from('experience').select('*');
  
  const siemens = experiences.find(e => e.role_title.toLowerCase().includes('siemens') || (e.organization && e.organization.toLowerCase().includes('siemens')));
  if (siemens) {
    console.log(`Found experience: ${siemens.role_title}`);
    await supabase.from('experience').update({
      summary: 'Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.'
    }).eq('id', siemens.id);
  }

  console.log("Done");
}

run();
