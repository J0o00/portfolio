import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Adding sample experience data...");

  const experiences = [
    {
      role_title: "Industrial Automation Engineer Intern",
      organization: "Siemens COE, Anna University",
      type: "Work",
      start_date: "2025-06-01",
      end_date: "2025-07-31",
      is_current: false,
      summary: "Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.",
      status: "published",
      display_order: 10,
      featured: true,
      featured_order: 1
    },
    {
      role_title: "Technical Liaison Intern",
      organization: "White Matrix Software Solutions",
      type: "Work",
      start_date: "2026-01-01",
      is_current: true,
      summary: "Bridged client requirements and development execution. Authored structured technical documentation, requirement specifications, and facilitated cross-team communication to maintain delivery accuracy.",
      status: "published",
      display_order: 20,
      featured: true,
      featured_order: 2
    },
    {
      role_title: "Winner & Best Pitch",
      organization: "BeachHack H4C National Hackathon",
      type: "Award",
      start_date: "2025-01-01",
      is_current: false,
      summary: "1st place from a competitive field for an AI-driven hardware solution. Also awarded 1st place at the Pitch Perfect Idea Competition and reached the finals of the Beach Hack AI Challenge.",
      status: "published",
      display_order: 30,
      featured: true,
      featured_order: 3
    },
    {
      role_title: "Certification",
      organization: "IIT Madras Pravartak — Intelligent Data Center Operations & Maintenance",
      type: "Certification",
      start_date: "2024-01-01",
      is_current: false,
      summary: "Completed certification covering intelligent infrastructure monitoring and O&M frameworks. NPTEL certified in Introduction to Machine Learning. Serving as Communication Head at Meta Hub.",
      status: "published",
      display_order: 40,
      featured: true,
      featured_order: 4
    }
  ];

  for (const exp of experiences) {
    const { data, error } = await supabase
      .from('experience')
      .insert([exp])
      .select();
      
    if (error) {
      console.error(`Error adding ${exp.role_title}:`, error);
    } else {
      console.log(`Added: ${exp.role_title}`);
    }
  }

  console.log("Done.");
}

main();
