# Tempo: Lo-Fi Student Task & Study Hub

A unified daily to-do and focus workspace tailored for students. It bridges institutional coursework from Canvas LMS and schedule commitments from Google Calendar with manual offline tasks, day-goal target time tracking, an advanced study suite featuring customizable Pomodoro timers and alternative evidence-based study methods (Flowtime, 50/10 Ultradian, 90-min Deep Work, Feynman Technique, and Active Recall checks), and a soothing, customizable lo-fi pastel aesthetic.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices incorporate your latest revisions and clarifying responses:

- **Revised Feature 1: Fully Customizable Timer Durations**: Users can adjust focus session duration (e.g., 15m, 25m, 45m, 50m, 60m, or any custom minute value), short break duration (3m to 15m), and long break duration (10m to 30m), with customizable interval cycles and auto-advance options.
- **Revised Feature 2: Multi-Method Study Suite**: In addition to classic Pomodoro, the timer and study workspace includes:
  - **Flowtime Technique**: An open-ended stopwatch timer for uninterrupted flow state. When you finish, Tempo calculates your ideal rest break based on time worked (e.g., 25–50 min = 8 min rest; >50 min = 15 min rest).
  - **50/10 Ultradian Rhythm**: 50 minutes deep immersion + 10 minutes restorative break.
  - **90-Minute Deep Work Block**: Based on human ultradian performance cycles, ideal for essay writing, exam prep, and research.
  - **Feynman Technique Scratchpad**: A 4-step concept explainer tool ("Explain it simply", "Pinpoint gaps", "Refine & test") linked to any active task.
  - **Active Recall Self-Test**: A quick 3-bullet prompt check before completing study tasks to ensure information retention.
- **Confirmed Decision 3: Canvas LMS Connection**: Connected via user-provided Canvas Personal Access Token and Institution Domain (e.g., `canvas.instructure.com` or university domain) via an Express API proxy (`/api/canvas/*`), with course filtering and one-click import into the offline/local to-do list.
- **Confirmed Decision 4: Google Calendar Live Sync**: Google Workspace OAuth (`calendar.events.readonly` and `calendar.events`) to import lectures and events into the daily schedule and export study blocks directly to Google Calendar.
- **Confirmed Decision 5: Lo-Fi Pastel Theme Engine**: 5 soothing pastel themes (Matcha Sage, Lavender Fog, Cozy Peach, Nordic Oat, and Midnight Study), optional notebook grid/dot paper textures, custom accent colors, and seamless dark/light mode switching.

---

### 1. Overview & Core Concept

**What It Does**:
Tempo centralizes student academic and personal workloads into one calm, distraction-free command center:
1. **Aggregated Task Stream**: Canvas LMS assignments, Google Calendar events, and offline tasks (textbook readings, paper problem sets, lab prep, chores) displayed side by side with smart filtering.
2. **Daily Goals & Target Completion Times**: Morning priority planner where students set high-impact goals with specific deadline times (e.g., "Finish Chem Lab Report by 4:00 PM") with visual progress meters and countdown alerts.
3. **Adaptive Study Suite**:
   - Customizable Pomodoro Timer (slider or manual input for focus, short break, and long break).
   - Alternative study modes: Flowtime (stopwatch with auto-break calculation), 50/10 Ultradian blocks, and 90-minute Deep Work blocks.
   - Feynman Technique companion and Active Recall checklists.
   - Web Audio API chime bell synthesizers and optional lo-fi rain/white noise generator.
4. **Theme Studio**: Customizer drawer allowing students to switch pastel color schemes, toggle paper grid backgrounds, and adjust font pairings.

**Target Audience / Persona**:
High school, college, and university students seeking a calm, unified study organizer that respects both online LMS deadlines and real-world offline work without notification overload.

---

### 2. User Experience & Visual Design

