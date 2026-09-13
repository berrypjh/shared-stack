import { themes } from '@berrypjh/react-ui';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import App from '../app';
import { resolveToken, tokenIdsInCategory } from '../presentation/tokenCatalog';
import { NAV } from '../shell/nav';

import { colorFamilies } from './colorPalette';

/**
 * 라우팅 스모크. 각 화면이 예외 없이 그려지고, E2E 가 의존하는 앵커가 살아있는지 본다.
 * 계산 로직은 verification/checks.spec.ts, 값 정합성은 design-tokens 가 담당한다.
 */
const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('라우팅', () => {
  /**
   * 경로 목록을 여기 다시 적지 않는다 — `NAV` 에서 파생한다. 손으로 적으면 페이지를 늘렸을 때
   * 스모크만 조용히 낡아, 새 페이지가 어느 테스트에도 걸리지 않은 채 남는다.
   *
   * 제목으로 확인하는 이유는 사이드바 라벨과 도착한 화면의 h1 이 **같은 문장**이어야 하기
   * 때문이다. 다르면 누른 이름과 도착지의 이름이 갈린다.
   */
  it.each(NAV.flatMap((g) => g.items).map((i) => [i.path, i.label]))(
    '%s 가 "%s" 제목으로 렌더된다',
    (path, label) => {
      at(path);
      expect(screen.getByRole('heading', { level: 1, name: label })).toBeTruthy();
    },
  );
});

/**
 * 아이콘만 있는 컨트롤은 보이는 글자가 없어 이름을 빠뜨리기 쉽다 — 실제로 이 페이지의
 * IconButton 15개가 전부 이름 없이 렌더되고 있었다 (WCAG 4.1.2). 타입이 TypeScript 소비자를
 * 막지만, 렌더 결과에서도 한 번 더 확인한다.
 */
describe('접근 가능한 이름', () => {
  it.each([['/components/icon-button'], ['/components/fab'], ['/components/button']])(
    '%s 의 모든 버튼이 이름을 갖는다',
    (path) => {
      at(path);

      const all = screen.getAllByRole('button');
      // 이름 매처는 dom-accessibility-api 로 실제 접근 가능한 이름을 계산한다.
      const named = screen.getAllByRole('button', { name: /\S/ });

      expect(all.length).toBeGreaterThan(0);
      expect(named).toHaveLength(all.length);
    },
  );
});

describe('전역 컨트롤', () => {
  it('어느 페이지에서든 같은 자리에 있다', () => {
    at('/tokens');
    const select = screen.getByTestId('theme-select') as HTMLSelectElement;
    // themes.ts 에 줄을 더하면 여기에 자동으로 나타난다.
    expect(select.options.length).toBe(themes.length);
  });

  it('현재 테마와 프로필을 루트 속성으로 노출한다', () => {
    at('/');
    const root = screen.getByTestId('theme-root');
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});

describe('반응형 메뉴', () => {
  /** jsdom 은 미디어 쿼리를 적용하지 않으므로 드로어의 열림·닫힘 동작만 본다. */
  it('처음에는 드로어가 닫혀 있다', () => {
    at('/');
    expect(screen.queryByTestId('menu-drawer')).toBeNull();
    expect(screen.getByTestId('open-menu').getAttribute('aria-expanded')).toBe('false');
  });

  it('메뉴 버튼으로 열고 배경을 눌러 닫는다', async () => {
    at('/');
    await userEvent.click(screen.getByTestId('open-menu'));
    expect(screen.getByTestId('menu-drawer')).toBeTruthy();
    expect(screen.getByTestId('open-menu').getAttribute('aria-expanded')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }));
    expect(screen.queryByTestId('menu-drawer')).toBeNull();
  });

  it('Esc 로 닫는다', async () => {
    at('/');
    await userEvent.click(screen.getByTestId('open-menu'));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByTestId('menu-drawer')).toBeNull();
  });

  it('메뉴에서 이동하면 드로어가 닫힌다', async () => {
    at('/');
    await userEvent.click(screen.getByTestId('open-menu'));
    const drawer = within(screen.getByTestId('menu-drawer'));
    await userEvent.click(drawer.getByRole('link', { name: 'Tokens' }));
    expect(screen.queryByTestId('menu-drawer')).toBeNull();
    expect(screen.getByTestId('tokens-page')).toBeTruthy();
  });
});

describe('배경 층', () => {
  /** jsdom 은 Tailwind 를 계산하지 않으므로 층위는 클래스로 확인한다. */
  it('셸 바깥 캔버스와 셸 안이 다른 배경을 쓴다', () => {
    at('/');
    const root = screen.getByTestId('theme-root');
    const shell = root.querySelector(':scope > div.flex');
    expect(root.className.split(/\s+/)).toContain('bg-[var(--demo-canvas)]');
    expect(shell?.className.split(/\s+/)).toContain('bg-background-default');
  });
});

