# CPU Scheduling Visualizer — Academic Report

**Course:** Operating Systems (4th Semester)  
**Project Type:** Interactive Web-Based Educational Simulator  
**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vitest

---

## 1. Project Overview & Educational Objectives

CPU scheduling is one of the core responsibilities of an operating system kernel: deciding which ready process in memory receives CPU time and for how long. Students often struggle to bridge the gap between static textbook formulas and dynamic OS behavior such as **preemption**, **convoy effects**, **starvation**, and **ready-queue ordering**.

This project builds a fully client-side **CPU Scheduling Visualizer** that models six fundamental CPU scheduling algorithms tick-by-tick (`t = 0` to `makespan`):

1. **First Come First Serve (FCFS)** — Non-Preemptive
2. **Shortest Job First (SJF)** — Non-Preemptive
3. **Shortest Remaining Time First (SRTF)** — Preemptive
4. **Priority Scheduling (Non-Preemptive)** — Smaller integer = Higher priority (`1 > 3`)
5. **Priority Scheduling (Preemptive)** — Smaller integer = Higher priority (`1 > 3`)
6. **Round Robin (RR)** — Preemptive with configurable Time Quantum `Q`

Rather than acting solely as a numeric calculator, the simulator displays:
- An **interactive, progressive Gantt Chart** showing exact start/end times, `IDLE` gaps, and preemption points.
- A **Live CPU Core & Ordered Ready Queue** synchronized to any clock tick `t`.
- **Per-process Remaining Burst Progress Bars** and a **Scheduler Decision Log** explaining *why* each scheduling decision occurred.
- A **6-Algorithm Comparison View** running all six algorithms on the same workload simultaneously.

---

## 2. Three-Layer System Architecture

The codebase separates presentation, OS scheduling logic, and performance analytics into three cleanly decoupled layers:

```text
+-------------------------------------------------------------------+
| Layer 1: User Interface & Interactive Controls (app/, components/)|
|   - Progressive disclosure: strategy pills, timeline + narration |
|   - Expandable detail: ProcessEditor, NowExplainer, all numbers  |
|   - CompareView & LearnView (secondary tabs)                     |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| Layer 2: Pure TypeScript Scheduling Engine (lib/algorithms/)      |
|   - fcfs.ts, sjf.ts, srtf.ts, priority.ts, roundRobin.ts          |
|   - Produces TimelineSegment[] + TickSnapshot[] (t = 0..makespan) |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| Layer 3: Performance Metrics & Export (lib/metrics.ts, csvExport) |
|   - Computes CT, TAT, WT, RT, CPU Utilization, Throughput         |
|   - Generates single-run and 6-way comparison CSV reports         |
+-------------------------------------------------------------------+
```

Because all scheduling algorithms are implemented from scratch in pure TypeScript without external scheduling packages, every decision rule can be inspected, unit-tested independently, and demonstrated directly during evaluation.

---

## 3. Preemptive vs Non-Preemptive Scheduling

| Dimension | Non-Preemptive Scheduling | Preemptive Scheduling |
| :--- | :--- | :--- |
| **CPU Release** | Process keeps the CPU until its burst finishes or it blocks. | Scheduler may interrupt a running process at any clock tick. |
| **Algorithms** | FCFS, SJF, Priority (Non-Preemptive) | SRTF, Priority (Preemptive), Round Robin |
| **Context Switches** | Minimal (only at completion or idle boundaries). | Higher (occurs on preemption or quantum expiry). |
| **Responsiveness** | Short or urgent arrivals must wait behind the active process. | Urgent or short arrivals gain CPU quickly. |
| **Main Risk** | Convoy Effect (FCFS) or delayed urgent tasks. | Starvation of low-priority/long jobs (unless aging is used) and switching overhead. |

---

## 4. Working Principles & Tie-Breaking Rules

Across all six algorithms, discrete integer clock ticks (`AT >= 0`, `BT >= 1`, `Priority >= 1`, `Q >= 1`) and zero context-switch overhead are used so results match standard OS textbook traces:

1. **FCFS (`lib/algorithms/fcfs.ts`)**  
   - **Rule:** Selects the ready process with earliest `arrivalTime`.  
   - **Tie-breaker:** Lower PID order (`P1` before `P2`).
