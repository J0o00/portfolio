import { supabase } from '../../../src/lib/supabase';

export async function restoreOldData() {
  console.log("Restoring old data...");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("No user found, cannot restore.");
    return;
  }

  // 1. Projects
  const { data: projects } = await supabase.from('projects').select('*');
  
  const digitalTwin = projects.find(p => p.title.toLowerCase().includes('digital twin'));
  if (digitalTwin) {
    await supabase.from('projects').update({
      short_description: 'TIA Portal • PLC • SCADA',
      full_description: '<p>Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.</p>'
    }).eq('id', digitalTwin.id);
    console.log("Updated Digital Twin");
  } else {
    await supabase.from('projects').insert([{
      title: 'Industrial Control Systems',
      slug: 'industrial-control-systems',
      short_description: 'TIA Portal • PLC • SCADA',
      full_description: '<p>Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.</p>',
      status: 'published',
      featured_order: 1,
      created_by: user.id
    }]);
    console.log("Inserted Industrial Control");
  }

  const ebaja = projects.find(p => p.title.toLowerCase().includes('ebaja') || p.title.toLowerCase().includes('energy management'));
  if (!ebaja) {
    await supabase.from('projects').insert([{
      title: 'Energy Management',
      slug: 'energy-management',
      short_description: 'BMS • Simulation • Integration',
      full_description: '<p>Engineered a complete Battery Management System for an electric all-terrain vehicle. Validated cell balancing algorithms in MATLAB before physical assembly.</p>',
      status: 'published',
      featured_order: 2,
      created_by: user.id
    }]);
    console.log("Inserted Energy Management");
  }

  const deterrent = projects.find(p => p.title.toLowerCase().includes('autonomous') || p.title.toLowerCase().includes('deterrent'));
  if (!deterrent) {
    await supabase.from('projects').insert([{
      title: 'Autonomous Detection',
      slug: 'autonomous-detection',
      short_description: 'Computer Vision • Raspberry Pi',
      full_description: '<p>Created an AI-powered field monitoring system using OpenCV and Raspberry Pi to detect unauthorized access and trigger automated deterrence mechanisms in real-time.</p>',
      status: 'published',
      featured_order: 3,
      created_by: user.id
    }]);
    console.log("Inserted Autonomous Detection");
  }

  // 2. Experience
  const { data: experiences } = await supabase.from('experience').select('*');
  
  const siemens = experiences.find(e => e.role_title.toLowerCase().includes('siemens') || (e.organization && e.organization.toLowerCase().includes('siemens')));
  if (siemens) {
    await supabase.from('experience').update({
      start_date: '2025-06-01',
      end_date: '2025-07-31',
      summary: 'Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.',
      type: 'Work',
      is_current: false
    }).eq('id', siemens.id);
    console.log("Updated Siemens Intern");
  } else {
    await supabase.from('experience').insert([{
      role_title: 'Industrial Automation Engineer Intern',
      organization: 'Siemens COE, Anna University',
      start_date: '2025-06-01',
      end_date: '2025-07-31',
      is_current: false,
      summary: 'Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.',
      status: 'published',
      type: 'Work',
      created_by: user.id
    }]);
    console.log("Inserted Siemens Intern");
  }

  const liaison = experiences.find(e => e.role_title.toLowerCase().includes('liaison'));
  if (!liaison) {
    await supabase.from('experience').insert([{
      role_title: 'Technical Liaison Intern',
      organization: 'White Matrix Software Solutions',
      start_date: '2026-01-01',
      is_current: true,
      summary: 'Bridged client requirements and development execution. Authored structured technical documentation, requirement specifications, and facilitated cross-team communication to maintain delivery accuracy.',
      status: 'published',
      type: 'Work',
      created_by: user.id
    }]);
    console.log("Inserted Technical Liaison");
  }

  const hackathon = experiences.find(e => e.role_title.toLowerCase().includes('hackathon'));
  if (!hackathon) {
    await supabase.from('experience').insert([{
      role_title: 'Winner & Best Pitch',
      organization: 'BeachHack H4C National Hackathon',
      start_date: '2025-01-01',
      end_date: '2025-01-01',
      is_current: false,
      summary: '1st place from a competitive field for an AI-driven hardware solution. Also awarded 1st place at the Pitch Perfect Idea Competition and reached the finals of the Beach Hack AI Challenge.',
      status: 'published',
      type: 'Achievement',
      created_by: user.id
    }]);
    console.log("Inserted Hackathon Winner");
  }
  
  console.log("Restore complete.");
}
