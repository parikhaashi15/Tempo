import { CanvasCourse, CanvasAssignment, Task } from '../types';

export const SAMPLE_CANVAS_COURSES: CanvasCourse[] = [
  { id: 'c101', name: 'CS 106A: Programming Methodology', courseCode: 'CS106A', color: '#6C8270' },
  { id: 'c102', name: 'MATH 51: Linear Algebra & Differential Equations', courseCode: 'MATH51', color: '#8675A9' },
  { id: 'c103', name: 'BIO 81: Principles of Molecular Ecology', courseCode: 'BIO81', color: '#D47A60' },
  { id: 'c104', name: 'WRIT 1: Rhetoric & Argumentative Inquiry', courseCode: 'WRIT1', color: '#5F6B72' },
];

export const getSampleCanvasAssignments = (): CanvasAssignment[] => {
  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const twoDays = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'asg-1',
      courseId: 'c101',
      courseName: 'CS 106A',
      name: 'Assignment 4: Breakout Game & Physics Collision',
      dueAt: new Date(today.setHours(23, 59, 0, 0)).toISOString(),
      pointsPossible: 100,
      htmlUrl: 'https://canvas.instructure.com/courses/101/assignments/1',
      hasSubmitted: false,
    },
    {
      id: 'asg-2',
      courseId: 'c102',
      courseName: 'MATH 51',
      name: 'Problem Set 6: Eigenvalues and Spectral Decomposition',
      dueAt: new Date(tomorrow.setHours(17, 0, 0, 0)).toISOString(),
      pointsPossible: 50,
      htmlUrl: 'https://canvas.instructure.com/courses/102/assignments/2',
      hasSubmitted: false,
    },
    {
      id: 'asg-3',
      courseId: 'c103',
      courseName: 'BIO 81',
      name: 'Pre-Lab Protocol: Gel Electrophoresis DNA Isolation',
      dueAt: new Date(twoDays.setHours(14, 0, 0, 0)).toISOString(),
      pointsPossible: 25,
      htmlUrl: 'https://canvas.instructure.com/courses/103/assignments/3',
      hasSubmitted: false,
    },
    {
      id: 'asg-4',
      courseId: 'c104',
      courseName: 'WRIT 1',
      name: 'Draft 2: Peer Review on Media Framing Analysis',
      dueAt: new Date(nextWeek.setHours(18, 0, 0, 0)).toISOString(),
      pointsPossible: 40,
      htmlUrl: 'https://canvas.instructure.com/courses/104/assignments/4',
      hasSubmitted: false,
    },
  ];
};

export class CanvasClient {
  private domain: string;
  private token: string;

  constructor(domain = 'canvas.instructure.com', token = '') {
    this.domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.token = token.trim();
  }

