/* ============================================================================
   PROJECT DATA  =  EDIT THIS FILE TO ADD YOUR LINKS
   ----------------------------------------------------------------------------
   Each project may define two link slots:

       repo : "#"     replace "#" with your repository URL
       demo : "#"     replace "#" with your demo or video URL

   A slot left as "#" (or omitted) renders no button at all, so the live site
   never shows a dead control. Paste a real URL in and the button appears.

   A `demo` pointing at a Google Drive file plays in a dialog on the page
   itself. The anchor still carries the Drive URL, so a middle-click, a
   modified click, or a visitor without JavaScript opens it in a new tab as
   a normal link.

   Example:
       repo : "https://your-host.example/fireroute",
       demo : "https://your-video-host.example/watch?v=XXXXXXXX",
   ========================================================================== */

const PROJECTS = [
  {
    title: "Project Heimdall, Counter-UAS Detection",
    icon: "radar",
    year: "2026",
    flag: "Early-stage startup",
    tags: ["robotics", "ml"],
    desc: "A sensor-agnostic software layer for counter-UAS detection over critical infrastructure. It ingests radar, RF, acoustic and EO/IR feeds through a common adapter schema, fuses them into one real-time air picture with gating plus global-nearest-neighbour association and per-track Kalman filters, then classifies each track as drone, bird or clutter. Detection only by design, so it stays inside civilian aviation and radio regulation, and every geofence breach produces a reconstructed trajectory and an exportable incident report.",
    /* Figures from the deterministic, seeded fusion benchmark (nominal noise,
       drone target). Shown as a stat strip on the card. */
    metrics: [
      { v: "98.9%", k: "Track completeness" },
      { v: "0",     k: "ID switches" },
      { v: "3.8 m", k: "Horizontal RMSE" }
    ],
    stack: ["Kalman Filtering", "Radar / RF", "EO/IR", "Track Fusion", "ML Classification", "Python"],
    note: "Company in formation",
    demo: "https://drive.google.com/file/d/17sTsCKPiyZ4FC_UB6kobVJWh66lpg9gZ/view?usp=sharing"
    /* no repo: proprietary */
  },
  {
    title: "FireRoute, Wildfire Routing Platform",
    icon: "flame",
    year: "2025",
    flag: "Award winner",
    tags: ["web"],
    desc: "A React Native and Expo mobile app with Mapbox GL JS that routes users between destinations, live fire locations and safe havens uploaded by civilians and first responders. A Node.js and Express backend on MongoDB keeps fire and haven data synchronised across every user in real time.",
    stack: ["React Native", "Expo", "Mapbox GL", "Node.js", "Express", "MongoDB"],
    repo: "#",   // TODO: repository link
    demo: "https://drive.google.com/file/d/1aUDxOnGB05-K4Z04NY0BW4j87UNx-bFc/view?usp=sharing"
  },
  {
    title: "Audio to Piano MIDI Transcription Network",
    icon: "wave",
    year: "2025",
    flag: "82.5% accuracy",
    tags: ["ml", "web"],
    desc: "An end-to-end deep-learning system for automatic piano transcription built on a novel CRNN (CNN plus BiLSTM), reaching 82.5% accuracy on the MAESTRO test set with CUDA-optimised training. Data pipelines cover more than 200 hours with augmentation, deployed as a full-stack web app for audio and YouTube transcription.",
    stack: ["PyTorch", "TensorFlow", "CRNN", "BiLSTM", "CUDA", "Full-stack"],
    repo: "#"    // TODO: repository link. No demo recording for this one.
  },
  {
    title: "GIS Engine from OpenStreetMap Data",
    icon: "map",
    year: "2025",
    flag: "C++",
    tags: ["systems"],
    desc: "An accessible geographic information system with advanced pathfinding and hand-tuned data structures for optimal loading, panning and zooming. Written in C++ with OOP, external APIs and parallel programming, plus parking-lot re-routing, dark mode and partial-name search.",
    stack: ["C++", "Pathfinding", "OOP", "Parallelism", "OSM APIs"],
    repo: "#"    // TODO: repository link. No demo recording for this one.
  },
  {
    title: "Sudoku on the Altera DE1-SoC",
    icon: "grid",
    year: "2024",
    flag: "FPGA",
    tags: ["systems", "hardware"],
    desc: "A complete Sudoku game written in C on the DE1-SoC FPGA, driving a RISC-V system with processor interrupts for seamless mouse movement and keyboard handling. A double-buffered VGA display gives tear-free rendering over an interrupt-driven architecture with optimised memory mapping.",
    stack: ["C", "DE1-SoC", "RISC-V", "Interrupts", "VGA", "Double Buffer"],
    repo: "#",   // TODO: repository link
    demo: "https://drive.google.com/file/d/1r6vlT4VpsEdBMlQSPp_G6xR2SIYj08sa/view?usp=sharing"
  },
  {
    title: "Verilog Beatmaker on the DE1-SoC",
    icon: "sliders",
    year: "2024",
    flag: "Pure Verilog",
    tags: ["hardware"],
    desc: "An analog-style beatmaker implemented entirely in Verilog on a DE1-SoC FPGA, using DRAM for audio storage and a VGA display for sample selection. Includes a microphone-backed karaoke mode with real-time audio processing and direct hardware control.",
    stack: ["Verilog", "DE1-SoC", "DRAM", "VGA", "DSP", "ModelSim"],
    repo: "#",   // TODO: repository link
    demo: "https://drive.google.com/file/d/18oPMcl59gB2sJFM-4yONkDsiH62oYdiu/view?usp=sharing"
  },
  {
    title: "CEC Championship Builds",
    icon: "trophy",
    year: "2025, 2026",
    flag: "National 1st",
    tags: ["web", "ml"],
    desc: "The solutions behind the competition run: an AWS-hosted interplanetary navigation system, and an augmented-reality defect-inspection platform built on Unity, React and DynamoDB. Both were engineered under hard time limits.",
    stack: ["AWS", "DynamoDB", "Unity", "AR", "React", "Cloud"],
    repo: "#",   // TODO: repository link
    demo: "https://drive.google.com/file/d/1JHzZBSm-gH57M1pSooG-IyAEvYWomVsE/view?usp=sharing"
  }
];