describe('사이드바 묶음', () => {
  const nav = () => within(screen.getByRole('navigation', { name: '주요 메뉴' }));

  /** 묶음 이름도 `NAV` 에서 파생한다 — 여기 다시 적으면 IA 가 바뀔 때 함께 낡는다. */
  it('묶음마다 이름 붙은 목록을 갖는다', () => {
    at('/');
    for (const name of NAV.map((g) => g.label).filter(Boolean)) {
      expect(nav().getByRole('list', { name: name as string })).toBeTruthy();
    }
  });

  it('묶음마다 하나씩, 서로 떨어진 블록으로 그려진다', () => {
    at('/');
    const groups = screen.getAllByTestId('nav-group');
    expect(groups).toHaveLength(NAV.length);
    for (const g of groups) {
      // 사이드바는 surface, 블록은 default. 두 색은 세 테마 모두 다르다.
      expect(g.className.split(/\s+/)).toContain('bg-background-default');
    }
  });

  /**
   * 현재 항목과 호버가 같은 배경을 쓰면 스쳐 지나가는 행이 선택된 것처럼 보인다.
   * jsdom 은 Tailwind 를 계산하지 않으므로 배경 클래스끼리 비교한다.
   */
  it('현재 항목과 호버가 다른 배경을 쓴다', () => {
    at('/tokens');
    const bg = (el: Element, prefix = '') =>
      el.className.split(/\s+/).find((c) => c.startsWith(`${prefix}bg-`));
    const active = bg(nav().getByRole('link', { name: 'Tokens' }));
    const hover = bg(nav().getByRole('link', { name: 'Styles' }), 'hover:')?.slice('hover:'.length);
    expect(active).toBeTruthy();
    expect(hover).toBeTruthy();
    expect(active).not.toBe(hover);
  });

  it('묶음 이름은 링크가 아니다', () => {
    at('/');
    const links = nav()
      .getAllByRole('link')
      .map((el) => el.textContent);
    for (const name of ['검증', 'Foundation', '컴포넌트']) {
      expect(links).not.toContain(name);
    }
  });

  /**
   * jsdom 은 Tailwind 를 계산하지 않으므로 층위는 클래스로 확인한다. 둘이 같은 색이면 층이 없다.
   * `hover:text-text-default` 같은 변형에 걸리지 않도록 클래스 토큰 단위로 본다.
   */
  it('묶음 이름과 항목이 같은 색이 아니다', () => {
    at('/');
    const classes = (el: Element) => el.className.split(/\s+/);
    expect(classes(nav().getByText('컴포넌트'))).toContain('text-text-light');
    expect(classes(nav().getByRole('link', { name: 'Button' }))).toContain('text-text-default');
  });
});

describe('사이드바 현재 위치', () => {
  const currentLinks = () =>
    screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('aria-current') === 'page')
      .map((el) => el.textContent);

  it('하위 경로에서 상위 항목까지 켜지지 않는다', () => {
    at('/components/button');
    expect(currentLinks()).toEqual(['Button']);
  });

  it('상위 경로에서는 그 항목만 켜진다', () => {
    at('/verify');
    expect(currentLinks()).toEqual(['Runtime']);
  });

  it('루트가 다른 페이지를 가로채지 않는다', () => {
    at('/tokens');
    expect(currentLinks()).toEqual(['Tokens']);
  });
});

describe('E2E 앵커', () => {
  it.each([
    ['/', 'overview-page'],
    ['/verify', 'verify-page'],
    ['/tokens', 'tokens-page'],
    ['/foundation', 'foundation-page'],
  ])('%s 가 %s 앵커를 갖는다', (path, testId) => {
    at(path);
    expect(screen.getByTestId(testId)).toBeTruthy();
  });

  it('Runtime 화면이 계약 상태 앵커를 갖는다', async () => {
    at('/verify');
    for (const id of ['themed', 'shared', 'derived', 'react-ui', 'tailwind']) {
      expect(await screen.findByTestId(`check-${id}`)).toBeTruthy();
    }
  });

  it('Runtime 화면이 측정 probe 를 갖는다', () => {
    at('/verify');
    for (const id of ['probe-background-primary', 'probe-background-error', 'probe-spacing-md']) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });
});

/**
 * Popover 는 portal 을 쓰지 않아 패널이 DOM 상 그 자리에 그려진다. 이 화면이 있는 이유가
 * 그 통합이라, 라우트 스모크만으로는 부족하고 열림·닫힘까지 본다.
 */
