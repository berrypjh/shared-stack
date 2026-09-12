/**
 * Table·TableScroll 계약.
 *
 * **native HTML table 을 감싸는 최소 wrapper** 다. `<caption>`·`<thead>`·`<tbody>`·`<tfoot>`·
 * `<tr>`·`<th>`·`<td>` 는 소비자가 직접 쓴다 — HTML 이 `<table>` 과 `<tr>` 사이에 다른 요소를
 * 허용하지 않으므로 `TableRow`·`TableCell` 같은 wrapper 는 **시맨틱을 더하지 못하고 공개
 * 심볼만 늘린다**.
 *
 * 아닌 것: grid·spreadsheet·virtualized data grid. `role="grid"` 를 붙이지 않고 셀 간
 * 키보드 내비게이션을 구현하지 않는다 — 단순 data table 은 브라우저가 이미 옳게 읽는다.
 *
 * **정렬 상태는 소비자가 소유한다.** Table 은 정렬 로직·상태를 갖지 않고, `<th aria-sort>` 와
 * 그 안의 `<button>` 이 각자 책임을 진다.
 */
import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import * as barrel from './index';
import { Table } from './Table';
import { tableClasses } from './Table.constants';
import { TableScroll } from './TableScroll';

/** 최소 유효 table. 헤더 셀은 `scope` 를 가져야 한다. */
const Basic = () => (
  <Table>
    <caption>2026년 분기 매출</caption>
    <thead>
      <tr>
        <th scope="col">분기</th>
        <th scope="col">매출</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">1분기</th>
        <td>120</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th scope="row">합계</th>
        <td>120</td>
      </tr>
    </tfoot>
  </Table>
);