/* Filter chips shown above the grid. `key` must match a value in a project's
   `tags` array. "all" is special and shows everything. */
const PROJECT_FILTERS = [
  { key: "all",      label: "All" },
  { key: "robotics", label: "Robotics" },
  { key: "ml",       label: "AI / ML" },
  { key: "systems",  label: "Systems" },
  { key: "hardware", label: "Hardware" },
  { key: "web",      label: "Full-stack" }
];

/* ---------- Skills ---------- */
const SKILL_BARS = [
  { name: "Python, PyTorch, TensorFlow", value: 95 },
  { name: "C, C++, SystemC",             value: 92 },
  { name: "ROS2, PX4, Robotics Stack",   value: 88 },
  { name: "Verilog, FPGA, RTL",          value: 85 },
  { name: "JavaScript, React, Node.js",  value: 82 },
  { name: "AWS, Docker, CI/CD",          value: 80 }
];

const SKILL_CATS = [
  {
    title: "AI / ML & Cloud",
    items: ["PyTorch", "TensorFlow", "LLM Prompt Engineering", "NLP Transformers", "OpenCV", "YOLOv8", "AWS", "DynamoDB", "CUDA"]
  },
  {
    title: "Languages",
    items: ["Python", "C", "C++", "Verilog", "SQL", "R", "Java", "JavaScript", "Node.js", "React", "MATLAB"]
  },
  {
    title: "Robotics & Embedded",
    items: ["ROS2", "PX4", "Gazebo", "uXRCE-DDS", "Jetson Orin", "LiDAR", "Kalman Filtering", "SystemC / TLM", "DE1-SoC"]
  },
  {
    title: "Tools & Workflow",
    items: ["Docker", "Git", "Linux / Ubuntu", "VS Code", "Eclipse", "Jupyter", "ModelSim", "Simulink", "Agile"]
  }
];

/* ---------- Hero role rotator ---------- */
const ROLES = [
  "Computer Engineering @ University of Toronto",
  "Firmware Developer Intern @ Qualcomm",
  "Autonomous Drone Software Developer @ UTAT",
  "Machine Learning & LLM Researcher @ DLSPH",
  "National Programming Champion, CEC 2026"
];