2. **SJF (`lib/algorithms/sjf.ts`)**  
   - **Rule:** Among processes with `arrivalTime <= t`, selects the one with smallest total `burstTime`.  
   - **Tie-breaker:** Earliest `arrivalTime`, then lower PID order.
3. **SRTF (`lib/algorithms/srtf.ts`)**  
   - **Rule:** At every tick `t`, selects the ready process with smallest `remaining` burst time.  
   - **Preemption Condition:** Strictly less (`candidate.remaining < running.remaining`). Equal remaining times do **not** trigger unnecessary preemption.
4. **Priority Non-Preemptive (`lib/algorithms/priority.ts`)**  
   - **Convention:** Smaller number = higher priority (`1` beats `3`).  
   - **Rule:** Selects highest-priority ready process when the CPU becomes free; runs to completion.
5. **Priority Preemptive (`lib/algorithms/priority.ts`)**  
   - **Convention:** Smaller number = higher priority (`1` beats `3`).  
   - **Preemption Condition:** Strictly higher priority (`candidate.priority < running.priority`). Equal priorities do **not** preempt.
6. **Round Robin (`lib/algorithms/roundRobin.ts`)**  
   - **Rule:** Maintains an explicit FIFO `readyQueue`. Each dispatched process runs for at most `Q` ticks.  
   - **Exact Tick-Boundary Ordering:** At tick `t`, newly arrived processes (`arrivalTime === t`) are enqueued **before** a quantum-expired process is pushed back to the tail of `readyQueue`.  
   - **Lone-Process Merging:** If a process reaches its quantum `Q` and `readyQueue` is empty, a `quantum` check event is logged and the process continues uninterrupted in a merged Gantt segment.

---

## 5. Mathematical Formulas

For each process $P_i$ with Arrival Time $AT_i$, Burst Time $BT_i$, First Start Time $ST_i$, and Completion Time $CT_i$:

- **Turnaround Time:**  
  $$TAT_i = CT_i - AT_i$$
- **Waiting Time:**  
  $$WT_i = TAT_i - BT_i$$
- **Response Time:**  
  $$RT_i = ST_i - AT_i$$
- **Average Waiting Time:**  
  $$\overline{WT} = \frac{1}{n} \sum_{i=1}^{n} WT_i$$
- **Average Turnaround Time:**  
  $$\overline{TAT} = \frac{1}{n} \sum_{i=1}^{n} TAT_i$$
- **CPU Utilization:**  
  $$\text{CPU Utilization} = \frac{\sum_{i=1}^{n} BT_i}{\text{Makespan}} \times 100\%$$
- **Throughput:**  
  $$\text{Throughput} = \frac{n}{\text{Makespan}}$$

---

## 6. Worked Trace Example (Default Sample)

**Input Workload:**
- `P1`: Arrival = `0`, Burst = `5`, Priority = `2`
- `P2`: Arrival = `1`, Burst = `3`, Priority = `1`
- `P3`: Arrival = `2`, Burst = `1`, Priority = `3`

### 6.1 FCFS Trace
- Gantt: `P1 [0–5] | P2 [5–8] | P3 [8–9]`
- `P1`: CT = 5, TAT = 5, WT = 0, RT = 0
- `P2`: CT = 8, TAT = 7, WT = 4, RT = 4
- `P3`: CT = 9, TAT = 7, WT = 6, RT = 6
- **Avg WT = 3.33**, **Avg TAT = 6.33**, **Avg RT = 3.33**

### 6.2 SJF (Non-Preemptive) Trace
- At `t = 0`, only `P1` is ready → runs `[0–5]`. At `t = 5`, `P2(BT=3)` and `P3(BT=1)` are ready → `P3` runs `[5–6]`, then `P2` runs `[6–9]`.
- Gantt: `P1 [0–5] | P3 [5–6] | P2 [6–9]`
- **Avg WT = 2.67**, **Avg TAT = 5.67**, **Avg RT = 2.67**

