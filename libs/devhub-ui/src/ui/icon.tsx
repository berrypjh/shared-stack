/**
 * 선 아이콘. react-ui 는 아이콘 세트를 들고 있지 않아 DevHub 가 소유한다.
 * 모두 장식이다 — 뜻은 옆 글자나 접근 이름이 전한다. `currentColor` 라 글자색 · 테마를 따른다.
 */
const PATHS = {
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  home: ['M4 10.5L12 4l8 6.5', 'M6.5 9V20h11V9'],
  search: ['M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13', 'M15.5 15.5L20 20'],
  flow: ['M5 6h6a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3h2', 'M5 6h.01', 'M19 18h.01'],
  scenario: [
    'M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    'M18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    'M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7',
  ],
  architecture: ['M12 3l8 4.5-8 4.5-8-4.5z', 'M4 12l8 4.5 8-4.5', 'M4 16.5L12 21l8-4.5'],
  application: ['M4 5h16v14H4z', 'M4 9h16'],
  library: ['M5 4h4v16H5Z', 'M11 4h4v16h-4Z', 'm17 5.5 3 .8-3.6 14.2-3-.8'],
  package: ['M12 3l8 4v10l-8 4-8-4V7z', 'M4 7l8 4 8-4', 'M12 11v10'],
  engineering: ['M4 5h16v14H4z', 'M8 10l3 2-3 2', 'M13 15h3'],
  document: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M10 12h5', 'M10 16h5'],
  record: ['M6 6h.01', 'M6 12h.01', 'M6 18h.01', 'M10 6h9', 'M10 12h9', 'M10 18h5'],
  overview: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5', 'M12 8h.01'],
  source: ['m8 7-5 5 5 5', 'm16 7 5 5-5 5', 'm14 4-4 16'],
  test: [
    'M9 3h6',
    'M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3',
    'M7.5 15h9',
  ],
  api: ['M4 8h14', 'm15 5 3 3-3 3', 'M20 16H6', 'm9 13-3 3 3 3'],
  related: [
    'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1',
    'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  ],
  runtime: ['M4 5h16v11H4Z', 'M9 20h6', 'M12 16v4'],
  owner: ['M4 7.5 12 3l8 4.5v9L12 21l-8-4.5Z', 'm4 7.5 8 4.5 8-4.5', 'M12 12v9'],
  contract: [
    'M9 4H8a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1',
    'M15 4h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1',
  ],
  outgoing: ['M5 12h14', 'm14 7 5 5-5 5'],
  incoming: ['M19 12H5', 'm10 7-5 5 5 5'],
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M3 12h18',
    'M12 3a14 14 0 0 1 0 18',
    'M12 3a14 14 0 0 0 0 18',
  ],
  help: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6',
    'M12 17h.01',
  ],
  hash: ['M5 9h14', 'M5 15h14', 'M10 4 8 20', 'M16 4l-2 16'],
  warning: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
  check: ['m5 12 5 5 9-10'],
  copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  link: [
    'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1',
    'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  ],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  editor: ['M3 5h18v14H3Z', 'M3 9h18', 'm8 13 2 2-2 2', 'M13 17h3'],
  calendar: ['M4 6h16v14H4Z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  commit: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M3 12h6', 'M15 12h6'],
  branch: [
    'M7 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    'M7 9v10',
    'M17 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    'M17 9v2a4 4 0 0 1-4 4H7',
  ],
  'chevron-left': ['M15 6l-6 6 6 6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  fit: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5', 'M9 9h6v6H9z'],
  expand: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5'],
  sun: [
    'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7',
    'M12 3v2',
    'M12 19v2',
    'M3 12h2',
    'M19 12h2',
    'M5.6 5.6l1.4 1.4',
    'M17 17l1.4 1.4',
    'M5.6 18.4L7 17',
    'M17 7l1.4-1.4',
  ],
  moon: ['M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5'],
  brand: [
    'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    'M12 3v6.5',
    'M12 14.5V21',
    'M4 7.5l5.8 3.3',
    'M20 7.5l-5.8 3.3',
    'M4 16.5l5.8-3.3',
    'M20 16.5l-5.8-3.3',
  ],
} as const;

export type IconName = keyof typeof PATHS;

export const Icon = ({ name, className }: { name: IconName; className?: string }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={['shrink-0', className].filter(Boolean).join(' ')}
  >
    {PATHS[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