describe('<Table />', () => {
  const { render } = createRenderer();

  describeConformance(
    <Table>
      <tbody>
        <tr>
          <td>셀</td>
        </tr>
      </tbody>
    </Table>,
    () => ({
      render,
      classes: { root: tableClasses.root },
      refInstanceof: HTMLTableElement,
      only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
    }),
  );

  describe('시맨틱 루트', () => {
    it('native table 로 렌더한다', () => {
      const { container } = render(<Basic />);

      expect(container.firstChild).toHaveProperty('nodeName', 'TABLE');
      expect(screen.getByRole('table')).toHaveClass(tableClasses.root);
    });

    it('role="grid" 를 붙이지 않는다 — 단순 data table 이다', () => {
      render(<Basic />);

      expect(screen.getByRole('table')).not.toHaveAttribute('role');
      expect(screen.queryByRole('grid')).toBeNull();
      expect(screen.queryByRole('gridcell')).toBeNull();
    });

    it('셀을 포커스 대상으로 만들지 않는다 — 스프레드시트가 아니다', () => {
      render(<Basic />);

      for (const cell of screen.getAllByRole('cell')) {
        expect(cell).not.toHaveAttribute('tabindex');
      }
    });

    it('ref 가 루트 table 을 가리킨다', () => {
      const ref = createRef<HTMLTableElement>();

      render(
        <Table ref={ref}>
          <tbody>
            <tr>
              <td>셀</td>
            </tr>
          </tbody>
        </Table>,
      );

      expect(ref.current).toBe(screen.getByRole('table'));
    });

    it('Table 전용 prop 을 DOM 속성으로 흘리지 않는다', () => {
      render(
        <Table data-testid="t" hiddenCaption>
          <caption>설명</caption>
          <tbody>
            <tr>
              <td>셀</td>
            </tr>
          </tbody>
        </Table>,
      );

      expect(screen.getByTestId('t').getAttributeNames()).not.toContain('hiddenCaption');
    });
  });

  describe('native 자손 통과', () => {
    it('caption·thead·tbody·tfoot 을 그대로 담는다', () => {
      render(<Basic />);

      const table = screen.getByRole('table');

      expect(table.querySelector('caption')).toHaveTextContent('2026년 분기 매출');
      expect(table.querySelector('thead')).not.toBeNull();
      expect(table.querySelector('tbody')).not.toBeNull();
      expect(table.querySelector('tfoot')).not.toBeNull();
    });

    it('caption 이 table 의 접근 가능한 이름이 된다', () => {
      render(<Basic />);

      expect(screen.getByRole('table', { name: '2026년 분기 매출' })).toBeInTheDocument();
    });

    it('th 가 columnheader·rowheader 로 읽힌다', () => {
      render(<Basic />);

      // scope="col" → columnheader, scope="row" → rowheader
      expect(screen.getAllByRole('columnheader')).toHaveLength(2);
      expect(screen.getAllByRole('rowheader')).toHaveLength(2);
      expect(screen.getByRole('columnheader', { name: '분기' })).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: '1분기' })).toBeInTheDocument();
    });

    it('td 가 cell 로 읽힌다', () => {
      render(<Basic />);

      expect(screen.getAllByRole('cell')).toHaveLength(2);
    });

    it('행 구조를 그대로 유지한다', () => {
      render(<Basic />);

      expect(screen.getAllByRole('row')).toHaveLength(3);
    });
  });

  describe('hiddenCaption', () => {
    it('기본값은 caption 을 보이게 둔다', () => {
      render(<Basic />);

      expect(screen.getByRole('table')).not.toHaveClass(tableClasses.hiddenCaption);
    });

    /**
     * caption 은 접근성상 권장이지만 시각 디자인에서는 원치 않는 경우가 많다. 지우는 대신
     * **시각만 숨긴다** — 이름은 남는다. 저장소의 정본 패턴(`form-control` 의 `hiddenLabel`)을 쓴다.
     */
    it('시각만 숨기고 접근 가능한 이름은 남긴다', () => {
      render(
        <Table hiddenCaption>
          <caption>숨은 설명</caption>
          <tbody>
            <tr>
              <td>셀</td>
            </tr>
          </tbody>
        </Table>,
      );

      const table = screen.getByRole('table', { name: '숨은 설명' });

      expect(table).toHaveClass(tableClasses.hiddenCaption);
      // DOM 에서 제거하지 않는다 — 제거하면 이름이 사라진다.
      expect(table.querySelector('caption')).toHaveTextContent('숨은 설명');
    });
  });

  /**
   * 정렬은 **합성**이다. Table 이 상태도 로직도 갖지 않으므로 여기서 검사하는 것은
   * "소비자가 native 하게 조립할 수 있는가" 다.
   *
   * 책임 분리: `aria-sort` 는 **`<th>`** 가(정렬된 열이라는 사실), 활성화는 **`<button>`** 이
   * (누를 수 있는 컨트롤) 진다. 둘을 한 요소에 몰면 스크린리더가 버튼 이름에 상태를 섞어 읽는다.
   */
  describe('정렬 합성', () => {
    const Sortable = ({ onSort }: { onSort?: () => void }) => (
      <Table>
        <caption>정렬 가능</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort="ascending">
              <button type="button" className={tableClasses.sortButton} onClick={onSort}>
                이름
              </button>
            </th>
            <th scope="col" aria-sort="none">
              <button type="button" className={tableClasses.sortButton}>
                수량
              </button>
            </th>
            <th scope="col">설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>가</td>
            <td>1</td>
            <td>없음</td>
          </tr>
        </tbody>
      </Table>
    );

    it('aria-sort 는 th 에 있고 button 에는 없다', () => {
      render(<Sortable />);

      const header = screen.getByRole('columnheader', { name: '이름' });

      expect(header).toHaveAttribute('aria-sort', 'ascending');
      expect(screen.getByRole('button', { name: '이름' })).not.toHaveAttribute('aria-sort');
    });

    it('정렬 컨트롤이 실제 button 이다', () => {
      render(<Sortable />);

      const button = screen.getByRole('button', { name: '이름' });

      expect(button).toHaveProperty('nodeName', 'BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('정렬 button 이 키보드 포커스를 받고 Enter 로 활성화된다', async () => {
      const onSort = vi.fn();
      const { user } = render(<Sortable onSort={onSort} />);

      await user.tab();
      const button = screen.getByRole('button', { name: '이름' });

      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onSort).toHaveBeenCalledTimes(1);
    });

    it('정렬 가능한 열과 아닌 열이 섞여도 헤더 시맨틱이 유지된다', () => {
      render(<Sortable />);

      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
      // 정렬 불가 열에는 button 도 aria-sort 도 없다.
      expect(screen.getByRole('columnheader', { name: '설명' })).not.toHaveAttribute('aria-sort');
    });

    it('Table 이 정렬 상태나 핸들러를 제공하지 않는다', () => {
      // 공개 표면에 정렬 관련 심볼이 없다는 것이 계약이다.
      expect(Object.keys(barrel)).not.toContain('useTableSort');
      expect(Object.keys(barrel)).not.toContain('TableSortLabel');
    });
  });
});