describe('Popover 페이지', () => {
  it('트리거로 열고 Escape 로 닫는다', async () => {
    at('/components/popover');
    const trigger = screen.getByRole('button', { name: '도움말 열기' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await userEvent.keyboard('{Escape}');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('dialog 패널은 이름을 갖는다', async () => {
    at('/components/popover');
    await userEvent.click(screen.getByRole('button', { name: '계정 메뉴' }));
    expect(screen.getByRole('dialog', { name: '계정 메뉴' })).toBeTruthy();
  });
});

describe('토큰 검색', () => {
  it('검색 입력이 있다', () => {
    at('/tokens');
    expect(screen.getByTestId('token-search')).toBeTruthy();
  });
});

describe('토큰 정렬', () => {
  /** 표의 첫 열(토큰 이름)을 위에서 아래로 읽는다. */
  const names = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((tr) => tr.querySelector('td')?.textContent ?? '');

  const search = async (q: string) => {
    at('/tokens');
    await userEvent.type(screen.getByTestId('token-search'), q);
  };

  it('간격은 작은 값에서 큰 값 순이다', async () => {
    at('/tokens');
    await userEvent.click(screen.getByRole('button', { name: 'spacing' }));
    expect(names()).toEqual([
      'spacing.2xs',
      'spacing.xs',
      'spacing.sm',
      'spacing.md',
      'spacing.lg',
      'spacing.xl',
      'spacing.2xl',
      'spacing.3xl',
      'spacing.4xl',
      'spacing.5xl',
      'spacing.6xl',
      'spacing.7xl',
    ]);
  });

  it('글자 크기는 작은 값에서 큰 값 순이다', async () => {
    await search('typography.fontSize.');
    expect(names()).toEqual([
      'typography.fontSize.xxsm',
      'typography.fontSize.xsm',
      'typography.fontSize.sm',
      'typography.fontSize.md',
      'typography.fontSize.lg',
      'typography.fontSize.xl',
      'typography.fontSize.xxl',
      'typography.fontSize.3xl',
      'typography.fontSize.4xl',
      'typography.fontSize.5xl',
      'typography.fontSize.6xl',
      'typography.fontSize.7xl',
    ]);
  });

  it('굵기는 가벼운 값에서 무거운 값 순이다', async () => {
    await search('typography.fontWeight.');
    expect(names()).toEqual([
      'typography.fontWeight.light',
      'typography.fontWeight.regular',
      'typography.fontWeight.semiBold',
      'typography.fontWeight.bold',
      'typography.fontWeight.extraBold',
    ]);
  });

  it('색은 비교할 수 없으므로 원래 순서를 지킨다', async () => {
    await search('color.primary.pr');
    expect(names()).toEqual([
      'color.primary.pr100',
      'color.primary.pr200',
      'color.primary.pr300',
      'color.primary.pr400',
      'color.primary.pr500',
      'color.primary.pr600',
      'color.primary.pr700',
      'color.primary.pr800',
      'color.primary.pr900',
    ]);
  });
});

/**
 * 선택 상태는 클래스가 아니라 **시맨틱**으로 확인한다.
 *
 * 카테고리는 상호배타 toggle 이라 `Chip` 의 `aria-pressed`, 열은 서로 독립이라 `Checkbox` 의
 * `checked` 다. 두 컨트롤이 갈리는 것 자체가 의도이므로 테스트도 갈라서 본다.
 */
describe('토큰 선택 표시', () => {
  const pressed = (el: HTMLElement) => el.getAttribute('aria-pressed');

  it('선택한 카테고리만 눌린 상태다', async () => {
    at('/tokens');
    const all = screen.getByRole('button', { name: '전체' });
    const spacing = screen.getByRole('button', { name: 'spacing' });
    expect([pressed(all), pressed(spacing)]).toEqual(['true', 'false']);

    await userEvent.click(spacing);
    expect([pressed(all), pressed(spacing)]).toEqual(['false', 'true']);
  });

  it('켜진 열은 체크된 checkbox 다', async () => {
    at('/tokens');
    const box = screen.getByTestId('token-column-preview') as HTMLInputElement;
    expect(box.type).toBe('checkbox');
    expect(box.checked).toBe(true);

    await userEvent.click(box);
    expect(box.checked).toBe(false);
  });
});

describe('토큰 열 표시', () => {
  const header = () => screen.getAllByRole('columnheader').map((el) => el.textContent);

  it('처음에는 세 열이 모두 켜져 있다', () => {
    at('/tokens');
    expect(header()).toEqual(['토큰', '값', 'CSS 변수', '미리보기']);
  });

  it.each([
    ['value', '값'],
    ['cssVar', 'CSS 변수'],
    ['preview', '미리보기'],
  ])('%s 열을 끄면 표에서 사라진다', async (id, label) => {
    at('/tokens');
    await userEvent.click(screen.getByTestId(`token-column-${id}`));
    expect(header()).not.toContain(label);
  });

  it('끈 열은 다시 켤 수 있다', async () => {
    at('/tokens');
    const box = screen.getByTestId('token-column-preview') as HTMLInputElement;
    await userEvent.click(box);
    expect(box.checked).toBe(false);
    await userEvent.click(box);
    expect(box.checked).toBe(true);
    expect(header()).toContain('미리보기');
  });

  it('모두 꺼도 토큰 이름 열은 남는다', async () => {
    at('/tokens');
    for (const id of ['value', 'cssVar', 'preview']) {
      await userEvent.click(screen.getByTestId(`token-column-${id}`));
    }
    expect(header()).toEqual(['토큰']);
  });
});

/**
 * CSS 변수는 공개 token catalog 에서 온다.
 *
 * 예전에는 경로에서 이름 규칙으로 유도했고, 첫 세그먼트를 항상 떼는 방식이라 565개 중 281개가
 * 실제 변수와 달랐다 — `spacing.md` 의 변수를 `--ds-md` 로 보여 주고 있었다. 규칙을 고치는
 * 대신 artifact 를 읽게 했으므로, 그 회귀를 여기서 고정한다.
 */
describe('토큰 CSS 변수', () => {
  const rowFor = async (path: string) => {
    at('/tokens');
    await userEvent.type(screen.getByTestId('token-search'), path);
    return screen.getAllByRole('row').find((tr) => tr.querySelector('td')?.textContent === path);
  };

  it.each([
    ['spacing.md', '--ds-spacing-md'],
    ['color.text.default', '--ds-text-default'],
    ['component.pressedOffset', '--ds-component-pressed-offset'],
  ])('%s 의 변수는 %s 다', async (path, cssVar) => {
    const row = await rowFor(path);
    expect(row?.textContent).toContain(cssVar);
  });

  it('첫 세그먼트를 떼는 옛 유도 결과를 보여주지 않는다', async () => {
    const row = await rowFor('spacing.md');
    expect(row?.textContent).not.toMatch(/--ds-md\b/);
  });
});

/**
 * 색 팔레트.
 *
 * 값·CSS 변수를 페이지가 들고 있지 않다 — 공개 token artifact 에서 읽는다. 그래서 테스트도
 * 기대값을 손으로 적지 않고 adapter 에서 가져와 비교한다.
 */
describe('색 팔레트', () => {
  it('램프와 시맨틱 두 묶음을 그린다', () => {
    at('/palette');
    expect(screen.getByRole('heading', { level: 1, name: 'Palette' })).toBeTruthy();
    expect(screen.getByTestId('palette-ramps')).toBeTruthy();
    expect(screen.getByTestId('palette-semantic')).toBeTruthy();
  });

  it('registry 의 모든 색 계열을 담는다', () => {
    at('/palette');
    const families = colorFamilies(tokenIdsInCategory('color'));
    expect(families.length).toBeGreaterThan(5);
    for (const family of families) {
      expect(screen.getByRole('heading', { level: 3, name: family.name })).toBeTruthy();
    }
  });

  it('catalog 의 정확한 CSS 변수를 보여준다 — 이름 규칙으로 유도하지 않는다', () => {
    at('/palette');
    const chip = screen.getByTestId('palette-chip-color.text.default').textContent ?? '';
    expect(chip).toContain('--ds-text-default');
    expect(chip).toContain('default');
  });

  /** 색만으로 뜻을 전달하지 않는다 — 이름과 값이 글자로 함께 있다. */
  it('칩마다 키와 해석된 값을 글자로 적는다', () => {
    at('/palette');
    const light = resolveToken('color.neutral.ne100', 'light');
    expect(light.ok).toBe(true);
    if (!light.ok) return;

    const ramps = screen.getByTestId('palette-ramps').textContent ?? '';
    expect(ramps).toContain('ne100');
    expect(ramps).toContain(light.token.value);
  });

  /**
   * 같은 칩을 보고 비교한다. 묶음 전체 글자로 비교하면 안 된다 — 한 테마에서 다른 역할이
   * 같은 hex 를 쓰는 일이 정상이라 "사라졌는지" 를 판정할 수 없다.
   */
  it('테마를 바꾸면 값만 바뀌고 token 이름과 변수는 그대로다', async () => {
    at('/palette');
    const light = resolveToken('color.text.default', 'light');
    const dark = resolveToken('color.text.default', 'dark');
    expect(light.ok && dark.ok).toBe(true);
    if (!light.ok || !dark.ok) return;
    expect(light.token.value).not.toBe(dark.token.value);

    const chip = () => screen.getByTestId('palette-chip-color.text.default').textContent ?? '';
    expect(chip()).toContain(light.token.value);

    await userEvent.selectOptions(screen.getByTestId('theme-select'), 'dark');

    expect(chip()).toContain(dark.token.value);
    expect(chip()).not.toContain(light.token.value);
    // identity 는 테마와 무관하다.
    expect(chip()).toContain('--ds-text-default');
  });
});
