import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GROUP_LABELS, PRESENTATION_GROUPS } from './presentation/model';
import { allPresentations } from './presentation/registry';
import { resolveToken } from './presentation/tokenCatalog';
import App from './app';

/**
 * View 전환 통합. URL 이 canonical source 라는 주장을 **실제 history 위에서** 확인한다.
 *
 * `MemoryRouter` 가 아니라 jsdom history + `BrowserRouter` 를 쓰는 이유는 Back/Forward ·
 * deep link 가 이 Command 의 요구사항 자체이기 때문이다. 메모리 라우터로는 브라우저가 하는
 * 일을 확인할 수 없다.
 */
const at = (url: string) => {
  window.history.pushState(null, '', url);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
};

const viewSwitch = () => within(screen.getByRole('group', { name: 'View' }));

/** 라벨은 폭에 따라 줄어들므로 textContent 가 아니라 접근 가능한 이름으로 읽는다. */
const selectedView = () =>
  viewSwitch()
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-pressed') === 'true')
    ?.getAttribute('aria-label');

const url = () => `${window.location.pathname}${window.location.search}`;

const pickView = (name: 'Developer' | 'Designer') =>
  userEvent.click(viewSwitch().getByRole('button', { name }));

describe('View switch', () => {
  it('두 mode 가 상호배타이고 selected 가 semantic 으로 드러난다', () => {
    at('/components/button');
    const buttons = viewSwitch().getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expect(selectedView()).toBe('Developer');
  });

  /**
   * 라벨은 폭에 따라 짧아지지만 접근 가능한 이름은 그대로다. 좁은 화면에서 이름이 사라지면
   * 스크린리더 사용자가 어느 mode 인지 알 수 없다.
   */
  it('두 폭에서 같은 접근 가능한 이름을 갖는다', () => {
    at('/components/button');
    for (const name of ['Developer', 'Designer']) {
      const option = viewSwitch().getByRole('button', { name });
      // 짧은 라벨이 긴 이름에 포함된다 (WCAG 2.5.3).
      expect(name).toContain(option.querySelector('span')?.textContent ?? '');
    }
  });

  it('query 없는 URL 은 Developer 다', () => {
    at('/components/button');
    expect(selectedView()).toBe('Developer');
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeTruthy();
  });

  it('view=designer deep link 가 바로 Designer 로 열린다', () => {
    at('/components/button?view=designer');
    expect(selectedView()).toBe('Designer');
    expect(screen.getByTestId('designer-workspace')).toBeTruthy();
  });

  it.each([['?view=bogus'], ['?view=Designer'], ['?view=']])(
    '%s 는 Developer 로 떨어진다',
    (search) => {
      at(`/components/button${search}`);
      expect(selectedView()).toBe('Developer');
      expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeTruthy();
    },
  );

  it('view=developer 도 Developer 다', () => {
    at('/components/button?view=developer');
    expect(selectedView()).toBe('Developer');
  });
});

describe('View 전환 URL', () => {
  it('Designer 로 바꾸면 pathname 을 유지하고 view=designer 를 붙인다', async () => {
    at('/components/button');
    await pickView('Designer');
    expect(url()).toBe('/components/button?view=designer');
  });

  it('Developer 로 돌아오면 view 를 지우고 pathname 을 유지한다', async () => {
    at('/components/button?view=designer');
    await pickView('Developer');
    expect(url()).toBe('/components/button');
  });

  it('view 이외의 query parameter 를 보존한다', async () => {
    at('/components/button?keep=1');
    await pickView('Designer');
    expect(new URLSearchParams(window.location.search).get('keep')).toBe('1');
    await pickView('Developer');
    expect(new URLSearchParams(window.location.search).get('keep')).toBe('1');
    expect(window.location.search).not.toContain('view');
  });

  /**
   * `?view=developer` 는 읽기 결과가 이미 developer 라, canonical 로 정리하는 것은 되돌릴
   * 일이 아니다. push 로 남기면 Back 이 같은 화면을 한 번 더 보여주는 history 쓰레기가 된다.
   */
  it('normalization 은 history 를 더럽히지 않는다', async () => {
    at('/components/button');
    const before = window.history.length;

    window.history.pushState(null, '', '/components/button?view=developer');
    await pickView('Developer');

    expect(url()).toBe('/components/button');
    // pushState 로 한 칸 늘어난 것이 전부 — 정리 자체는 entry 를 더하지 않는다.
    expect(window.history.length).toBe(before + 1);
  });

  /** Command 의 sequence 그대로. mode 전환이 history 에 남아야 되돌릴 수 있다. */
  it('Back / Forward 로 mode 를 되돌린다', async () => {
    at('/components/button');
    await pickView('Designer');
    expect(url()).toBe('/components/button?view=designer');

    await pickView('Developer');
    expect(url()).toBe('/components/button');

    window.history.back();
    await waitFor(() => expect(url()).toBe('/components/button?view=designer'));
    expect(selectedView()).toBe('Designer');

    window.history.forward();
    await waitFor(() => expect(url()).toBe('/components/button'));
    expect(selectedView()).toBe('Developer');
  });
});

