/**
 * List·ListItem 계약.
 *
 * 이 둘은 **semantic HTML helper** 다 — `<ul>`/`<ol>` 과 `<li>` 의 의미를 보존하고 토큰 기반
 * 여백·마커 정책을 붙이는 것이 전부다.
 *
 * 아닌 것: menu·listbox·select options·navigation 프레임워크. 그 셋은 각각 다른 ARIA 계약과
 * 키보드 모델을 요구하고 이미 `Select`(listbox)·`SearchField`(combobox 제안 목록)가 소유한다.
 * `MenuItem` 도 여기 쓰이지 않는다 — 그것은 `Select` 의 선언적 슬롯 마커(`return null`)다.
 *
 * **상호작용은 자식이 가진다.** `ListItem` 에 `onClick` 을 두어 버튼을 흉내 내지 않는다 —
 * 소비자가 `<a>`/`<button>` 을 자식으로 넣는다.
 */
import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import * as barrel from './index';
import { List } from './List';
import { listClasses } from './List.constants';
import { ListItem } from './ListItem';

describe('<List />', () => {
  const { render } = createRenderer();

  describeConformance(<List>{null}</List>, () => ({
    render,
    classes: { root: listClasses.root },
    refInstanceof: HTMLUListElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('시맨틱 요소', () => {
    it('기본값은 ul 이다', () => {
      const { container } = render(
        <List>
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(container.firstChild).toHaveProperty('nodeName', 'UL');
    });

    it('ordered 를 주면 ol 이다', () => {
      const { container } = render(
        <List ordered>
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(container.firstChild).toHaveProperty('nodeName', 'OL');
    });

    it('자식을 native li 로 담는다', () => {
      render(
        <List>
          <ListItem>하나</ListItem>
          <ListItem>둘</ListItem>
        </List>,
      );

      const items = screen.getAllByRole('listitem');

      expect(items).toHaveLength(2);
      for (const item of items) {
        expect(item).toHaveProperty('nodeName', 'LI');
      }
    });

    it('ref 가 루트 리스트를 가리킨다', () => {
      const ref = createRef<HTMLUListElement>();

      render(
        <List ref={ref} data-testid="list">
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(ref.current).toBe(screen.getByTestId('list'));
    });

    it('List 전용 prop 을 DOM 속성으로 흘리지 않는다', () => {
      render(
        <List data-testid="list" ordered marker>
          <ListItem>하나</ListItem>
        </List>,
      );

      const attributes = screen.getByTestId('list').getAttributeNames();

      for (const own of ['ordered', 'marker']) {
        expect(attributes).not.toContain(own);
      }
    });
  });

  /**
   * ARIA 를 덧붙이지 않는 것이 기본이다.
   *
   * 예외가 하나 있고 그것은 조건부다 — 아래 `마커 없는 목록의 시맨틱 보존` 참조.
   */
  describe('불필요한 ARIA 를 붙이지 않는다', () => {
    it('menu·listbox 역할을 만들지 않는다', () => {
      render(
        <List>
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(screen.queryByRole('menu')).toBeNull();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(screen.queryByRole('menuitem')).toBeNull();
      expect(screen.queryByRole('option')).toBeNull();
    });

    it('마커를 보이면 role 을 덧붙이지 않는다 — native 시맨틱이 온전하다', () => {
      render(
        <List data-testid="list" marker>
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(screen.getByTestId('list')).not.toHaveAttribute('role');
    });

    it('ListItem 에 role 을 붙이지 않는다', () => {
      render(
        <List>
          <ListItem data-testid="item">하나</ListItem>
        </List>,
      );

      expect(screen.getByTestId('item')).not.toHaveAttribute('role');
    });

    it('선택·상호작용 상태를 만들지 않는다', () => {
      render(
        <List>
          <ListItem data-testid="item">하나</ListItem>
        </List>,
      );

      const item = screen.getByTestId('item');

      expect(item).not.toHaveAttribute('tabindex');
      expect(item).not.toHaveAttribute('aria-selected');
      expect(item).not.toHaveAttribute('aria-current');
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  /**
   * `list-style: none` 은 **WebKit 에서 목록 시맨틱을 지운다** — Safari·VoiceOver 가 그 `<ul>` 을
   * 목록으로 알리지 않아 "항목 3개 중 1번째" 를 잃는다. 디자인 시스템 기본값이 마커 없음이라
   * 이 컴포넌트의 존재 이유(시맨틱 보존)가 기본 경로에서 사라지는 셈이다.
   *
   * 그래서 **마커를 지운 경우에만** `role="list"` 로 복구한다. 무조건 붙이지 않는다 — 원인이
   * 있는 곳에만 정확히 대응하고, `marker` 를 켜면 role 이 사라진다(위 테스트).
   */
  describe('마커 없는 목록의 시맨틱 보존', () => {
    it('기본값(마커 없음)에서 목록으로 알린다', () => {
      render(
        <List>
          <ListItem>하나</ListItem>
          <ListItem>둘</ListItem>
        </List>,
      );

      // role="list" 든 native ul 이든 접근성 트리에서는 list 다.
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('마커를 지웠을 때만 role="list" 를 단다', () => {
      render(
        <List data-testid="list">
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(screen.getByTestId('list')).toHaveAttribute('role', 'list');
    });

    it('소비자 role 이 이긴다 — 시맨틱을 가로채지 않는다', () => {
      render(
        <List data-testid="list" role="presentation">
          <ListItem>하나</ListItem>
        </List>,
      );

      expect(screen.getByTestId('list')).toHaveAttribute('role', 'presentation');
    });
  });

  describe('중첩', () => {
    it('ListItem 안에 List 를 담을 수 있다', () => {
      render(
        <List data-testid="outer">
          <ListItem data-testid="outer-item">
            상위
            <List data-testid="inner">
              <ListItem>하위</ListItem>
            </List>
          </ListItem>
        </List>,
      );

      const outerItem = screen.getByTestId('outer-item');
      const inner = screen.getByTestId('inner');

      // 중첩 목록은 상위 li 안에 있어야 유효한 HTML 이다.
      expect(outerItem).toContainElement(inner);
      expect(screen.getAllByRole('list')).toHaveLength(2);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('중첩 목록도 ordered 를 독립적으로 가진다', () => {
      render(
        <List>
          <ListItem>
            상위
            <List ordered data-testid="inner">
              <ListItem>하위</ListItem>
            </List>
          </ListItem>
        </List>,
      );

      expect(screen.getByTestId('inner')).toHaveProperty('nodeName', 'OL');
    });
  });

  /**
   * 상호작용은 **자식이 가진다.** `ListItem` 이 클릭을 받는 것이 아니라 소비자가 native
   * control 을 넣는다 — 그래서 키보드·포커스·disabled 를 브라우저가 이미 옳게 한다.
   */
  describe('상호작용 자식', () => {
    it('링크 자식이 그대로 링크로 남는다', () => {
      render(
        <List>
          <ListItem>
            <a href="/tokens">토큰</a>
          </ListItem>
        </List>,
      );

      const link = screen.getByRole('link', { name: '토큰' });

      expect(link).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toContainElement(link);
    });

    it('버튼 자식이 그대로 버튼으로 남는다', () => {
      render(
        <List>
          <ListItem>
            <button type="button">실행</button>
          </ListItem>
        </List>,
      );

      expect(screen.getByRole('button', { name: '실행' })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('자식 control 이 탭 순서를 가진다 — li 가 아니다', async () => {
      const { user } = render(
        <List>
          <ListItem data-testid="item">
            <a href="/a">첫째</a>
          </ListItem>
        </List>,
      );

      await user.tab();

      expect(screen.getByRole('link', { name: '첫째' })).toHaveFocus();
      expect(screen.getByTestId('item')).not.toHaveFocus();
    });
  });
});

describe('<ListItem />', () => {
  const { render } = createRenderer();

  describeConformance(<ListItem>하나</ListItem>, () => ({
    render,
    classes: { root: listClasses.item },
    refInstanceof: HTMLLIElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  it('li 로 렌더하고 children 을 담는다', () => {
    const { container } = render(<ListItem>하나</ListItem>);

    expect(container.firstChild).toHaveProperty('nodeName', 'LI');
    expect(screen.getByText('하나')).toBeInTheDocument();
  });

  it('ref 가 루트 li 를 가리킨다', () => {
    const ref = createRef<HTMLLIElement>();

    render(<ListItem ref={ref}>하나</ListItem>);

    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });
});

describe('공개 배럴', () => {
  it('List·ListItem·클래스만 내보낸다 — ListItemButton/Text/Icon 은 없다', () => {
    expect(Object.keys(barrel).sort()).toEqual(['List', 'ListItem', 'listClasses']);
  });
});