describe('<TableScroll />', () => {
  const { render } = createRenderer();

  describeConformance(<TableScroll label="스크롤 영역">{null}</TableScroll>, () => ({
    render,
    classes: { root: tableClasses.scroll },
    refInstanceof: HTMLDivElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  /**
   * 가로로 넘치는 영역은 **키보드로도 스크롤할 수 있어야 한다** (WCAG 2.1.1). 마우스 휠·드래그만
   * 되는 영역은 키보드 사용자에게 잘린 내용이 도달 불가가 된다. 그래서 `tabIndex=0` 으로
   * 포커스를 받고, 포커스 가능한 영역은 이름이 있어야 하므로 `role="region"` + `aria-label` 을 둔다.
   *
   * `label` 이 필수인 이유다 — 이름 없는 region 은 스크린리더에서 정체불명의 랜드마크가 된다.
   */
  describe('키보드 스크롤 접근', () => {
    it('포커스를 받을 수 있다', async () => {
      const { user } = render(
        <TableScroll label="분기 매출 표">
          <Table>
            <tbody>
              <tr>
                <td>셀</td>
              </tr>
            </tbody>
          </Table>
        </TableScroll>,
      );

      await user.tab();

      expect(screen.getByRole('region', { name: '분기 매출 표' })).toHaveFocus();
    });

    it('이름을 가진 region 이다', () => {
      render(<TableScroll label="분기 매출 표">{null}</TableScroll>);

      const region = screen.getByRole('region', { name: '분기 매출 표' });

      expect(region).toHaveAttribute('tabindex', '0');
    });

    it('소비자 aria-label 이 label 을 덮는다', () => {
      render(
        <TableScroll label="기본" aria-label="소비자가 정한 이름">
          {null}
        </TableScroll>,
      );

      expect(screen.getByRole('region', { name: '소비자가 정한 이름' })).toBeInTheDocument();
    });
  });

  describe('table 시맨틱을 방해하지 않는다', () => {
    it('감싸도 table 이 그대로 table 이다', () => {
      render(
        <TableScroll label="영역">
          <Table>
            <caption>설명</caption>
            <tbody>
              <tr>
                <th scope="row">행</th>
                <td>값</td>
              </tr>
            </tbody>
          </Table>
        </TableScroll>,
      );

      // region 이 table 을 감쌌어도 이름·역할이 온전하다.
      expect(screen.getByRole('table', { name: '설명' })).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: '행' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '값' })).toBeInTheDocument();
    });

    it('table 을 자식으로 갖지만 스스로 table 역할을 하지 않는다', () => {
      render(
        <TableScroll label="영역">
          <Table>
            <tbody>
              <tr>
                <td>셀</td>
              </tr>
            </tbody>
          </Table>
        </TableScroll>,
      );

      expect(screen.getAllByRole('table')).toHaveLength(1);
      expect(screen.getByRole('region')).toContainElement(screen.getByRole('table'));
    });
  });
});

describe('공개 표면', () => {
  it('Table·TableScroll·클래스만 내보낸다 — native 요소 wrapper 는 없다', () => {
    expect(Object.keys(barrel).sort()).toEqual(['Table', 'TableScroll', 'tableClasses']);
  });

  /**
   * `<table>` 과 `<tr>` 사이에는 다른 요소가 들어갈 수 없다. 그래서 `TableRow`·`TableCell` 같은
   * wrapper 는 시맨틱을 더하지 못하고 공개 심볼·카탈로그·번들만 늘린다.
   */
  it('native 요소를 덮는 speculative wrapper 를 만들지 않는다', () => {
    for (const name of [
      'TableHead',
      'TableBody',
      'TableFoot',
      'TableRow',
      'TableCell',
      'TableHeaderCell',
      'TableCaption',
      'TableContainer',
    ]) {
      expect(Object.keys(barrel)).not.toContain(name);
    }
  });
});