### 6.3 SRTF (Preemptive) Trace
- `P1` starts at `t=0`. At `t=1`, `P2(BT=3 < P1 rem=4)` preempts `P1`. At `t=2`, `P3(BT=1 < P2 rem=2)` preempts `P2`. `P3` finishes at `t=3`, `P2` resumes `[3–5]`, `P1` resumes `[5–9]`.
- Gantt: `P1 [0–1] | P2 [1–2] | P3 [2–3] | P2 [3–5] | P1 [5–9]`
- **Avg WT = 1.67**, **Avg TAT = 4.67**, **Avg RT = 1.00** (2 preemptions)

### 6.4 Priority (Non-Preemptive) Trace
- `P1` starts at `t=0` and completes `[0–5]`. At `t=5`, `P2(Pri=1)` beats `P3(Pri=3)` → `P2 [5–8]`, `P3 [8–9]`.
- **Avg WT = 3.33**, **Avg TAT = 6.33**

### 6.5 Priority (Preemptive) Trace
- `P1(Pri=2)` starts at `t=0`. At `t=1`, `P2(Pri=1 < 2)` preempts `P1` and runs `[1–4]`. `P1` resumes `[4–8]`, `P3` runs `[8–9]`.
- Gantt: `P1 [0–1] | P2 [1–4] | P1 [4–8] | P3 [8–9]`
- **Avg WT = 3.00**, **Avg TAT = 6.00**, **Avg RT = 2.00** (1 preemption)

### 6.6 Round Robin (Q = 2) Trace
- Gantt: `P1 [0–2] | P2 [2–4] | P3 [4–5] | P1 [5–7] | P2 [7–8] | P1 [8–9]`
- `P1`: CT = 9, TAT = 9, WT = 4, RT = 0
- `P2`: CT = 8, TAT = 7, WT = 4, RT = 1
- `P3`: CT = 5, TAT = 3, WT = 2, RT = 2
- **Avg WT = 3.33**, **Avg TAT = 6.33**, **Avg RT = 1.00**

---

## 7. Academic Verification Test Matrix

All automated unit tests reside in `lib/__tests__/` and run via `npm test` (Vitest):

| Test Case | Verified Requirement | Test File |
| :--- | :--- | :--- |
| Different Arrival Times | Processes never execute before `arrivalTime` | `sjf.test.ts`, `fcfs.test.ts` |
| Simultaneous Arrivals | Consistent `pidOrder` tie-breaking | `fcfs.test.ts`, `sjf.test.ts` |
| Strict Preemption Ties | Equal remaining/priority never triggers preemption | `srtf.test.ts`, `priority.test.ts` |
| Priority Convention | Smaller integer (`1`) beats larger (`3`) | `priority.test.ts` |
| Round Robin Queue Order | Arrivals at tick `t` enqueue before quantum-expired process | `roundRobin.test.ts` |
| Lone Process Merging | Contiguous lone RR slices merge while logging `quantum` event | `roundRobin.test.ts` |
| CPU Idle Intervals | Empty ready queue emits `IDLE` segments and lowers utilization | `fcfs.test.ts`, `srtf.test.ts` |
| Mathematical Invariants | `TAT = CT - AT`, `WT = TAT - BT`, `BT + Idle = Makespan` | `metrics.test.ts` |

---

## 8. Instructor Viva / Demonstration Q&A Guide

- **Q1: Why is `Priority 1` higher than `Priority 3`?**  
  *A:* It follows standard OS textbook conventions (e.g., Silberschatz) where priority rank 1 represents highest urgency.
- **Q2: Why does Round Robin give better Response Time than FCFS even when Average Waiting Time is similar?**  
  *A:* Every ready process gets an initial CPU slice within at most `(N - 1) * Q` ticks instead of waiting behind full bursts of earlier jobs.
- **Q3: How is the Convoy Effect demonstrated in the app?**  
  *A:* Select the **Convoy Effect Demo** preset (`P1` with burst `14` at `t=0`, followed by bursts `2, 1, 2`) and open **Compare All (6)** to observe FCFS waiting time spike compared to SJF/SRTF.
- **Q4: What happens if a new process arrives in SRTF with remaining burst equal to the currently running process?**  
  *A:* No preemption occurs (`candidate.remaining < running.remaining` is strict), avoiding pointless context-switch overhead.