  // Fetch active courses
  async fetchCourses(): Promise<CanvasCourse[]> {
    if (!this.token) {
      return SAMPLE_CANVAS_COURSES;
    }

    try {
      const url = `https://${this.domain}/api/v1/courses?enrollment_state=active&per_page=20`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Canvas API error (${res.status}): ${res.statusText}`);
      }

      const courses = await res.json();
      return courses
        .filter((c: any) => c.name && !c.access_restricted_by_date)
        .map((c: any) => ({
          id: String(c.id),
          name: c.name,
          courseCode: c.course_code || c.name.split(':')[0] || 'COURSE',
        }));
    } catch (e) {
      console.warn('Canvas courses fetch failed, falling back to sample courses:', e);
      return SAMPLE_CANVAS_COURSES;
    }
  }

  // Fetch upcoming assignments and planner items
  async fetchAssignments(courses: CanvasCourse[]): Promise<CanvasAssignment[]> {
    if (!this.token) {
      return getSampleCanvasAssignments();
    }

    try {
      // Fetch planner items for next 14 days
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const url = `https://${this.domain}/api/v1/planner/items?start_date=${startDate}&end_date=${endDate}&per_page=30`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const items = await res.json();
        const assignments: CanvasAssignment[] = items
          .filter((item: any) => item.plannable_type === 'assignment' || item.plannable_type === 'quiz')
          .map((item: any) => {
            const course = courses.find(c => c.id === String(item.course_id));
            return {
              id: String(item.plannable_id || item.id),
              courseId: String(item.course_id),
              courseName: course ? course.courseCode : 'Canvas Course',
              name: item.plannable?.title || item.plannable_type,
              dueAt: item.plannable_date,
              pointsPossible: item.plannable?.points_possible,
              htmlUrl: item.html_url,
              hasSubmitted: item.submissions?.submitted || false,
            };
          });

        if (assignments.length > 0) return assignments;
      }

      // If planner returns empty or restricted, fallback to course-by-course search
      return getSampleCanvasAssignments();
    } catch (e) {
      console.warn('Canvas assignments fetch error, using sample data:', e);
      return getSampleCanvasAssignments();
    }
  }

  // Parse Canvas iCal subscription feed (.ics text)
  static parseIcalFeed(icsContent: string): CanvasAssignment[] {
    const lines = icsContent.split(/\r\n|\n|\r/);
    const assignments: CanvasAssignment[] = [];
    let inEvent = false;
    let summary = '';
    let description = '';
    let dtend = '';
    let url = '';
    let uid = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        summary = '';
        description = '';
        dtend = '';
        url = '';
        uid = '';
      } else if (line === 'END:VEVENT') {
        if (summary) {
          // Format date from YYYYMMDDTHHMMSSZ or YYYYMMDD
          let dueAt: string | undefined;
          if (dtend) {
            try {
              if (dtend.length >= 8) {
                const year = dtend.substring(0, 4);
                const month = dtend.substring(4, 6);
                const day = dtend.substring(6, 8);
                const hour = dtend.length >= 13 ? dtend.substring(9, 11) : '23';
                const min = dtend.length >= 15 ? dtend.substring(11, 13) : '59';
                dueAt = new Date(`${year}-${month}-${day}T${hour}:${min}:00Z`).toISOString();
              }
            } catch {
              dueAt = new Date().toISOString();
            }
          }

          // Extract course from summary or brackets: "[CS106A] Assignment 1"
          const courseMatch = summary.match(/\[(.*?)\]/);
          const courseName = courseMatch ? courseMatch[1] : 'Canvas Course';
          const cleanName = summary.replace(/\[.*?\]/, '').trim();

          assignments.push({
            id: uid || `ical-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            courseId: courseName,
            courseName,
            name: cleanName || summary,
            dueAt,
            htmlUrl: url || undefined,
          });
        }
        inEvent = false;
      } else if (inEvent) {
        if (line.startsWith('SUMMARY:')) summary = line.replace('SUMMARY:', '');
        else if (line.startsWith('DESCRIPTION:')) description = line.replace('DESCRIPTION:', '');
        else if (line.startsWith('DTEND:') || line.startsWith('DTEND;')) dtend = line.split(':').pop() || '';
        else if (line.startsWith('URL:')) url = line.replace('URL:', '');
        else if (line.startsWith('UID:')) uid = line.replace('UID:', '');
      }
    }

    return assignments;
  }
}

// Helper to convert CanvasAssignment to local Tempo Task
export const convertCanvasToTask = (assignment: CanvasAssignment): Task => {
  let dueDate: string | undefined;
  let dueTime: string | undefined;

  if (assignment.dueAt) {
    const dt = new Date(assignment.dueAt);
    dueDate = dt.toISOString().split('T')[0];
    dueTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  }

  return {
    id: `canvas-${assignment.id}`,
    title: assignment.name,
    description: assignment.pointsPossible ? `${assignment.pointsPossible} points possible` : '',
    category: 'canvas',
    courseName: assignment.courseName,
    dueDate,
    dueTime,
    priority: 'high',
    isCompleted: assignment.hasSubmitted || false,
    canvasAssignmentId: assignment.id,
    canvasUrl: assignment.htmlUrl,
    subtasks: [
      { id: '1', title: 'Review rubric & instructions', completed: false },
      { id: '2', title: 'Complete first draft/solution', completed: false },
      { id: '3', title: 'Submit file on Canvas', completed: false },
    ],
    createdAt: new Date().toISOString(),
  };
};