#### Visual Identity & Theme
- **Aesthetic Direction**: Lo-Fi Study Aesthetic with soothing pastel accents, editorial spacing, and gentle tactile cues reminiscent of Japanese stationery and cozy desk setups.
- **Color Palettes**:
  - *Matcha Studio (Default)*: Soft sage (`#7C9082`), warm oat canvas (`#F7F6F2`), subdued olive accents (`#4E6151`), crisp off-white cards (`#FFFFFF`).
  - *Lavender Fog*: Muted lilac (`#9D8EC2`), misty heather canvas (`#F5F3F9`), deep dusk borders (`#4B3F72`).
  - *Cozy Peach / Sunset*: Warm terracotta apricot (`#D9886C`), almond cream canvas (`#FDF8F5`), honeyed bronze text (`#5A3B2E`).
  - *Nordic Paper*: Cool linen canvas (`#F3F4F6`), subtle slate dividers, deep charcoal typography (`#1F2937`).
  - *Midnight Study (Dark)*: Deep night navy (`#12161F`), twilight slate cards (`#1A202C`), soft candlelight gold and pastel lavender highlights.
- **Typography & Scale**:
  - Display & Headings: `Plus Jakarta Sans` or `Outfit` for calm, contemporary readability.
  - Body Prose: `DM Sans` for dense, highly legible task labels and notes.
  - Timers & Time Targets: `font-mono tabular-nums` (IBM Plex Mono / monospace) to eliminate layout jitter during countdowns.
- **Zero-Pill & Anti-Slop Discipline**:
  - No candy pill enclosures or arbitrary colored badge sandwiches.
  - Metadata (e.g., course code `BIO 101`, due date `Tomorrow, 5:00 PM`, source `Canvas`) rendered with quiet typographic dividers (`·` or `/`).
  - No decorative fake system status dots or mechanical comment headers (`// 01_TASK`).

#### Key User Flows
1. **Morning Briefing & Daily Goals with Target Times**:
   - The user opens the app to see today's date and a clean "Daily Goals & Target Times" banner.
   - User inputs their primary goals for the day and picks target completion times (e.g., `4:30 PM`).
   - A visual timeline tracks remaining hours and ticks off achievements with satisfying micro-animations.
2. **Task Intake & Offline Task Addition**:
   - Quick-add input box for offline tasks (Title, Category/Course, Due Date/Time, Priority, Subtasks/Checklist).
   - "Connect Canvas" drawer: User inputs token and domain; the app fetches active courses and assignments, allowing one-click "Sync to Today's Tasks".
   - "Connect Google Calendar": OAuth button imports events from the user's primary calendar so lectures and club meetings appear inline.
3. **Study Mode & Timer Selection**:
   - The user clicks on the Study Hub or links an active goal/task to the timer.
   - **Mode Picker**:
     - *Custom Pomodoro*: Customize focus length (15m to 90m), short break (3m to 15m), and long break (10m to 30m).
     - *50/10 Focus*: Preset 50m work + 10m break.
     - *90m Deep Work*: Preset 90m focus + 20m rest.
     - *Flowtime*: Stopwatch counts upward; user stops whenever ready, and Tempo awards proportional rest.
     - *Feynman Assistant*: Guided 4-step modal to explain a complex topic in plain words and log knowledge gaps.
     - *Active Recall*: 3-question self-retrieval review before completing tasks.
   - Synthesized Web Audio chimes signal transitions, with optional gentle background rain/white noise.
4. **Theme Customization**:
   - Click the palette icon in the top navigation to open the slide-out Theme Studio.
   - Live preview pastel themes, light/dark mode, notebook paper texture (none, subtle grid, dot matrix), and layout density. All choices persist in `localStorage`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Study Methods Selection & Architecture**
  - *Chosen Approach*: Support 5 distinct study techniques (Customizable Pomodoro, 50/10 Ultradian, 90-min Deep Work, Flowtime Stopwatch, and Feynman Technique / Active Recall helpers).
  - *Why*: Different learning tasks require different cognitive modes. Reading an academic paper suits Flowtime or 50/10; memorizing vocab or formulas suits Active Recall; problem sets suit 25-min Pomodoro sprints; mastering difficult concepts suits the Feynman method.
  - *Alternatives Considered*: Rigid 25/5-only timer (too inflexible for longer university lecture prep or rapid study sessions).

