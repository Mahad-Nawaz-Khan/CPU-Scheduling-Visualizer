export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Process',
    definition: 'A program that is running or waiting to run. In this app they are named P1, P2, P3, and so on.',
  },
  {
    term: 'CPU',
    definition:
      'The processor that actually does the work. This simulator models a single CPU core, so only one process can run at a time.',
  },
  {
    term: 'Scheduler',
    definition: 'The part of the operating system that decides which waiting process gets the CPU next.',
  },
  {
    term: 'Arrival time (AT)',
    definition: 'The moment a process shows up and starts waiting for the CPU.',
  },
  {
    term: 'Burst time (BT)',
    definition: 'How much CPU time a process needs in total to finish its work.',
  },
  {
    term: 'Priority',
    definition: 'How urgent a process is. Here, a smaller number means more urgent, so 1 is the most urgent.',
  },
  {
    term: 'Ready queue',
    definition: 'The line of processes that have arrived and are waiting for their turn on the CPU.',
  },
  {
    term: 'Preemption',
    definition:
      'When the scheduler interrupts a running process to give the CPU to another one. The interrupted process continues later.',
  },
  {
    term: 'Time quantum',
    definition:
      'In Round Robin, the longest a process may run before it has to hand the CPU to the next process in line.',
  },
  {
    term: 'Gantt chart',
    definition: 'A timeline that shows which process was using the CPU at every moment.',
  },
  {
    term: 'Completion time (CT)',
    definition: 'The moment a process finishes all of its work.',
  },
  {
    term: 'Turnaround time (TAT)',
    definition: 'The total time from arriving to finishing: CT − AT.',
  },
  {
    term: 'Waiting time (WT)',
    definition: 'The time spent waiting in line instead of running: TAT − BT.',
  },
  {
    term: 'Response time (RT)',
    definition: 'The time from arriving until the process gets the CPU for the first time.',
  },
];
