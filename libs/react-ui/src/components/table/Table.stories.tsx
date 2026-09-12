import { useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { Table } from './Table';
import { tableClasses } from './Table.constants';
import { TableScroll } from './TableScroll';

/**
 * `Table` 은 native HTML table 을 감싸는 **최소 wrapper** 다.
 *
 * `<caption>`·`<thead>`·`<tbody>`·`<tfoot>`·`<tr>`·`<th>`·`<td>` 는 소비자가 직접 쓴다 —
 * HTML 이 `<table>` 과 `<tr>` 사이에 다른 요소를 허용하지 않으므로 `TableRow`·`TableCell` 같은
 * wrapper 는 시맨틱을 더하지 못한다.
 *
 * **정렬 상태는 소비자 것이다.** `SortableHeaders` 가 그 합성을 보여 준다 — Table 에는 정렬
 * 로직도, 상태도, 핸들러도 없다.
 */
const meta = {
  title: 'Components/Data Display/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    hiddenCaption: { control: 'boolean' },
    children: { control: false },
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

type Row = { quarter: string; revenue: number; growth: string };

const ROWS: Row[] = [
  { quarter: '1분기', revenue: 120, growth: '+4%' },
  { quarter: '2분기', revenue: 148, growth: '+23%' },
  { quarter: '3분기', revenue: 132, growth: '-11%' },
  { quarter: '4분기', revenue: 175, growth: '+33%' },
];

const numericStyle = { textAlign: 'end' } as const;

export const Basic: Story = {
  args: {
    children: (
      <>
        <caption>2026년 분기 매출 (단위: 억원)</caption>
        <thead>
          <tr>
            <th scope="col">분기</th>
            <th scope="col" style={numericStyle}>
              매출
            </th>
            <th scope="col" style={numericStyle}>
              성장률
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.quarter}>
              <td>{r.quarter}</td>
              <td style={numericStyle}>{r.revenue}</td>
              <td style={numericStyle}>{r.growth}</td>
            </tr>
          ))}
        </tbody>
      </>
    ),
  },
};

/**
 * `<caption>` 은 table 의 접근 가능한 이름이다.
 *
 * 시각 디자인에서 원치 않으면 `hiddenCaption` 으로 **시각만** 숨긴다 — DOM 에서 지우면 이름이
 * 사라진다. `form-control` 의 `hiddenLabel` 과 같은 정본 패턴이다.
 */
export const WithCaption: Story = {
  args: {
    hiddenCaption: true,
    children: (
      <>
        <caption>시각적으로 숨겨진 설명 — 스크린리더에는 남는다</caption>
        <thead>
          <tr>
            <th scope="col">분기</th>
            <th scope="col" style={numericStyle}>
              매출
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.slice(0, 2).map((r) => (
            <tr key={r.quarter}>
              <td>{r.quarter}</td>
              <td style={numericStyle}>{r.revenue}</td>
            </tr>
          ))}
        </tbody>
      </>
    ),
  },
};

/**
 * 행의 첫 셀이 그 행을 식별하면 `<th scope="row">` 다.
 *
 * 그러면 스크린리더가 셀을 읽을 때 "2분기, 매출, 148" 처럼 **행·열 머리를 함께** 말한다.
 * `<td>` 로 두면 그 관계가 사라진다.
 */
export const RowHeaders: Story = {
  args: {
    children: (
      <>
        <caption>행 머리가 있는 표</caption>
        <thead>
          <tr>
            <th scope="col">분기</th>
            <th scope="col" style={numericStyle}>
              매출
            </th>
            <th scope="col" style={numericStyle}>
              성장률
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.quarter}>
              <th scope="row">{r.quarter}</th>
              <td style={numericStyle}>{r.revenue}</td>
              <td style={numericStyle}>{r.growth}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">합계</th>
            <td style={numericStyle}>{ROWS.reduce((s, r) => s + r.revenue, 0)}</td>
            <td style={numericStyle}>—</td>
          </tr>
        </tfoot>
      </>
    ),
  },
};

/**
 * **정렬 합성.** 상태는 소비자가 소유하고 Table 은 관여하지 않는다.
 *
 * 책임 분리: `aria-sort` 는 `<th>` 가(정렬된 열이라는 사실), 활성화는 `<button>` 이 진다.
 * 방향 표시자는 `aria-sort` 속성 선택자가 그리므로 **접근성 상태와 시각이 갈라질 수 없다.**
 */