describe('Designer boundary', () => {
  it('Button 은 Developer 와 같은 shared scenario 를 렌더한다', async () => {
    at('/components/button?view=designer');
    const canvas = screen.getByTestId('designer-canvas');

    // scenario 선택은 Chip — aria-pressed 로 선택이 드러난다.
    const group = within(screen.getByRole('group', { name: 'Scenario' }));
    const chips = group.getAllByRole('button');
    expect(chips.length).toBeGreaterThan(1);
    expect(chips.filter((c) => c.getAttribute('aria-pressed') === 'true')).toHaveLength(1);

    // 첫 scenario 가 실제 Button 으로 그려진다 — placeholder 가 아니다.
    expect(within(canvas).getByRole('button', { name: 'Contained' })).toBeTruthy();

    await userEvent.click(group.getByRole('button', { name: 'Loading End' }));
    expect(within(canvas).getByRole('button', { name: 'Loading End' })).toBeTruthy();
  });

  it('component identity 와 heading 을 갖는다', () => {
    at('/components/button?view=designer');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Button');
  });

  it('지원하지 않는 pathname 은 redirect 하지 않고 unsupported 를 보여준다', () => {
    at('/tokens?view=designer');
    expect(url()).toBe('/tokens?view=designer');
    expect(screen.getByTestId('designer-unsupported')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    // 가짜 Designer content 를 그리지 않는다.
    expect(screen.queryByTestId('designer-workspace')).toBeNull();
    expect(screen.queryByTestId('tokens-page')).toBeNull();
  });
});

describe('Sidebar query 보존', () => {
  const nav = () => within(screen.getByRole('navigation', { name: '주요 메뉴' }));

  it('Designer 에서 이동해도 view=designer 가 남는다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(nav().getByRole('link', { name: 'FAB' }));
    expect(url()).toBe('/components/fab?view=designer');
    expect(selectedView()).toBe('Designer');
  });

  it('Developer 에서 이동하면 view 가 붙지 않는다', async () => {
    at('/components/button');
    await userEvent.click(nav().getByRole('link', { name: 'FAB' }));
    expect(url()).toBe('/components/fab');
  });

  /** 내비게이션이 하나이므로 현재 위치를 표시하는 링크도 하나다. */
  it('현재 위치 표시는 pathname 으로만 계산된다', () => {
    at('/components/button?view=designer');
    const current = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('aria-current') === 'page')
      .map((el) => el.textContent);
    expect(current).toEqual(['Button']);
  });
});

