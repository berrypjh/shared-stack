/**
 * FormControl ↔ InputLabel ↔ Input ↔ FormHelperText 통합 계약. 공개 컴포넌트만 조립한다.
 *
 * 단위 테스트는 각 컴포넌트가 상태를 **어떻게 푸는지**를 본다 (`prop ?? context ?? 기본값`).
 * 여기서는 조립이 끝난 필드가 **사용자와 보조 기술에게 무엇으로 보이는지**만 본다 —
 * 접근 가능한 이름·설명, `required`, `aria-invalid`, native `disabled`, 그리고 진짜 포커스 이동.
 *
 * 클래스는 focus 에만 쓴다. web 에서 focus 는 CSS 로만 드러나서 그것이 관찰면이기 때문이다.
 * 나머지는 전부 DOM 속성과 접근성 트리로 단언한다. 동시 상태의 **색** 우선순위는 마지막
 * describe 가 실제 SCSS 를 적용해 따로 본다.
 *
 * 여기서 **주장하지 않는 것**: `filled`·`adornedStart` 처럼 읽는 곳이 없는 context 상태.
 * 단위 테스트가 이미 현재 동작을 고정하고 있다.
 */
import { act, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { createRenderer } from '../../../test';
import { applyComponentStyles, matchingStateColorRules } from '../../../test/componentStyles';
import { FormHelperText } from '../form-helper-text';
import { formHelperTextClasses } from '../form-helper-text/FormHelperText.constants';
import { inputBaseClasses } from '../input-base';
import { InputLabel } from '../input-label';
import { inputLabelClasses } from '../input-label/InputLabel.constants';
import { PlainInput } from '../plain-input';
import { TextField } from '../text-field';

import { FormControl } from './FormControl';

const FIELD_ID = 'email';
const HELPER_ID = 'email-helper';

const LABEL_TEXT = '이메일';
const HELPER_TEXT = '회사 이메일을 입력하세요';
const ERROR_TEXT = '올바른 이메일이 아닙니다';

type FieldProps = {
  disabled?: boolean;
  error?: boolean;
  focused?: boolean;
  hiddenLabel?: boolean;
  required?: boolean;
};

/**
 * 소비자가 실제로 쓰는 수동 합성. TextField 와 달리 id 연결을 소비자가 소유한다
 * (`apps/demo-web` 의 SelectPage 가 쓰는 모양이다).
 */
const Field = (props: FieldProps) => (
  <FormControl {...props}>
    <InputLabel data-testid="label" htmlFor={FIELD_ID}>
      {LABEL_TEXT}
    </InputLabel>
    <PlainInput aria-describedby={HELPER_ID} id={FIELD_ID} />
    <FormHelperText data-testid="helper" id={HELPER_ID}>
      {HELPER_TEXT}
    </FormHelperText>
  </FormControl>
);

const input = () => screen.getByRole('textbox');
const inputRoot = () => input().parentElement as HTMLElement;
const label = () => screen.getByTestId('label');
const helper = () => screen.getByTestId('helper');

describe('FormControl 필드 통합', () => {
  const { render } = createRenderer();

  describe('라벨과 헬퍼가 입력에 실제로 연결된다', () => {
    it('라벨이 입력의 접근 가능한 이름이 된다', () => {
      render(<Field />);

      expect(label()).toHaveAttribute('for', FIELD_ID);
      expect(input()).toHaveAttribute('id', FIELD_ID);
      expect(input()).toHaveAccessibleName(LABEL_TEXT);
    });

    it('헬퍼가 입력의 접근 가능한 설명이 된다', () => {
      render(<Field />);

      expect(helper()).toHaveAttribute('id', HELPER_ID);
      expect(input()).toHaveAttribute('aria-describedby', HELPER_ID);
      expect(input()).toHaveAccessibleDescription(HELPER_TEXT);
    });

    it('hiddenLabel 이어도 이름 관계는 그대로다', () => {
      render(<Field hiddenLabel />);

      // 시각적 은닉은 `.ui-form-control--hidden-label .ui-input-label` 이 clip 으로 한다.
      // jsdom 은 SCSS 를 적용하지 않으므로 은닉 자체는 Storybook·Chromatic 몫이다.
      // 여기서 지키는 것은 "숨김이 접근성 트리에서 라벨을 지우지 않는다" 하나다.
      expect(label()).toBeInTheDocument();
      expect(label()).not.toHaveAttribute('aria-hidden');
      expect(input()).toHaveAccessibleName(LABEL_TEXT);
    });
  });

  describe('error 는 시각 상태이자 고지다', () => {
    it('FormControl error 가 aria-invalid 와 오류 문구를 함께 만든다', () => {
      render(
        <FormControl error>
          <InputLabel data-testid="label" htmlFor={FIELD_ID}>
            {LABEL_TEXT}
          </InputLabel>
          <PlainInput aria-describedby={HELPER_ID} id={FIELD_ID} />
          <FormHelperText data-testid="helper" id={HELPER_ID}>
            {ERROR_TEXT}
          </FormHelperText>
        </FormControl>,
      );

      // 고지(aria-invalid)와 읽을 수 있는 이유(설명)가 둘 다 있어야 오류가 전달된다.
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toHaveAccessibleDescription(ERROR_TEXT);
    });
  });

  describe('required', () => {
    it('FormControl required 가 native required 가 된다', () => {
      render(<Field required />);

      expect(input()).toBeRequired();
    });

    it('시각 필수 표시가 접근 가능한 이름을 오염시키지 않는다', () => {
      render(<Field required />);

      // `*` 는 보이지만 `aria-hidden` 이라 이름 계산에서 빠진다. 이름은 라벨 텍스트 그대로다.
      expect(label()).toHaveTextContent('*');
      expect(input()).toHaveAccessibleName(LABEL_TEXT);
    });
  });

  describe('포커스 권한은 FormControl 하나다', () => {
    it('입력에 포커스하면 라벨과 입력 chrome 이 함께 focused 가 된다', () => {
      render(<Field />);

      act(() => {
        input().focus();
      });

      expect(document.activeElement).toBe(input());
      expect(label()).toHaveClass(inputLabelClasses.focused);
      expect(inputRoot()).toHaveClass(inputBaseClasses.focused);
    });

    it('같은 필드 안 상호작용 장식으로 포커스가 옮겨가도 필드는 focused 로 남는다', () => {
      render(
        <FormControl>
          <InputLabel data-testid="label" htmlFor={FIELD_ID}>
            {LABEL_TEXT}
          </InputLabel>
          <PlainInput endAdornment={<button type="button">지우기</button>} id={FIELD_ID} />
        </FormControl>,
      );

      act(() => {
        input().focus();
      });

      expect(label()).toHaveClass(inputLabelClasses.focused);

      const clear = screen.getByRole('button', { name: '지우기' });

      act(() => {
        clear.focus();
      });

      // 포커스는 지우기 버튼이 가졌지만 필드를 떠난 것은 아니다. 라벨이 평상시로 돌아가면
      // 사용자는 편집 맥락을 잃는다.
      expect(document.activeElement).toBe(clear);
      expect(label()).toHaveClass(inputLabelClasses.focused);
    });

    it('필드 밖으로 포커스가 나가면 focused 가 풀린다', () => {
      render(
        <>
          <Field />
          <button type="button">밖</button>
        </>,
      );

      act(() => {
        input().focus();
      });

      expect(label()).toHaveClass(inputLabelClasses.focused);

      act(() => {
        screen.getByRole('button', { name: '밖' }).focus();
      });

      expect(label()).not.toHaveClass(inputLabelClasses.focused);
    });
  });

  describe('상속과 우선순위', () => {
    it('FormControl disabled 가 native input 을 잠근다', () => {
      render(<Field disabled />);

      expect(input()).toBeDisabled();
    });

    it('disabled 는 소비자가 준 focused 를 이긴다 — 라벨도 focused 가 되지 않는다', () => {
      render(<Field disabled focused />);

      expect(input()).toBeDisabled();
      expect(label()).not.toHaveClass(inputLabelClasses.focused);
      expect(inputRoot()).not.toHaveClass(inputBaseClasses.focused);
    });

    it('자식의 명시 prop 이 context 를 이긴다', () => {
      render(
        <FormControl disabled error required>
          <InputLabel data-testid="label" htmlFor={FIELD_ID}>
            {LABEL_TEXT}
          </InputLabel>
          <PlainInput disabled={false} error={false} id={FIELD_ID} required={false} />
        </FormControl>,
      );

      expect(input()).not.toBeDisabled();
      expect(input()).not.toBeRequired();
      expect(input()).not.toHaveAttribute('aria-invalid');
    });

    it('가장 가까운 FormControl 이 이긴다', () => {
      render(
        <FormControl disabled>
          <FormControl error>
            <InputLabel data-testid="label" htmlFor={FIELD_ID}>
              {LABEL_TEXT}
            </InputLabel>
            <PlainInput id={FIELD_ID} />
          </FormControl>
        </FormControl>,
      );

      // 안쪽 FormControl 은 disabled 를 물려받지 않는다 — 자기 기본값(false)을 내려보낸다.
      expect(input()).not.toBeDisabled();
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('TextField 는 관계를 스스로 완성한다', () => {
    it('id 를 주지 않아도 이름·설명·오류·필수가 한 필드로 묶인다', () => {
      render(<TextField error helperText={ERROR_TEXT} label={LABEL_TEXT} required />);

      const field = screen.getByRole('textbox');

      expect(field).toHaveAccessibleName(LABEL_TEXT);
      expect(field).toHaveAccessibleDescription(ERROR_TEXT);
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(field).toBeRequired();
    });

    it('helperText 가 없으면 aria-describedby 를 지어내지 않는다', () => {
      render(<TextField label={LABEL_TEXT} />);

      // 가리킬 대상이 없는 id 를 붙이면 보조 기술이 빈 설명을 읽는다.
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });
  });

  /**
   * 상태가 겹쳤을 때 **필드 전체가 한 가지 이야기를 하는지.**
   *
   * 단위 테스트는 각 컴포넌트에 prop 을 직접 줘서 우선순위를 고정한다. 여기서는 소비자가
   * 실제로 만드는 상황 — `<FormControl error>` 안에서 입력에 포커스가 갔을 때 — 라벨과 헬퍼가
   * 함께 오류를 유지하는지 본다. 오류 필드에 커서를 놓는 순간 라벨만 평상시 색으로 돌아가면
   * 색이 전달하던 오류 신호가 사라진다.
   *
   * 색은 `aria-invalid` 를 대신하지 않는다 — 고지는 별도로 확인한다.
   */
  describe('필드 전체의 동시 상태', () => {
    beforeAll(() => {
      applyComponentStyles(
        'input-label/input-label.scss',
        'form-helper-text/form-helper-text.scss',
      );
    });

    const LABEL_STATES = [
      inputLabelClasses.disabled,
      inputLabelClasses.error,
      inputLabelClasses.focused,
    ];
    const HELPER_STATES = [formHelperTextClasses.disabled, formHelperTextClasses.error];

    const colorsOf = (element: Element, states: readonly string[]) =>
      matchingStateColorRules(element, states).map((rule) => rule.color);

    it('오류 필드에 포커스해도 라벨과 헬퍼는 오류를 유지한다', () => {
      render(<Field error />);

      act(() => {
        input().focus();
      });

      // 포커스는 실제로 갔다.
      expect(label()).toHaveClass(inputLabelClasses.focused);

      // 그래도 색이 전하는 이야기는 "오류" 하나다.
      expect(colorsOf(label(), LABEL_STATES)).toEqual(['var(--ds-text-error)']);
      expect(colorsOf(helper(), HELPER_STATES)).toEqual(['var(--ds-text-error)']);

      // 색은 고지가 아니다 — aria-invalid 가 따로 있어야 한다.
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });

    it('disabled 필드는 오류가 함께 있어도 disabled 로 읽힌다', () => {
      render(<Field disabled error />);

      expect(colorsOf(label(), LABEL_STATES)).toEqual(['var(--ds-text-disable)']);
      expect(colorsOf(helper(), HELPER_STATES)).toEqual(['var(--ds-text-disable)']);

      // 비활성이어도 오류 고지 자체는 사라지지 않는다.
      expect(input()).toBeDisabled();
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