export const SortableHeaders: Story = {
  render: () => {
    const Sortable = () => {
      const [key, setKey] = useState<keyof Row>('revenue');
      const [asc, setAsc] = useState(false);

      const sorted = useMemo(
        () =>
          [...ROWS].sort((a, b) => {
            const [x, y] = asc ? [a[key], b[key]] : [b[key], a[key]];
            return typeof x === 'number' && typeof y === 'number'
              ? x - y
              : String(x).localeCompare(String(y));
          }),
        [key, asc],
      );

      const sortOf = (col: keyof Row) =>
        key === col ? (asc ? 'ascending' : 'descending') : 'none';

      const toggle = (col: keyof Row) => {
        if (key === col) setAsc((prev) => !prev);
        else {
          setKey(col);
          setAsc(true);
        }
      };

      const header = (col: keyof Row, label: string, numeric = false) => (
        <th scope="col" aria-sort={sortOf(col)} style={numeric ? numericStyle : undefined}>
          <button type="button" className={tableClasses.sortButton} onClick={() => toggle(col)}>
            {label}
          </button>
        </th>
      );

      return (
        <Table>
          <caption>열 머리를 눌러 정렬한다 — 정렬 상태는 소비자가 소유한다</caption>
          <thead>
            <tr>
              {header('quarter', '분기')}
              {header('revenue', '매출', true)}
              <th scope="col" style={numericStyle}>
                성장률
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.quarter}>
                <td>{r.quarter}</td>
                <td style={numericStyle}>{r.revenue}</td>
                <td style={numericStyle}>{r.growth}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    };

    return <Sortable />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 정렬 컨트롤이 실제 button 이고 키보드로 닿는다.
    await userEvent.tab();
    const quarter = canvas.getByRole('button', { name: '분기' });

    await expect(quarter).toHaveFocus();

    // aria-sort 는 th 에 있고 button 에는 없다.
    const revenue = canvas.getByRole('columnheader', { name: '매출' });

    await expect(revenue).toHaveAttribute('aria-sort', 'descending');
    await expect(canvas.getByRole('button', { name: '매출' })).not.toHaveAttribute('aria-sort');

    // Enter 로 정렬이 바뀌고 aria-sort 가 따라온다.
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('columnheader', { name: '분기' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    // grid 로 승격되지 않는다.
    await expect(canvas.queryByRole('grid')).toBeNull();
  },
};

/** 긴 셀 내용은 줄바꿈된다 — 잘리지 않는다. */
export const LongContent: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '420px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: (
      <>
        <caption>긴 내용</caption>
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">아주 긴 항목 이름이 들어가는 행 머리</th>
            <td>
              셀 안의 아주 긴 설명입니다. `overflow-wrap: break-word` 로 줄바꿈되므로 좁은 폭에서도
              글자가 잘리지 않습니다.
            </td>
          </tr>
        </tbody>
      </>
    ),
  },
};

/** 행이 많을 때의 밀도 확인. 페이지네이션·가상화를 만들지 않는다 — 그것은 data grid 의 개념이다. */
export const DenseDataset: Story = {
  args: {
    children: (
      <>
        <caption>24개월 데이터</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col" style={numericStyle}>
              매출
            </th>
            <th scope="col" style={numericStyle}>
              건수
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 24 }, (_, i) => (
            <tr key={i}>
              <th scope="row">{`${2025 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`}</th>
              <td style={numericStyle}>{40 + ((i * 7) % 60)}</td>
              <td style={numericStyle}>{120 + ((i * 13) % 90)}</td>
            </tr>
          ))}
        </tbody>
      </>
    ),
  },
};

/**
 * 좁은 컨테이너 — `TableScroll` 이 가로 스크롤을 맡는다.
 *
 * 그 영역은 `tabIndex=0` 이라 **키보드로도 스크롤된다** (WCAG 2.1.1). 포커스를 받으므로
 * 포커스 링이 보여야 하고, 이름이 있어야 해서 `label` 이 필수다. 감싸도 table 시맨틱은 그대로다.
 */
export const NarrowContainer: Story = {
  render: () => (
    <div style={{ maxWidth: '280px' }}>
      <TableScroll label="분기별 상세 지표 표">
        <Table>
          <caption>좁은 폭에서 가로로 스크롤한다</caption>
          <thead>
            <tr>
              <th scope="col">분기</th>
              <th scope="col">매출</th>
              <th scope="col">성장률</th>
              <th scope="col">건수</th>
              <th scope="col">평균 단가</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.quarter}>
                <th scope="row">{r.quarter}</th>
                <td>{r.revenue}</td>
                <td>{r.growth}</td>
                <td>{r.revenue * 3}</td>
                <td>{(r.revenue / 4).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 스크롤 영역이 이름을 가진 region 이고 키보드로 닿는다.
    await userEvent.tab();
    await expect(canvas.getByRole('region', { name: '분기별 상세 지표 표' })).toHaveFocus();

    // 감싸도 table 시맨틱이 온전하다.
    await expect(
      canvas.getByRole('table', { name: '좁은 폭에서 가로로 스크롤한다' }),
    ).toBeVisible();
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(4);
  },
};

export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {() => (
        <Table>
          <caption>테마별 격자·헤더·caption</caption>
          <thead>
            <tr>
              <th scope="col" aria-sort="ascending">
                <button type="button" className={tableClasses.sortButton}>
                  분기
                </button>
              </th>
              <th scope="col" style={numericStyle}>
                매출
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.slice(0, 2).map((r) => (
              <tr key={r.quarter}>
                <th scope="row">{r.quarter}</th>
                <td style={numericStyle}>{r.revenue}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">합계</th>
              <td style={numericStyle}>268</td>
            </tr>
          </tfoot>
        </Table>
      )}
    </ThemeGallery>
  ),
};

/**
 * forced-colors(Windows 고대비) 검토용.
 *
 * 그 모드에서 가장 위험한 것은 **격자가 사라지는 것**이다 — 경계가 시스템 색으로 평탄화되면
 * 어느 값이 어느 열인지 읽을 수 없다. `table.scss` 가 `CanvasText` 로 되살린다.
 * 정렬 표시자는 테두리 삼각형이라 그 모드에서도 남는다 (규칙은 `forcedColors.test.ts` 가 검사).
 */
export const ForcedColors: Story = {
  args: {
    children: (
      <>
        <caption>격자·헤더 경계·정렬 표시자</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort="descending">
              <button type="button" className={tableClasses.sortButton}>
                분기
              </button>
            </th>
            <th scope="col" style={numericStyle}>
              매출
            </th>
            <th scope="col" style={numericStyle}>
              성장률
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.quarter}>
              <th scope="row">{r.quarter}</th>
              <td style={numericStyle}>{r.revenue}</td>
              <td style={numericStyle}>{r.growth}</td>
            </tr>
          ))}
        </tbody>
      </>
    ),
  },
};