describe('shell 유지', () => {
  it('theme 은 두 view 가 하나의 state 를 공유한다', async () => {
    at('/components/button?view=designer');
    const select = screen.getByTestId('theme-select');
    expect(screen.getByTestId('theme-root').getAttribute('data-theme')).toBe('light');

    await userEvent.selectOptions(select, 'dark');
    expect(screen.getByTestId('theme-root').getAttribute('data-theme')).toBe('dark');

    // Developer 로 돌아가도 같은 state 다 — Designer 전용 theme 이 아니다.
    await pickView('Developer');
    expect(screen.getByTestId('theme-root').getAttribute('data-theme')).toBe('dark');
  });

  it('Designer 에서도 SkipLink 와 #main 이 유지된다', () => {
    at('/components/button?view=designer');
    const skip = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    expect(skip.getAttribute('href')).toBe('#main');
    const main = document.getElementById('main');
    expect(main?.tagName).toBe('MAIN');
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('Designer 에서도 mobile drawer 가 경로 이동 후 닫힌다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(screen.getByTestId('open-menu'));
    const drawer = within(screen.getByTestId('menu-drawer'));
    await userEvent.click(drawer.getByRole('link', { name: 'FAB' }));
    expect(screen.queryByTestId('menu-drawer')).toBeNull();
    expect(url()).toBe('/components/fab?view=designer');
  });
});

/**
 * 사이드바가 이 앱의 유일한 내비게이션이다. Designer 에 같은 목록을 한 번 더 두지 않고,
 * 컴포넌트 검색은 그 목록 위에 있다.
 */
describe('사이드바 컴포넌트 검색', () => {
  const nav = () => within(screen.getByRole('navigation', { name: '주요 메뉴' }));
  const search = () => screen.getByTestId('component-search');

  it('Designer 에 두 번째 내비게이션이 없다', () => {
    at('/components/button?view=designer');
    expect(screen.getAllByRole('navigation', { name: '주요 메뉴' })).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: '컴포넌트 라이브러리' })).toBeNull();
  });

  it.each([
    ['Developer', '/components/button'],
    ['Designer', '/components/button?view=designer'],
  ])('%s 에서도 사이드바 상단 같은 자리에 있다', (_view, path) => {
    at(path);
    expect(nav().getByRole('searchbox', { name: '컴포넌트 검색' })).toBeTruthy();
  });

  it('registry 의 모든 컴포넌트를 담는다 — 별도 목록을 들지 않는다', () => {
    at('/components/button?view=designer');
    for (const group of PRESENTATION_GROUPS) {
      expect(nav().getByRole('list', { name: GROUP_LABELS[group] })).toBeTruthy();
    }
    for (const label of allPresentations().map((p) => p.data.label)) {
      expect(nav().getByRole('link', { name: label })).toBeTruthy();
    }
  });

  it('이름으로 좁힌다', async () => {
    at('/components/button?view=designer');
    await userEvent.type(search(), 'divi');
    expect(nav().queryByRole('link', { name: 'Button' })).toBeNull();
    expect(nav().getByRole('link', { name: 'Divider' })).toBeTruthy();
  });

  it('묶음 이름으로도 좁힌다', async () => {
    at('/components/button?view=designer');
    await userEvent.type(search(), 'Layout');
    expect(nav().getByRole('link', { name: 'Stack' })).toBeTruthy();
    expect(nav().getByRole('link', { name: 'Divider' })).toBeTruthy();
    expect(nav().queryByRole('link', { name: 'Button' })).toBeNull();
  });

  /** 컴포넌트 검색이 앱의 다른 화면으로 가는 길을 지우지 않는다. */
  it('Foundation·검증 항목은 검색어와 무관하게 남는다', async () => {
    at('/components/button?view=designer');
    await userEvent.type(search(), 'zzzz');
    expect(nav().getByRole('link', { name: 'Tokens' })).toBeTruthy();
    expect(nav().getByRole('link', { name: 'Styles' })).toBeTruthy();
    expect(nav().getByRole('link', { name: '개요' })).toBeTruthy();
  });

  it('일치하는 컴포넌트가 없으면 빈 목록이 아니라 상태를 알린다', async () => {
    at('/components/button?view=designer');
    await userEvent.type(search(), 'zzzz');
    expect(nav().queryByRole('link', { name: 'Button' })).toBeNull();
    expect(nav().getByRole('status')).toBeTruthy();
  });

  it('검색 후에도 이동이 view=designer 를 유지한다', async () => {
    at('/components/button?view=designer');
    await userEvent.type(search(), 'popo');
    await userEvent.click(nav().getByRole('link', { name: 'Popover' }));
    expect(url()).toBe('/components/popover?view=designer');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Popover');
  });

  it('지원하지 않는 경로에서도 사이드바로 회복할 수 있다', async () => {
    at('/tokens?view=designer');
    expect(screen.getByTestId('designer-unsupported')).toBeTruthy();
    await userEvent.click(nav().getByRole('link', { name: 'Stack' }));
    expect(url()).toBe('/components/stack?view=designer');
    expect(screen.getByTestId('designer-workspace')).toBeTruthy();
  });
});

