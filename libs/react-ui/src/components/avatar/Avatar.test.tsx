/**
 * Avatar 계약.
 *
 * Avatar 는 **정적 identity visual** 이다. 이미지가 있으면 `<img>` 로 그리고, 없거나 실패하면
 * fallback 을 그린다. 상호작용은 없다 — 누를 수 있는 identity 컨트롤이 필요하면 소비자가
 * `ButtonBase`/`IconButton` 으로 감싼다.
 *
 * 접근성의 핵심은 **같은 정보를 두 번 읽히지 않는 것**이다. 그래서 이미지와 fallback 은
 * 동시에 렌더되지 않고(둘 중 하나만), `alt` 를 준 fallback 은 루트가 `role="img"` +
 * `aria-label` 로 이름을 갖고 시각 글자는 트리에서 감춘다.
 */
import { createRef } from 'react';

import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Avatar } from './Avatar';
import { avatarClasses } from './Avatar.constants';
import type { AvatarProps } from './Avatar.types';
import * as barrel from './index';

const SRC = 'https://example.test/avatar.png';

describe('<Avatar />', () => {
  const { render } = createRenderer();

  /**
   * `polymorphicProp` 은 제외한다 — Avatar 는 `component` prop 을 열지 않는다. 루트 element 를
   * 바꾸면 `<img>`/`role="img"` 로 세운 시맨틱을 소비자가 조용히 무너뜨릴 수 있고, `Box` 도
   * 같은 이유로 polymorphic 이 아니다 (polymorphic 은 ButtonBase 계열 관례다).
   */
  describeConformance(<Avatar>길동</Avatar>, () => ({
    render,
    classes: avatarClasses,
    refInstanceof: HTMLSpanElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('루트', () => {
    it('span 으로 렌더하고 기본 클래스를 유지한다', () => {
      const { container } = render(<Avatar data-testid="avatar">길동</Avatar>);

      expect(container.firstChild).toHaveProperty('nodeName', 'SPAN');
      expect(screen.getByTestId('avatar')).toHaveClass(avatarClasses.root);
    });

    it('ref 가 루트 span 을 가리킨다', () => {
      const ref = createRef<HTMLSpanElement>();

      render(
        <Avatar ref={ref} data-testid="avatar">
          길동
        </Avatar>,
      );

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current).toBe(screen.getByTestId('avatar'));
    });

    it('임의 DOM prop 을 루트로 전달한다', () => {
      render(
        <Avatar data-testid="avatar" title="프로필" id="a1">
          길동
        </Avatar>,
      );

      const root = screen.getByTestId('avatar');

      expect(root).toHaveAttribute('title', '프로필');
      expect(root).toHaveAttribute('id', 'a1');
    });

    it('Avatar 전용 prop 을 DOM 속성으로 흘리지 않는다', () => {
      render(
        <Avatar data-testid="avatar" src={SRC} alt="홍길동" size="lg" shape="rounded">
          길동
        </Avatar>,
      );

      const attributes = screen.getByTestId('avatar').getAttributeNames();

      for (const own of ['src', 'alt', 'size', 'shape']) {
        expect(attributes).not.toContain(own);
      }
    });

    it('키보드 시맨틱을 만들지 않는다', () => {
      render(
        <Avatar data-testid="avatar" src={SRC} alt="홍길동">
          길동
        </Avatar>,
      );

      const root = screen.getByTestId('avatar');

      expect(root).not.toHaveAttribute('tabindex');
      expect(root).not.toHaveAttribute('role', 'button');
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('이미지', () => {
    it('src 를 주면 img 를 렌더한다', () => {
      render(<Avatar src={SRC} alt="홍길동" />);

      const img = screen.getByRole('img', { name: '홍길동' });

      expect(img).toHaveProperty('nodeName', 'IMG');
      expect(img).toHaveAttribute('src', SRC);
      expect(img).toHaveClass(avatarClasses.image);
    });

    it('alt 를 img 로 전달한다 — 이름을 지어내지 않는다', () => {
      render(<Avatar src={SRC} alt="홍길동" />);

      expect(screen.getByRole('img')).toHaveAttribute('alt', '홍길동');
    });

    it('alt 를 주지 않으면 빈 alt 로 렌더해 트리에서 빠진다', () => {
      // 이름 없는 `<img>` 는 스크린리더가 파일명을 읽는다. 기본 문자열을 지어내는 대신
      // 장식으로 둔다 — 이름이 필요하면 소비자가 `alt` 를 준다.
      const { container } = render(<Avatar src={SRC} />);
      const img = container.querySelector('img');

      expect(img).toHaveAttribute('alt', '');
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('alt="" 는 장식 이미지다', () => {
      const { container } = render(<Avatar src={SRC} alt="" />);

      expect(container.querySelector('img')).toHaveAttribute('alt', '');
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('이미지가 보이는 동안 fallback 을 렌더하지 않는다 — 중복 낭독 방지', () => {
      render(
        <Avatar src={SRC} alt="홍길동">
          길동
        </Avatar>,
      );

      expect(screen.getByRole('img', { name: '홍길동' })).toBeInTheDocument();
      expect(screen.queryByText('길동')).toBeNull();
    });
  });

  describe('fallback', () => {
    it('src 가 없으면 fallback 을 렌더한다', () => {
      render(<Avatar data-testid="avatar">길동</Avatar>);

      expect(screen.getByTestId('avatar').querySelector('img')).toBeNull();
      expect(screen.getByText('길동')).toHaveClass(avatarClasses.fallback);
    });

    it('alt 를 주면 루트가 role="img" + aria-label 로 이름을 갖는다', () => {
      render(<Avatar alt="홍길동">길동</Avatar>);

      const root = screen.getByRole('img', { name: '홍길동' });

      expect(root).toHaveClass(avatarClasses.root);
    });

    it('이름을 가진 fallback 의 시각 글자는 트리에서 감춘다 — 중복 낭독 방지', () => {
      render(<Avatar alt="홍길동">길동</Avatar>);

      // 루트가 "홍길동" 으로 읽히므로 "길동" 가 따라 읽히면 같은 사람을 두 번 말하게 된다.
      expect(screen.getByText('길동')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('img', { name: '홍길동' })).toBeInTheDocument();
    });

    it('alt="" 는 fallback 을 장식으로 둔다', () => {
      render(
        <Avatar data-testid="avatar" alt="">
          길동
        </Avatar>,
      );

      const root = screen.getByTestId('avatar');

      expect(root).not.toHaveAttribute('role');
      expect(root).not.toHaveAttribute('aria-label');
      expect(screen.getByText('길동')).toHaveAttribute('aria-hidden', 'true');
    });

    it('alt 가 없으면 fallback 글자를 감추지 않는다 — 보이는 글자가 그대로 읽힌다', () => {
      render(<Avatar data-testid="avatar">길동</Avatar>);

      const root = screen.getByTestId('avatar');

      expect(root).not.toHaveAttribute('role');
      expect(screen.getByText('길동')).not.toHaveAttribute('aria-hidden');
    });

    it('fallback 이 없으면 빈 루트로 남는다 — 자리만 지킨다', () => {
      render(<Avatar data-testid="avatar" />);

      const root = screen.getByTestId('avatar');

      expect(root).toBeEmptyDOMElement();
      expect(root).toHaveClass(avatarClasses.root);
    });
  });

  describe('이미지 실패', () => {
    it('error 가 나면 fallback 으로 바꾼다', () => {
      const { container } = render(
        <Avatar src={SRC} alt="홍길동">
          길동
        </Avatar>,
      );

      const img = container.querySelector('img');

      expect(img).not.toBeNull();
      fireEvent.error(img as HTMLImageElement);

      expect(container.querySelector('img')).toBeNull();
      expect(screen.getByRole('img', { name: '홍길동' })).toHaveClass(avatarClasses.root);
      expect(screen.getByText('길동')).toHaveAttribute('aria-hidden', 'true');
    });

    it('소비자 onError 를 삼키지 않는다', () => {
      const onError = vi.fn();
      const { container } = render(<Avatar src={SRC} alt="홍길동" onError={onError} />);

      fireEvent.error(container.querySelector('img') as HTMLImageElement);

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('src 가 바뀌면 실패 상태를 초기화하고 다시 시도한다', () => {
      const { container, setProps } = render(
        <Avatar src={SRC} alt="홍길동">
          길동
        </Avatar>,
      );

      fireEvent.error(container.querySelector('img') as HTMLImageElement);
      expect(container.querySelector('img')).toBeNull();

      const next = 'https://example.test/next.png';
      setProps({ src: next } as Partial<AvatarProps>);

      // 실패한 URL 에 상태를 매어 두므로 새 URL 은 깨끗하게 다시 시도된다.
      expect(container.querySelector('img')).toHaveAttribute('src', next);
    });
  });

  describe('size', () => {
    it('기본값은 md 다', () => {
      render(<Avatar data-testid="avatar">길동</Avatar>);

      expect(screen.getByTestId('avatar')).toHaveClass(avatarClasses.sizeMd);
    });

    it.each([
      ['sm', avatarClasses.sizeSm],
      ['md', avatarClasses.sizeMd],
      ['lg', avatarClasses.sizeLg],
    ] as const)('size=%s 에 %s 클래스를 준다', (size, expected) => {
      render(
        <Avatar data-testid="avatar" size={size}>
          길동
        </Avatar>,
      );

      expect(screen.getByTestId('avatar')).toHaveClass(expected);
    });
  });

  describe('shape', () => {
    it('기본값은 circle 이다', () => {
      render(<Avatar data-testid="avatar">길동</Avatar>);

      expect(screen.getByTestId('avatar')).toHaveClass(avatarClasses.shapeCircle);
    });

    it.each([
      ['circle', avatarClasses.shapeCircle],
      ['rounded', avatarClasses.shapeRounded],
    ] as const)('shape=%s 에 %s 클래스를 준다', (shape, expected) => {
      render(
        <Avatar data-testid="avatar" shape={shape}>
          길동
        </Avatar>,
      );

      expect(screen.getByTestId('avatar')).toHaveClass(expected);
    });
  });

  describe('공개 배럴', () => {
    it('컴포넌트·클래스·타입만 내보낸다', () => {
      expect(Object.keys(barrel).sort()).toEqual(['Avatar', 'avatarClasses']);
    });
  });
});
