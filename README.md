# CPU Scheduling Visualizer

An interactive, educational web-based Operating Systems CPU Scheduling Simulator built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**.

## Features

- **Six Complete OS Scheduling Algorithms** (implemented from scratch in pure TypeScript):
  - **FCFS** — First Come First Serve (Non-Preemptive)
  - **SJF** — Shortest Job First (Non-Preemptive)
  - **SRTF** — Shortest Remaining Time First (Preemptive)
  - **Priority (Non-Preemptive)** — Smaller priority integer = higher priority (`1` > `3`)
  - **Priority (Preemptive)** — Strict preemption on higher priority arrival
  - **Round Robin** — Preemptive FIFO ready queue with configurable Time Quantum `Q`
- **Animated Tick-by-Tick Simulation**: Play, Pause, Replay, Step Forward/Back, Speed control (`0.5x`–`4x`), and interactive timeline scrubber.
- **Educational OS State Inspection**: Live CPU core indicator, ordered Ready Queue, per-process Remaining Burst progress bars, and chronological Scheduler Decision Log.
- **6-Algorithm Comparison Dashboard**: Side-by-side mini Gantt timelines on a shared scale, Average Waiting & Turnaround bar charts, optimal badge, and ranked metrics table.
- **OS Textbook Presets & Random Generator**: Default Sample, Convoy Effect Demo, CPU Idle Gaps, Preemption Showcase, and Simultaneous Arrivals.
- **CSV Export & Light/Dark Theme**: Download single-run or 6-way comparison data as CSV.

## Project Structure

```text
├── app/
│   ├── globals.css          # Theme tokens and idle-stripe styling
│   ├── layout.tsx           # Root font & theme metadata
│   └── page.tsx             # Interactive dashboard state & layout
├── components/              # Modular UI & visualization components
├── lib/
│   ├── algorithms/          # Pure TypeScript schedulers (fcfs, sjf, srtf, priority, roundRobin)
│   ├── __tests__/           # Vitest unit test suite per algorithm & metrics
│   ├── constants.ts         # Algorithm metadata & accessible process colors
│   ├── csvExport.ts         # Single & comparison CSV exporters
│   ├── metrics.ts           # CT, TAT, WT, RT, utilization & throughput calculations
│   ├── presets.ts           # Textbook scenarios, randomizer, and sanitizers
│   └── types.ts             # Shared TypeScript interfaces
└── docs/
    └── ACADEMIC_REPORT.md   # Formulas, trace tables, test matrix & viva Q&A
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing & Verification

```bash
npm test            # Run all Vitest unit tests
npx tsc --noEmit    # TypeScript strict type check
npm run lint        # ESLint check
npm run build       # Production build
```