describe('Designer Canvas', () => {
  const scenarios = () => within(screen.getByRole('group', { name: 'Scenario' }));
  const activeChip = () =>
    scenarios()
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-pressed') === 'true')?.textContent;

  /** 모든 definition 이 Designer 에서 실제로 그려지는지 — 하나라도 비면 여기서 걸린다. */
  it.each(allPresentations().map((p) => [p.data.label, p.data.path, p.data.defaultScenarioId]))(
    '%s canvas 가 default scenario 를 그린다',
    (label, path, defaultScenarioId) => {
      at(`${path}?view=designer`);
      const canvas = screen.getByTestId('designer-canvas');
      expect(canvas.childElementCount).toBeGreaterThan(0);
      expect(screen.getByRole('heading', { level: 2, name: `Canvas · ${label}` })).toBeTruthy();

      const definition = allPresentations().find((p) => p.data.path === path);
      const expected = definition?.data.scenarios.find((s) => s.id === defaultScenarioId)?.label;
      expect(activeChip()).toBe(expected);
    },
  );

  it('scenario 선택은 상호배타이고 canvas 를 바꾼다', async () => {
    at('/components/button?view=designer');
    expect(
      scenarios()
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(1);

    await userEvent.click(scenarios().getByRole('button', { name: 'Loading End' }));
    expect(activeChip()).toBe('Loading End');
    expect(
      within(screen.getByTestId('designer-canvas')).getByRole('button', { name: 'Loading End' }),
    ).toBeTruthy();
  });

  /** 이전 컴포넌트의 scenario id 가 남아 빈 canvas 나 예외를 만들지 않아야 한다. */
  it('컴포넌트를 바꾸면 그 definition 의 default scenario 로 돌아간다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(scenarios().getByRole('button', { name: 'Full Width Button' }));
    expect(activeChip()).toBe('Full Width Button');

    const nav = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    await userEvent.click(nav.getByRole('link', { name: 'FAB' }));

    const fab = allPresentations().find((p) => p.data.id === 'fab');
    const expected = fab?.data.scenarios.find((s) => s.id === fab.data.defaultScenarioId)?.label;
    expect(activeChip()).toBe(expected);
    expect(screen.getByTestId('designer-canvas').childElementCount).toBeGreaterThan(0);
  });

  /** interactive preview 를 숨기지 않는다 — Designer canvas 안에서도 실제로 동작해야 한다. */
  it('Popover scenario 가 canvas 안에서 열린다', async () => {
    at('/components/popover?view=designer');
    const canvas = within(screen.getByTestId('designer-canvas'));
    const trigger = canvas.getByRole('button', { name: '도움말 열기' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('Select scenario 가 canvas 안에서 열린다', async () => {
    at('/components/select?view=designer');
    const canvas = within(screen.getByTestId('designer-canvas'));
    const trigger = canvas.getAllByRole('combobox')[0];
    expect(trigger).toBeTruthy();
    await userEvent.click(trigger);
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });
});

describe('Variant Matrix', () => {
  const matrix = () => within(screen.getByTestId('variant-matrix'));

  it('definition 이 선언한 두 축만 비교한다 — 곱해서 만들지 않는다', () => {
    at('/components/button?view=designer');
    const button = allPresentations().find((p) => p.data.id === 'button');
    const spec = button?.data.comparison?.variantMatrix;
    expect(spec).toBeTruthy();

    const cols = spec!.columns.options;
    const rows = spec!.rows!.options;

    // 열 머리: 행 축 이름 칸 + 각 열 옵션
    expect(matrix().getAllByRole('columnheader')).toHaveLength(cols.length + 1);
    expect(matrix().getAllByRole('rowheader')).toHaveLength(rows.length);
    // cell 수는 정확히 두 축의 곱이고 그 이상이 아니다.
    expect(matrix().getAllByRole('cell')).toHaveLength(cols.length * rows.length);
  });

  it('실제 supported variant 가 열 머리에 있다', () => {
    at('/components/button?view=designer');
    const headers = matrix()
      .getAllByRole('columnheader')
      .map((el) => el.textContent);
    for (const label of ['Contained', 'Outlined', 'Text']) {
      expect(headers).toContain(label);
    }
  });

  it('cell 이 Canvas 와 같은 adapter 로 실제 컴포넌트를 그린다', () => {
    at('/components/button?view=designer');
    const cells = matrix().getAllByRole('cell');
    for (const cell of cells) {
      expect(cell.querySelector('.ui-button')).toBeTruthy();
    }
    // 축 값이 실제로 cell 에 반영된다.
    expect(
      cells.filter((c) => c.querySelector('.ui-button--variant-outlined')).length,
    ).toBeGreaterThan(0);
  });

  it('좁은 화면을 위한 keyboard-scrollable 영역 안에 있다', () => {
    at('/components/button?view=designer');
    const region = screen.getByRole('region', { name: 'Button variant 비교 표' });
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(within(region).getByTestId('variant-matrix')).toBeTruthy();
  });

  it('축이 부적절한 컴포넌트는 matrix 를 만들지 않는다', () => {
    at('/components/divider?view=designer');
    expect(screen.queryByTestId('variant-matrix')).toBeNull();
    expect(screen.queryByTestId('state-matrix')).toBeNull();
    // 빈 UI 를 이유 없이 남기지 않는다.
    expect(
      within(screen.getByTestId('comparison-notes')).getAllByRole('listitem').length,
    ).toBeGreaterThan(0);
  });
});

describe('State Matrix', () => {
  const matrix = () => within(screen.getByTestId('state-matrix'));

  it('prop 으로 재현되는 state 만 cell 이 된다', () => {
    at('/components/button?view=designer');
    const headers = matrix()
      .getAllByRole('columnheader')
      .map((el) => el.textContent);
    expect(headers).toEqual(['기본', 'Disabled', 'Loading']);
  });

  /** 이 Command 의 핵심 금지 사항 — pseudo-state 가 cell 로 위조되지 않는다. */
  it('hover · focus · pressed cell 이 없다', () => {
    at('/components/button?view=designer');
    const headers = matrix()
      .getAllByRole('columnheader')
      .map((el) => (el.textContent ?? '').toLowerCase());
    for (const fake of ['hover', 'focus', 'pressed', 'active']) {
      expect(headers.some((h) => h.includes(fake))).toBe(false);
    }
  });

  it('재현할 수 없는 state 는 한계를 글로 밝힌다', () => {
    at('/components/button?view=designer');
    const notice = screen.getByTestId('interactive-only').textContent ?? '';
    expect(notice).toContain('hover');
    expect(notice).toContain('focus-visible');
    expect(notice).toContain('active');
  });

  it('disabled cell 이 실제로 disabled 다', () => {
    at('/components/button?view=designer');
    const cells = matrix().getAllByRole('cell');
    const disabled = cells.filter((c) => c.querySelector('button[disabled]'));
    expect(disabled.length).toBeGreaterThan(0);
  });

  /** TextField 의 focused 는 FormControl 의 실제 공개 prop 이라 고정 preview 가 성립한다. */
  it('TextField 는 focused 를 실제 prop 으로 재현한다', () => {
    at('/components/text-field?view=designer');
    const headers = matrix()
      .getAllByRole('columnheader')
      .map((el) => el.textContent);
    expect(headers).toContain('Focused');
    expect(
      matrix()
        .getAllByRole('cell')
        .filter((c) => c.querySelector('.ui-input-base--focused')).length,
    ).toBeGreaterThan(0);
  });

  /** SearchField 는 focused prop 이 없으므로 cell 이 아니라 한계로만 나온다. */
  it('SearchField 는 focused 를 cell 로 만들지 않는다', () => {
    at('/components/search-field?view=designer');
    const headers = matrix()
      .getAllByRole('columnheader')
      .map((el) => el.textContent);
    expect(headers).not.toContain('Focused');
    expect(screen.getByTestId('interactive-only').textContent).toContain('focus');
  });

  it('Popover 는 open 을 실제 controlled prop 으로 재현한다', () => {
    at('/components/popover?view=designer');
    const openCell = matrix()
      .getAllByRole('cell')
      .find((c) => c.querySelector('[aria-expanded="true"]'));
    expect(openCell).toBeTruthy();
  });

  it('state prop 이 없는 컴포넌트는 State Matrix 가 없다', () => {
    at('/components/stack?view=designer');
    expect(screen.queryByTestId('state-matrix')).toBeNull();
    expect(screen.getByTestId('variant-matrix')).toBeTruthy();
  });
});

describe('Properties Inspector', () => {
  const inspector = () => within(screen.getByTestId('properties-inspector'));
  const canvas = () => within(screen.getByTestId('designer-canvas'));
  const scenarios = () => within(screen.getByRole('group', { name: 'Scenario' }));

  it('curated subset 만 보여준다 — catalog dump 가 아니다', () => {
    at('/components/button?view=designer');
    const declared = allPresentations().find((p) => p.data.id === 'button')!.data.comparison!
      .properties;
    // Button 의 public prop 은 14개지만 Inspector 는 고른 것만 그린다.
    expect(declared.length).toBeLessThan(14);
    for (const property of declared) {
      if (property.control.kind === 'enum') {
        expect(inspector().getByRole('group', { name: property.label })).toBeTruthy();
      } else {
        expect(inspector().getByRole('checkbox', { name: property.label })).toBeTruthy();
      }
    }
  });

  it('React prop 이름이 아니라 designer 라벨을 쓴다', () => {
    at('/components/button?view=designer');
    expect(inspector().getByRole('group', { name: 'Style' })).toBeTruthy();
    expect(inspector().queryByRole('group', { name: 'variant' })).toBeNull();
  });

  it('override 는 Canvas 에만 적용되고 Matrix 는 그대로다', async () => {
    at('/components/button?view=designer');
    expect(canvas().getByRole('button').className).toContain('ui-button--variant-contained');

    const style = within(inspector().getByRole('group', { name: 'Style' }));
    await userEvent.click(style.getByRole('button', { name: 'Outlined' }));

    expect(canvas().getByRole('button').className).toContain('ui-button--variant-outlined');
    // Matrix 는 자기 축 값을 그대로 쓴다 — override 에 끌려가지 않는다.
    const matrixCells = within(screen.getByTestId('variant-matrix')).getAllByRole('cell');
    expect(
      matrixCells.filter((c) => c.querySelector('.ui-button--variant-contained')).length,
    ).toBeGreaterThan(0);
  });

  it('boolean 은 checkbox 시맨틱이고 Canvas 에 반영된다', async () => {
    at('/components/button?view=designer');
    const disabled = inspector().getByRole('checkbox', { name: 'Disabled' }) as HTMLInputElement;
    expect(disabled.type).toBe('checkbox');
    expect(disabled.checked).toBe(false);

    await userEvent.click(disabled);
    expect(disabled.checked).toBe(true);
    expect(canvas().getByRole('button')).toHaveProperty('disabled', true);
  });

  it('같은 값을 다시 누르면 override 가 걷힌다', async () => {
    at('/components/button?view=designer');
    const style = within(inspector().getByRole('group', { name: 'Style' }));
    await userEvent.click(style.getByRole('button', { name: 'Text' }));
    expect(canvas().getByRole('button').className).toContain('ui-button--variant-text');

    await userEvent.click(style.getByRole('button', { name: 'Text' }));
    expect(canvas().getByRole('button').className).toContain('ui-button--variant-contained');
  });

  it('scenario 를 바꾸면 override 가 남지 않는다', async () => {
    at('/components/button?view=designer');
    const style = within(inspector().getByRole('group', { name: 'Style' }));
    await userEvent.click(style.getByRole('button', { name: 'Outlined' }));
    expect(screen.getByTestId('properties-inspector').textContent).toContain('초기화');

    await userEvent.click(scenarios().getByRole('button', { name: 'Large' }));
    expect(canvas().getByRole('button').className).toContain('ui-button--size-lg');
    expect(canvas().getByRole('button').className).toContain('ui-button--variant-contained');
    expect(screen.getByTestId('properties-inspector').textContent).not.toContain('초기화');
  });

  it('컴포넌트를 바꾸면 그 컴포넌트가 선언한 property 만 남는다', async () => {
    at('/components/button?view=designer');
    expect(inspector().getByRole('checkbox', { name: 'Loading' })).toBeTruthy();

    const nav = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    await userEvent.click(nav.getByRole('link', { name: 'Stack' }));

    // Stack 은 Loading 을 선언하지 않는다.
    expect(inspector().queryByRole('checkbox', { name: 'Loading' })).toBeNull();
    expect(inspector().getByRole('group', { name: 'Direction' })).toBeTruthy();
  });

  it('초기화로 모든 override 를 걷는다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(inspector().getByRole('checkbox', { name: 'Disabled' }));
    await userEvent.click(
      within(inspector().getByRole('group', { name: 'Style' })).getByRole('button', {
        name: 'Text',
      }),
    );
    await userEvent.click(inspector().getByRole('button', { name: '초기화' }));

    expect(canvas().getByRole('button').className).toContain('ui-button--variant-contained');
    expect(canvas().getByRole('button')).toHaveProperty('disabled', false);
  });

  it('property 를 선언하지 않은 컴포넌트는 그 사실을 알린다', () => {
    at('/components/divider?view=designer');
    expect(inspector().getByRole('status')).toBeTruthy();
  });

  /** 키보드만으로 조작 가능해야 한다 — Chip·Checkbox 모두 native 컨트롤이다. */
  it('키보드로 property 를 바꿀 수 있다', async () => {
    at('/components/button?view=designer');
    const outlined = within(inspector().getByRole('group', { name: 'Style' })).getByRole('button', {
      name: 'Outlined',
    });
    outlined.focus();
    expect(document.activeElement).toBe(outlined);

    await userEvent.keyboard('{Enter}');
    expect(canvas().getByRole('button').className).toContain('ui-button--variant-outlined');

    const disabled = inspector().getByRole('checkbox', { name: 'Disabled' });
    disabled.focus();
    await userEvent.keyboard(' ');
    expect(disabled).toHaveProperty('checked', true);
  });
});

describe('Token Inspector', () => {
  const inspector = () => within(screen.getByTestId('token-inspector'));
  const status = () => screen.getByTestId('copy-status');
  const themeTo = (name: string) =>
    userEvent.selectOptions(screen.getByTestId('theme-select'), name);

  const rowText = () => screen.getByTestId('token-inspector').textContent ?? '';

  it('token id · CSS 변수 · 현재 테마 값을 보여준다', () => {
    at('/components/button?view=designer');
    const text = rowText();
    expect(text).toContain('color.primaryBtn.default');
    // CSS 변수는 catalog 가 적어 둔 그대로여야 한다 — 유도한 이름이 아니다.
    expect(text).toContain('--ds-primary-btn-default');
    const light = resolveToken('color.primaryBtn.default', 'light');
    expect(light.ok).toBe(true);
    if (light.ok) expect(text).toContain(light.token.value);
  });

  it('CSS 변수를 이름 규칙으로 유도하지 않는다', () => {
    at('/components/button?view=designer');
    // spacing.md 의 변수는 --ds-spacing-md 다. 첫 세그먼트를 떼는 유도라면 --ds-md 가 나온다.
    expect(rowText()).toContain('--ds-spacing-md');
    expect(rowText()).not.toMatch(/--ds-md\b/);
  });

  it('theme 을 바꾸면 값만 바뀌고 token identity 는 그대로다', async () => {
    at('/components/button?view=designer');
    const light = resolveToken('color.primaryBtn.default', 'light');
    const dark = resolveToken('color.primaryBtn.default', 'dark');
    expect(light.ok && dark.ok).toBe(true);
    if (!light.ok || !dark.ok) return;

    expect(rowText()).toContain(light.token.value);

    await themeTo('dark');
    expect(screen.getByTestId('theme-root').getAttribute('data-theme')).toBe('dark');

    const after = rowText();
    expect(after).toContain(dark.token.value);
    expect(after).not.toContain(light.token.value);
    // identity 는 theme 과 무관하다.
    expect(after).toContain('color.primaryBtn.default');
    expect(after).toContain(light.token.cssVar);
  });

  it('token 이름을 복사하고 결과를 알린다', async () => {
    const user = userEvent.setup();
    at('/components/button?view=designer');
    expect(status().textContent).toBe('');

    await user.click(
      inspector().getByRole('button', { name: 'color.primaryBtn.default 이름 복사' }),
    );

    expect(await navigator.clipboard.readText()).toBe('color.primaryBtn.default');
    expect(status().textContent).toContain('복사했습니다');
    expect(status().getAttribute('aria-live')).toBe('polite');
  });

  it('CSS 변수를 복사한다', async () => {
    const user = userEvent.setup();
    at('/components/button?view=designer');

    await user.click(
      inspector().getByRole('button', { name: '--ds-primary-btn-default 변수 복사' }),
    );

    expect(await navigator.clipboard.readText()).toBe('--ds-primary-btn-default');
    expect(status().textContent).toContain('--ds-primary-btn-default');
  });

  it('키보드만으로 두 복사 동작을 실행한다', async () => {
    const user = userEvent.setup();
    at('/components/button?view=designer');

    const nameButton = inspector().getByRole('button', {
      name: 'component.pressedOffset 이름 복사',
    });
    nameButton.focus();
    expect(document.activeElement).toBe(nameButton);
    await user.keyboard('{Enter}');
    expect(await navigator.clipboard.readText()).toBe('component.pressedOffset');

    const varButton = inspector().getByRole('button', {
      name: '--ds-component-pressed-offset 변수 복사',
    });
    varButton.focus();
    await user.keyboard(' ');
    expect(await navigator.clipboard.readText()).toBe('--ds-component-pressed-offset');
  });

  /** 실패를 성공처럼 보이게 하지 않는다. */
  it('복사가 실패하면 실패를 알린다', async () => {
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    });

    try {
      at('/components/button?view=designer');
      await userEvent.click(
        inspector().getByRole('button', { name: 'component.pressedOffset 이름 복사' }),
      );
      expect(status().textContent).toContain('복사하지 못했습니다');
      expect(status().textContent).not.toContain('복사했습니다');
    } finally {
      Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    }
  });

  it('컴포넌트를 바꾸면 관련 없는 token row 가 사라진다', async () => {
    at('/components/button?view=designer');
    expect(rowText()).toContain('color.primaryBtn.default');

    const nav = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    await userEvent.click(nav.getByRole('link', { name: 'Divider' }));

    const text = rowText();
    expect(text).not.toContain('color.primaryBtn.default');
    expect(text).toContain('borderWidth.semantic.divider');
    expect(text).toContain('color.stroke.light');
  });

  /** state 로 좁힌 binding 은 그 state 를 켰을 때만 나온다. */
  it('state 로 좁힌 binding 은 그 state 에서만 보인다', async () => {
    at('/components/button?view=designer');
    expect(rowText()).not.toContain('color.primaryBtn.disabled');

    const properties = within(screen.getByTestId('properties-inspector'));
    await userEvent.click(properties.getByRole('checkbox', { name: 'Disabled' }));

    expect(rowText()).toContain('color.primaryBtn.disabled');
  });

  /** scenario 로 좁힌 binding 도 같은 규칙을 따른다. */
  it('scenario 로 좁힌 binding 은 그 scenario 에서만 보인다', async () => {
    at('/components/button?view=designer');
    expect(rowText()).not.toContain('motion.duration.slower');

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Scenario' })).getByRole('button', {
        name: 'Loading End',
      }),
    );
    expect(rowText()).toContain('motion.duration.slower');
  });

  it('근거가 없는 컴포넌트는 추측한 token 대신 introspect 불가를 알린다', () => {
    at('/components/stack?view=designer');
    expect(inspector().getByRole('status').textContent).toContain('introspect');
    // 가짜 token 을 그리지 않는다.
    expect(rowText()).not.toMatch(/--ds-/);
    // 이유를 밝힌다.
    expect(
      within(screen.getByTestId('token-notes')).getAllByRole('listitem').length,
    ).toBeGreaterThan(0);
  });

  it('lineage 를 지원한다고 표시하지 않는다', () => {
    at('/components/button?view=designer');
    const limit = screen.getByTestId('lineage-limit').textContent ?? '';
    expect(limit).toContain('Not currently introspectable');
    expect(limit).toContain('lineage');
  });

  it('독립 labelled region 이다 — 좁은 화면에서 drawer 로 감쌀 수 있다', () => {
    at('/components/button?view=designer');
    expect(screen.getByRole('region', { name: 'Token Inspector' })).toBeTruthy();
  });
});

