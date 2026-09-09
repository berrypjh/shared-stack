import { act, fireEvent, screen } from '@testing-library/react';
import type { ButtonHTMLAttributes, HTMLAttributes, Ref } from 'react';
import { spy } from 'sinon';
import { beforeAll, describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { ButtonBase } from './ButtonBase';
import { buttonBaseClasses } from './ButtonBase.constants';

describe('<ButtonBase />', () => {
  const { render } = createRenderer();

  let canFireDragEvents = true;

  const supportsTouch = () => typeof window.TouchEvent !== 'undefined';

  beforeAll(() => {
    try {
      const EventConstructor = window.DragEvent ?? window.Event;
      new EventConstructor('dragend');
    } catch {
      canFireDragEvents = false;
    }
  });

  describeConformance(<ButtonBase>hello</ButtonBase>, () => ({
    render,
    classes: buttonBaseClasses,
    refInstanceof: HTMLButtonElement,
    polymorphicPropName: 'component',
    testPolymorphicPropWith: 'a',
  }));

  describe('root node', () => {
    it('type이 "button"이면 role="button"을 적용하지 않는다', () => {
      render(<ButtonBase type="button">Hello</ButtonBase>);
      expect(screen.getByText('Hello')).not.toHaveAttribute('role');
    });

    it('href가 제공되면 버튼을 자동으로 anchor 요소로 변경한다', () => {
      const { container } = render(<ButtonBase href="https://google.com">Hello</ButtonBase>);
      const button = container.firstChild;

      expect(button).toHaveProperty('nodeName', 'A');
      expect(button).not.toHaveAttribute('role');
      expect(button).not.toHaveAttribute('type');
      expect(button).toHaveAttribute('href', 'https://google.com');
    });

    it('href 없이 anchor를 사용하면 role="button"을 적용한다', () => {
      render(<ButtonBase component="a">Hello</ButtonBase>);
      const button = screen.getByRole('button');

      expect(button).toHaveProperty('nodeName', 'A');
      expect(button).not.toHaveAttribute('type');
    });

    it('props를 다시 주입할 수 있다', () => {
      const { setProps } = render(<ButtonBase disabled={false}>hello</ButtonBase>);

      setProps({ disabled: true });

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  /**
   * 시각 어휘 클래스는 공개 스타일 계약이다 — `dist/index.css` 가 이 이름으로 팔레트를 싣고
   * 소비자가 같은 이름으로 덮어쓴다. 그래서 상수가 아니라 문자열 리터럴로 고정한다.
   *
   * `getButtonBaseClassNames` 가 세 호스트 분기 모두에서 이 클래스를 만드는 유일한 지점인데
   * 지금까지 어느 테스트도 결과를 검사하지 않았다.
   */
  describe('prop: variant', () => {
    it('기본값은 contained다', () => {
      render(<ButtonBase>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveClass('ui-button--variant-contained');
    });

    it.each(['contained', 'outlined', 'text'] as const)(
      '%s variant class를 적용한다',
      (variant) => {
        render(<ButtonBase variant={variant}>Hello</ButtonBase>);

        expect(screen.getByText('Hello')).toHaveClass(`ui-button--variant-${variant}`);
      },
    );
  });

  describe('prop: size', () => {
    it('기본값은 md다', () => {
      render(<ButtonBase>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveClass('ui-button--size-md');
    });

    it.each(['sm', 'md', 'lg'] as const)('%s size class를 적용한다', (size) => {
      render(<ButtonBase size={size}>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveClass(`ui-button--size-${size}`);
    });
  });

  describe('prop: color', () => {
    it('기본값은 primary다', () => {
      render(<ButtonBase>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveClass('ui-button--color-primary');
    });

    it.each(['primary', 'secondary'] as const)('%s color class를 적용한다', (color) => {
      render(<ButtonBase color={color}>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveClass(`ui-button--color-${color}`);
    });
  });

  describe('prop: fullWidth', () => {
    it('기본적으로 fullWidth class를 붙이지 않는다', () => {
      render(<ButtonBase>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).not.toHaveClass('ui-button--fullWidth');
    });

    it('fullWidth class를 적용한다', () => {
      render(<ButtonBase fullWidth>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveClass('ui-button--fullWidth');
    });
  });

  describe('시각 어휘와 호스트 분기', () => {
    it('anchor host에도 같은 어휘 클래스를 적용한다', () => {
      render(
        <ButtonBase href="/docs" variant="outlined" size="lg" color="secondary" fullWidth>
          Hello
        </ButtonBase>,
      );

      const link = screen.getByRole('link');

      expect(link).toHaveClass('ui-button--variant-outlined');
      expect(link).toHaveClass('ui-button--size-lg');
      expect(link).toHaveClass('ui-button--color-secondary');
      expect(link).toHaveClass('ui-button--fullWidth');
    });

    it('custom host에도 같은 어휘 클래스를 적용한다', () => {
      render(
        <ButtonBase component="div" variant="text" size="sm" color="secondary">
          Hello
        </ButtonBase>,
      );

      const host = screen.getByRole('button');

      expect(host).toHaveClass('ui-button--variant-text');
      expect(host).toHaveClass('ui-button--size-sm');
      expect(host).toHaveClass('ui-button--color-secondary');
    });

    it('시각 어휘 prop을 DOM 속성으로 흘리지 않는다', () => {
      render(
        <ButtonBase variant="outlined" size="lg" color="secondary" fullWidth>
          Hello
        </ButtonBase>,
      );

      const button = screen.getByRole('button');

      for (const prop of ['variant', 'size', 'color', 'fullwidth']) {
        expect(button).not.toHaveAttribute(prop);
      }
    });
  });

  describe('prop: type', () => {
    it('기본값은 button이다', () => {
      render(<ButtonBase />);

      expect(screen.getByRole('button')).toHaveProperty('type', 'button');
    });

    it('다른 button type으로 변경할 수 있다', () => {
      render(<ButtonBase type="submit" />);

      expect(screen.getByRole('button')).toHaveProperty('type', 'submit');
    });

    it('anchor component에도 type을 전달한다', () => {
      render(<ButtonBase component="a" href="some-recording.ogg" download type="audio/ogg" />);

      const link = screen.getByRole('link');

      expect(link).toHaveAttribute('type', 'audio/ogg');
      expect(link).toHaveProperty('type', 'audio/ogg');
    });

    it('custom component에도 type을 전달한다', () => {
      type CustomButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
        ref?: Ref<HTMLButtonElement>;
      };

      const CustomButton = ({ ref, ...props }: CustomButtonProps) => (
        <button ref={ref} {...props} />
      );

      render(<ButtonBase component={CustomButton} type="reset" />);

      expect(screen.getByRole('button')).toHaveProperty('type', 'reset');
    });
  });

  describe('prop: disabled', () => {
    it('disabled면 negative tabIndex를 가진다', () => {
      render(<ButtonBase disabled>Hello</ButtonBase>);
      expect(screen.getByText('Hello')).toHaveProperty('tabIndex', -1);
    });

    it('native button에 disabled를 전달한다', () => {
      render(<ButtonBase disabled>Hello</ButtonBase>);

      expect(screen.getByText('Hello')).toHaveProperty('disabled', true);
    });

    it('button host에서는 aria-disabled를 사용하지 않는다', () => {
      render(<ButtonBase disabled>Hello</ButtonBase>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('disabled');
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('non-native host에서는 aria-disabled를 사용한다', () => {
      const { setProps } = render(
        <ButtonBase component="div" disabled>
          Hello
        </ButtonBase>,
      );

      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveProperty('tabIndex', -1);

      setProps({ disabled: false });

      expect(button).not.toHaveAttribute('aria-disabled');
      expect(button).toHaveProperty('tabIndex', 0);
    });

    it('disabled된 non-native host는 click를 막는다', async () => {
      const parentClickSpy = spy();
      const buttonClickSpy = spy();

      const { user } = render(
        <div onClick={parentClickSpy}>
          <ButtonBase component="div" disabled onClick={buttonClickSpy}>
            Hello
          </ButtonBase>
        </div>,
      );

      await user.click(screen.getByRole('button'));

      expect(buttonClickSpy.callCount).toBe(0);
      expect(parentClickSpy.callCount).toBe(0);
    });
  });

  describe('event callbacks', () => {
    it('이벤트 콜백들을 정상적으로 호출한다', async () => {
      const onClick = spy();
      const onBlur = spy();
      const onFocus = spy();
      const onKeyUp = spy();
      const onKeyDown = spy();
      const onMouseDown = spy();
      const onMouseLeave = spy();
      const onMouseUp = spy();
      const onContextMenu = spy();
      const onDragEnd = spy();
      const onTouchStart = spy();
      const onTouchEnd = spy();

      const { user } = render(
        <ButtonBase
          onClick={onClick}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onContextMenu={onContextMenu}
          onDragEnd={onDragEnd}
          onTouchEnd={onTouchEnd}
          onTouchStart={onTouchStart}
        >
          Hello
        </ButtonBase>,
      );

      const button = screen.getByRole('button', { name: 'Hello' });

      // touch 이벤트를 지원하는 환경에서만 실행
      if (supportsTouch()) {
        fireEvent.touchStart(button, {
          touches: [{ identifier: 0, target: button, clientX: 0, clientY: 0 }],
        });
        expect(onTouchStart.callCount).toBe(1);

        fireEvent.touchEnd(button, {
          changedTouches: [{ identifier: 0, target: button, clientX: 0, clientY: 0 }],
        });
        expect(onTouchEnd.callCount).toBe(1);
      }

      // drag 이벤트를 생성할 수 있는 환경에서만 실행
      if (canFireDragEvents) {
        fireEvent.dragEnd(button);
        expect(onDragEnd.callCount).toBe(1);
      }

      fireEvent.mouseDown(button);
      expect(onMouseDown.callCount).toBe(1);

      fireEvent.mouseUp(button);
      expect(onMouseUp.callCount).toBe(1);

      fireEvent.contextMenu(button);
      expect(onContextMenu.callCount).toBe(1);

      await user.click(button);
      expect(onClick.callCount).toBe(1);

      await act(async () => {
        button.focus();
      });
      expect(onFocus.callCount).toBe(1);

      fireEvent.keyDown(button, { key: 'Enter' });
      expect(onKeyDown.callCount).toBe(1);

      fireEvent.keyUp(button, { key: 'Enter' });
      expect(onKeyUp.callCount).toBe(1);

      await act(async () => {
        button.blur();
      });
      expect(onBlur.callCount).toBe(1);

      fireEvent.mouseLeave(button);
      expect(onMouseLeave.callCount).toBe(1);
    });

    it('non-native button에서 Enter 키를 누르면 click 이벤트가 전파된다', async () => {
      const parentClickSpy = spy();
      const buttonClickSpy = spy();

      const { user } = render(
        <div onClick={parentClickSpy}>
          <ButtonBase onClick={buttonClickSpy} component="div">
            Hello
          </ButtonBase>
        </div>,
      );

      await user.tab();
      await user.keyboard('{Enter}');

      expect(buttonClickSpy.callCount).toBe(1);
      expect(parentClickSpy.callCount).toBe(1);
    });

    it('non-native button에서 Space 키를 떼면 click 이벤트가 전파된다', async () => {
      const parentClickSpy = spy();
      const buttonClickSpy = spy();

      const { user } = render(
        <div onClick={parentClickSpy}>
          <ButtonBase onClick={buttonClickSpy} component="div">
            Hello
          </ButtonBase>
        </div>,
      );

      await user.tab();
      await user.keyboard(' ');

      expect(buttonClickSpy.callCount).toBe(1);
      expect(parentClickSpy.callCount).toBe(1);
    });
  });

  describe('prop: component', () => {
    it('ref prop을 받는 custom link component를 사용할 수 있다', () => {
      type LinkProps = HTMLAttributes<HTMLDivElement> & {
        ref?: Ref<HTMLDivElement>;
      };

      const Link = ({ ref, ...props }: LinkProps) => (
        <div data-testid="link" ref={ref} {...props} />
      );

      render(<ButtonBase component={Link}>Hello</ButtonBase>);

      const link = screen.getByTestId('link');

      expect(link).toHaveAttribute('role', 'button');
      expect(link).toHaveAttribute('tabindex', '0');
    });

    it('custom component에서도 disabled 시 aria-disabled와 tabIndex가 적용된다', () => {
      type LinkProps = HTMLAttributes<HTMLDivElement> & {
        ref?: Ref<HTMLDivElement>;
      };

      const Link = ({ ref, ...props }: LinkProps) => (
        <div data-testid="link" ref={ref} {...props} />
      );

      render(
        <ButtonBase component={Link} disabled>
          Hello
        </ButtonBase>,
      );

      const link = screen.getByTestId('link');

      expect(link).toHaveAttribute('role', 'button');
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });
});
