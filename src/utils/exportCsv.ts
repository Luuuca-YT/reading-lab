function escapeCsv(value: string): string {
  if (!value) return '';
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsv).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsv).join(','));
  return [headerLine, ...dataLines].join('\n');
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStudentCsv(data: {
  student: { name: string; age: string; grade: string };
  sessions: Array<{
    day: number;
    date: string;
    articles: Array<{
      title: string;
      misread: number;
      pauses: number;
      studentQ1: string;
      studentQ2: string;
      studentQ3: string;
      studentQ4: string;
      tutorQ1: string;
      tutorQ2: string;
      tutorQ3: string;
      tutorQ4: string;
    }>;
  }>;
}) {
  const { student, sessions } = data;

  // Student info header
  const infoLines = [
    `Student: ${escapeCsv(student.name)}`,
    `Age: ${escapeCsv(student.age)}`,
    `Grade: ${escapeCsv(student.grade)}`,
    `Exported: ${new Date().toLocaleString()}`,
    '',
  ].join('\n');

  const headers = [
    'Day',
    'Date',
    'Article',
    'Misread Words',
    'Pauses',
    'Student: Understanding (1-5)',
    'Student: Difficulty',
    'Student: Interest',
    'Student: Effort (1-5)',
    'Tutor: Accuracy (1-5)',
    'Tutor: Fluency (1-5)',
    'Tutor: Comprehension',
    'Tutor: Notes',
  ];

  const rows: string[][] = [];
  for (const s of sessions) {
    for (const a of s.articles) {
      rows.push([
        String(s.day),
        s.date,
        a.title,
        String(a.misread),
        String(a.pauses),
        a.studentQ1,
        a.studentQ2,
        a.studentQ3,
        a.studentQ4,
        a.tutorQ1,
        a.tutorQ2,
        a.tutorQ3,
        a.tutorQ4,
      ]);
    }
  }

  const csv = infoLines + rowsToCsv(headers, rows);
  const filename = `${student.name.replace(/\s/g, '_')}_reading_data.csv`;
  downloadBlob(csv, filename);
}