- **Decision 2: Canvas LMS Connection Strategy (API Token + Server Proxy)**
  - *Chosen Approach*: Use a personal access token with the user's institution Canvas domain (e.g., `canvas.instructure.com` or university-specific domain), routed via a backend Express proxy route (`/api/canvas/*`). Also include an iCal feed parser fallback for users whose institutions disable API token generation for students.
  - *Why*: Canvas REST API blocks direct cross-origin browser requests due to CORS policies. An Express proxy route safely attaches headers and relays requests seamlessly. If a student doesn't have token permissions, the standard Canvas iCal subscription feed URL provides an instant, zero-setup alternative.

- **Decision 3: Google Calendar Live Sync**
  - *Chosen Approach*: Official Google Workspace OAuth integration using Firebase Auth and client-side Google API fetch for `calendar.events.readonly` and `calendar.events`.
  - *Why*: Gives real-time bidirectional capability: students see their class schedule and can push study blocks directly to Google Calendar.
  - *Safety*: Destructive operations (modifying/deleting calendar events) will always require explicit confirmation dialogs.

- **Decision 4: Sound Synthesis via Web Audio API**
  - *Chosen Approach*: Synthesize pure musical chimes (tibetan singing bowl / marimba harmonics) and generative brown/pink noise (lo-fi rain generator) using the Web Audio API (`AudioContext`).
  - *Why*: 100% reliable, zero external MP3 dependencies, no risk of broken links or 404s, and completely offline-capable.

---

### 4. Technical Architecture & Data Strategy

#### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Tempo Web Interface                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │   Top Navbar    │  │  Daily Goals &   │  │   Study Methods Hub   │  │
│  │ (Theme, Connect)│  │   Target Times   │  │ (Pomodoro, Flowtime,  │  │
│  └────────┬────────┘  └────────┬─────────┘  │  50/10, Deep Work,    │  │
│           │                    │            │  Feynman, Recall)     │  │
│           │                    │            └───────────┬───────────┘  │
│  ┌────────┴────────────────────┴────────────────────────┴───────────┐  │
│  │                       Task Management Engine                     │  │
│  │  - Offline & Manual Tasks (Checklist, Due Date, Priority, Notes)  │  │
│  │  - Canvas LMS Assignment Ingestion (Due date, Course, Link)      │  │
│  │  - Google Calendar Events Ingestion (Class blocks, Time slots)   │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  │                                     │
│  ┌───────────────────────────────┴──────────────────────────────────┐  │
│  │                  State Management & Local Storage                │  │
│  │   - Tasks Store   - Daily Goals Store   - Timer & Settings Store │  │
│  └──────────────┬────────────────────────────────┬──────────────────┘  │
└─────────────────┼────────────────────────────────┼─────────────────────┘
                  │                                │
                  ▼                                ▼
       ┌─────────────────────┐          ┌──────────────────────┐
       │   Google Calendar   │          │     Express Server   │
       │   Workspace OAuth   │          │  /api/canvas/* Proxy │
       │ (Google API Client) │          └──────────┬───────────┘
       └─────────────────────┘                     │
                                                   ▼
                                        ┌──────────────────────┐
                                        │   Canvas LMS API     │
                                        │  (/api/v1/courses)   │
                                        │  (/api/v1/planner)   │
                                        └──────────────────────┘
```

#### Core Data Entities

1. **StudyTimerConfig & State**:
   ```typescript
   interface TimerSettings {
     method: 'pomodoro' | 'flowtime' | 'ultradian50_10' | 'deepwork90';
     pomodoroFocusMinutes: number;   // default 25, user customizable
     pomodoroShortBreakMinutes: number; // default 5, user customizable
     pomodoroLongBreakMinutes: number;  // default 15, user customizable
     cyclesBeforeLongBreak: number;
     autoStartBreaks: boolean;
     autoStartPomodoros: boolean;
     soundVolume: number;
     ambientNoise: 'none' | 'rain' | 'whitenoise';
   }

   interface StudySessionState {
     mode: 'focus' | 'shortBreak' | 'longBreak';
     timeRemainingSeconds: number;
     flowtimeElapsedSeconds: number;
     isRunning: boolean;
     activeTaskId?: string;
     completedCyclesToday: number;
     totalFocusMinutesToday: number;
   }
   ```

2. **DailyGoal**:
   ```typescript
   interface DailyGoal {
     id: string;
     text: string;
     targetTime: string; // e.g. "17:00"
     isCompleted: boolean;
     completedAt?: string;
     linkedTaskId?: string;
   }
   ```

3. **Task Entity (Unified Offline, Canvas, and Calendar)**:
   ```typescript
   interface Task {
     id: string;
     title: string;
     description?: string;
     category: 'offline' | 'canvas' | 'calendar' | 'personal';
     courseName?: string;
     dueDate?: string; // ISO date
     dueTime?: string; // e.g. "16:30"
     priority: 'low' | 'medium' | 'high';
     isCompleted: boolean;
     completedAt?: string;
     estimatedMinutes?: number;
     canvasAssignmentId?: string;
     canvasUrl?: string;
     calendarEventId?: string;
     subtasks: { id: string; title: string; completed: boolean }[];
     feynmanNotes?: string;
     recallQuestions?: { prompt: string; answer: string }[];
   }
   ```

4. **ThemeConfig**:
   ```typescript
   interface ThemeConfig {
     preset: 'matcha' | 'lavender' | 'peach' | 'nordic' | 'midnight';
     isDark: boolean;
     paperTexture: 'none' | 'grid' | 'dots';
     borderRadius: 'modern' | 'soft' | 'sharp';
     accentHue: string;
   }
   ```

---

### Step-by-Step Implementation Sequence

1. **Step 1: Workspace OAuth Configuration**:
   - Initialize Google Workspace OAuth tool flow (`set_up_oauth`) for Google Calendar permissions (`calendar.events.readonly` and `calendar.events`).
   - Wire Firebase Auth Google sign-in and token management for Google Calendar live sync.

2. **Step 2: Theme Engine & Typography Infrastructure**:
   - Add Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css`.
   - Setup CSS variables for the 5 pastel themes (Matcha, Lavender, Peach, Nordic, Midnight) and subtle notebook paper textures (grid/dots).
   - Create theme persistence service and customizable theme switcher dialog.

3. **Step 3: Canvas LMS Proxy & Sync Integration**:
   - Configure Express server proxy in `server.ts` for Canvas API endpoints (`/api/canvas/courses`, `/api/canvas/assignments`, `/api/canvas/planner`).
   - Create Canvas connection modal (school domain, access token, or optional iCal subscription URL feed fallback).
   - Implement Canvas assignment importer with course tag assignment and due date parsing.

4. **Step 4: Daily Goals with Target Completion Times**:
   - Build the Daily Goals interactive module with goal creation, target time selection (`targetTime`), countdown display ("2h 15m remaining"), overdue/ontime visual badges, and completion celebration.

5. **Step 5: Offline & Unified Task Management**:
   - Build intuitive quick-add input for offline tasks (homework, study blocks, reading, lab work) with priority, tags, subtasks, and estimated minutes.
   - Comprehensive filter bar: All, Today, Canvas, Calendar, Offline, Completed.
   - Search, edit, reorder, and delete (with confirmation).

6. **Step 6: Advanced Study Hub (Customizable Pomodoro, Flowtime, 50/10, Deep Work & Cognitive Tools)**:
   - Build the timer with customizable durations (sliders/inputs for focus, short break, and long break).
   - Implement Flowtime stopwatch mode with automatic proportional rest break calculation.
   - Add 50/10 Ultradian rhythm and 90-minute Deep Work presets.
   - Build Feynman Technique companion modal and Active Recall retention prompt.
   - Web Audio API chime bell synthesizers and generative rain/white noise.

7. **Step 7: Verification & Polish**:
   - Validate responsive desktop (1440px) and tablet/mobile views.
   - Co-run `compile_applet` and `lint_applet` to ensure pristine code execution.