/**
 * 좁은 화면 Designer.
 *
 * 폭에 따라 region 을 한 벌만 mount 하므로, 어느 폭을 보는 중인지 테스트가 선언해야 한다.
 * jsdom 에는 `matchMedia` 가 없어서 기본값은 wide 다 — 위 suite 들이 그 상태를 본다.
 * 여기서는 좁은 폭을 stub 해서 sheet 동작을 본다.
 */
describe('Designer 좁은 화면', () => {
  let original: typeof window.matchMedia | undefined;

  beforeEach(() => {
    original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    if (original === undefined) {
      delete (window as { matchMedia?: unknown }).matchMedia;
    } else {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });

  it('데스크톱 세 열을 줄여 넣지 않고 compact 배치를 쓴다', () => {
    at('/components/button?view=designer');
    expect(screen.getByTestId('designer-compact')).toBeTruthy();
    expect(screen.queryByTestId('designer-wide')).toBeNull();
  });

  it('Canvas 는 그대로 보이고 Inspector 는 trigger 뒤에 있다', () => {
    at('/components/button?view=designer');
    expect(screen.getByTestId('designer-canvas')).toBeTruthy();
    // Inspector 내용이 Canvas 아래에 항상 펼쳐져 있지 않다.
    expect(screen.queryByTestId('token-inspector')).toBeNull();
    expect(screen.getByTestId('inspector-sheet-trigger')).toBeTruthy();
    // 컴포넌트 이동은 전역 메뉴가 맡는다 — Designer 전용 목록을 만들지 않는다.
    expect(screen.queryByTestId('library-sheet-trigger')).toBeNull();
    expect(screen.getByTestId('open-menu')).toBeTruthy();
  });

  it('현재 컴포넌트 identity 가 계속 보인다', () => {
    at('/components/button?view=designer');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Button');
  });

  it.each([['inspector-sheet', 'Inspector', 'Inspector 닫기']])(
    '%s 는 이름 있는 dialog 이고 trigger 가 상태를 알린다',
    async (testId, name, closeLabel) => {
      at('/components/button?view=designer');
      const trigger = screen.getByTestId(`${testId}-trigger`);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeNull();

      await userEvent.click(trigger);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(trigger.getAttribute('aria-controls')).toBeTruthy();
      const panel = screen.getByRole('dialog', { name });
      expect(panel).toBeTruthy();
      expect(within(panel).getByRole('button', { name: closeLabel })).toBeTruthy();
    },
  );

  it('열면 포커스가 패널 안으로 들어간다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(screen.getByTestId('inspector-sheet-trigger'));
    const panel = screen.getByRole('dialog', { name: 'Inspector' });
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('Escape 로 닫고 포커스가 trigger 로 돌아온다', async () => {
    at('/components/button?view=designer');
    const trigger = screen.getByTestId('inspector-sheet-trigger');
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Inspector' })).toBeTruthy();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Inspector' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('닫기 버튼으로 닫아도 포커스가 trigger 로 돌아온다', async () => {
    at('/components/button?view=designer');
    const trigger = screen.getByTestId('inspector-sheet-trigger');
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Inspector 닫기' }));

    expect(screen.queryByRole('dialog', { name: 'Inspector' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  /** 좁은 화면의 컴포넌트 이동은 전역 드로어가 맡는다 — 검색도 그 안에 함께 있다. */
  it('전역 드로어에서 검색해 컴포넌트를 고르면 view 가 유지된다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(screen.getByTestId('open-menu'));
    const drawer = within(screen.getByTestId('menu-drawer'));

    await userEvent.type(drawer.getByRole('searchbox', { name: '컴포넌트 검색' }), 'divi');
    await userEvent.click(drawer.getByRole('link', { name: 'Divider' }));

    expect(url()).toBe('/components/divider?view=designer');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Divider');
    // 이동하면 드로어는 할 일이 끝났다.
    expect(screen.queryByTestId('menu-drawer')).toBeNull();
  });

  it('Inspector sheet 안에서 property 를 바꾸면 Canvas 에 반영된다', async () => {
    at('/components/button?view=designer');
    await userEvent.click(screen.getByTestId('inspector-sheet-trigger'));
    const panel = screen.getByRole('dialog', { name: 'Inspector' });

    await userEvent.click(
      within(within(panel).getByRole('group', { name: 'Style' })).getByRole('button', {
        name: 'Outlined',
      }),
    );

    expect(within(screen.getByTestId('designer-canvas')).getByRole('button').className).toContain(
      'ui-button--variant-outlined',
    );
  });

  /**
   * 전역 메뉴와 Designer sheet 는 다른 컨트롤이다 — 이름도 대상도 겹치지 않고, Designer 트리거를
   * 전역 햄버거로 위장하지도 않는다.
   *
   * 사이드바 landmark 수는 단언하지 않는다. AppShell 의 데스크톱 사이드바는 `hidden lg:block`
   * 이라 좁은 폭에서 `display: none` 이고 브라우저 접근성 트리에서 빠지지만, jsdom 은 CSS 를
   * 적용하지 않아 드로어 사본과 함께 둘로 보인다 — 그건 여기서 볼 것이 아니다.
   */
  it('AppShell 전역 메뉴와 이름·대상이 겹치지 않는다', async () => {
    at('/components/button?view=designer');
    const globalMenu = screen.getByTestId('open-menu');
    const inspectorTrigger = screen.getByTestId('inspector-sheet-trigger');

    // 전역 메뉴는 아이콘 버튼, Designer 트리거는 글자가 있는 버튼이다.
    expect(globalMenu.getAttribute('aria-label')).toBe('메뉴 열기');
    expect(inspectorTrigger.textContent).toBe('Inspector');

    await userEvent.click(inspectorTrigger);
    const sheetTarget = inspectorTrigger.getAttribute('aria-controls');
    expect(sheetTarget).toBeTruthy();

    expect(document.getElementById(sheetTarget as string)).not.toBeNull();
    expect(sheetTarget).not.toBe(globalMenu.getAttribute('aria-controls'));

    await userEvent.click(globalMenu);

    /*
      전역 메뉴를 열면 sheet 는 바깥 클릭으로 닫힌다 — 둘이 동시에 화면을 다투지 않는다.
      Popover 가 주는 동작이고, 둘 다 열려 있게 두는 것보다 낫다.
    */
    expect(screen.getByTestId('menu-drawer')).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Inspector' })).toBeNull();
    expect(inspectorTrigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('SkipLink 와 #main 이 좁은 화면에서도 유지된다', () => {
    at('/components/button?view=designer');
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' }).getAttribute('href')).toBe(
      '#main',
    );
    expect(document.getElementById('main')?.getAttribute('tabindex')).toBe('-1');
  });
});
