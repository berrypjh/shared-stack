import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';
import { InputBase } from '../input-base/InputBase';

import {
  resolveClearButtonStyle,
  resolveClearGlyphStyle,
  resolveSuggestionDescriptionStyle,
  resolveSuggestionEmptyStyle,
  resolveSuggestionLabelStyle,
  resolveSuggestionPanelStyle,
  resolveSuggestionRowStyle,
} from './SearchField.styles';
import { getSuggestionValue, isSuggestionSelected } from './SearchField.suggestions';
import type { SearchFieldProps, SearchFieldSuggestion } from './SearchField.types';

/** 문자열·숫자만 Text 로 감쌉니다. 임의의 노드는 소비자가 준 그대로 그립니다. */
const isTextual = (node: unknown): node is string | number =>
  typeof node === 'string' || typeof node === 'number';

/**
 * 검색 입력 필드.
 *
 * 질의 상태를 스스로 소유합니다 — 질의가 비었는지 알아야 지우기 버튼과 선택 상태를 정할 수
 * 있어서, Plain/Filled/Boxed 와 달리 내부 TextInput 이 항상 controlled 입니다. 밖에서 본
 * controlled 판정(`value !== undefined`)은 같습니다.
 *
 * 제안 목록은 focus·입력이 열고 선택·지우기·제출이 닫습니다. **blur 는 닫지 않습니다** —
 * RN 에는 web 의 포커스 봉쇄가 없어서 blur 로 닫으면 제안을 누르는 터치가 목록 언마운트와
 * 경쟁합니다. 대가로 다른 곳을 눌러 키보드만 내려도 목록은 남습니다.
 *
 * 선택 뒤 입력에 포커스를 되돌리지 않습니다 — 키보드가 다시 올라옵니다.
 */
export const SearchField = ({
  value: valueProp,
  defaultValue,
  onChangeText,
  clearAccessibilityLabel,
  onClear,
  suggestions,
  noSuggestionsText,
  onSuggestionSelect,
  variant = 'boxed',
  disabled,
  readOnly = false,
  fullWidth,
  accessibilityRole = 'search',
  accessibilityState,
  enterKeyHint = 'search',
  inputMode = 'search',
  onSubmitEditing,
  ...rest
}: SearchFieldProps) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);

  const isControlled = valueProp !== undefined;
  const query = isControlled ? valueProp : uncontrolledValue;

  const disabledValue = disabled ?? formControl?.disabled ?? false;
  const fullWidthValue = fullWidth ?? formControl?.fullWidth ?? false;
  const editable = !disabledValue && !readOnly;

  const changeQuery = (next: string) => {
    if (!isControlled) setUncontrolledValue(next);
    onChangeText?.(next);
  };

  const clear = () => {
    // 값 반영이 먼저입니다. onClear는 "이미 비웠다"는 알림이라 그다음입니다.
    changeQuery('');
    onClear?.();
    setOpen(false);
  };

  // 비활성 제안 가드를 여기 두지 않습니다 — 행 `Pressable` 의 `disabled` 가 이미 press 를
  // 막는 유일한 진실이고, 그 위에 얹은 조건은 도달하지 않는 죽은 코드였습니다.
  const selectSuggestion = (suggestion: SearchFieldSuggestion) => {
    changeQuery(getSuggestionValue(suggestion));
    onSuggestionSelect?.(suggestion);
    setOpen(false);
  };

  const handleSubmit: NonNullable<SearchFieldProps['onSubmitEditing']> = (event) => {
    onSubmitEditing?.(event);
    setOpen(false);
  };

  const showClear = clearAccessibilityLabel !== undefined && query.length > 0 && editable;

  // 제안 표면을 갖도록 설정된 컴포넌트인가. 아니면 `expanded` 를 지어내지 않습니다.
  const hasSuggestionSurface = suggestions !== undefined || noSuggestionsText !== undefined;
  const rows = suggestions ?? [];
  const hasContent = rows.length > 0 || noSuggestionsText != null;
  const listVisible = open && editable && hasContent;

  return (
    // `accessible`을 켜지 않습니다 — 입력·지우기·제안이 하나로 뭉치면 각각 조작할 수 없습니다.
    <View testID="search-field-root" style={fullWidthValue ? { alignSelf: 'stretch' } : null}>
      <InputBase
        {...rest}
        variant={variant}
        disabled={disabled}
        readOnly={readOnly}
        fullWidth={fullWidth}
        accessibilityRole={accessibilityRole}
        accessibilityState={
          hasSuggestionSurface ? { ...accessibilityState, expanded: open } : accessibilityState
        }
        enterKeyHint={enterKeyHint}
        inputMode={inputMode}
        radius={tokens.radius.rounded}
        value={query}
        onChangeText={(next) => {
          changeQuery(next);
          setOpen(true);
        }}
        onFocus={(event) => {
          rest.onFocus?.(event);
          setOpen(true);
        }}
        onSubmitEditing={handleSubmit}
        endAdornment={
          showClear ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={clearAccessibilityLabel}
              onPress={clear}
              style={resolveClearButtonStyle(tokens)}
            >
              <Text style={resolveClearGlyphStyle(tokens)}>✕</Text>
            </Pressable>
          ) : undefined
        }
      />

      {listVisible ? (
        <View testID="search-field-suggestions" style={resolveSuggestionPanelStyle(tokens)}>
          {rows.length > 0 ? (
            rows.map((suggestion) => {
              const rowDisabled = suggestion.disabled ?? false;
              const selected = isSuggestionSelected(query, suggestion);

              return (
                <Pressable
                  key={suggestion.id}
                  // RN 은 `option` 역할을 네이티브 역할로 매핑하지 않습니다 (Android
                  // ReactAccessibilityDelegate 의 role 스위치에 case 가 없어 null 이 됩니다).
                  // 실제로 읽히는 것은 button 이고, 상태는 accessibilityState 가 말합니다.
                  accessibilityRole="button"
                  accessibilityLabel={suggestion.label}
                  accessibilityState={{ selected, disabled: rowDisabled }}
                  disabled={rowDisabled}
                  onPress={() => selectSuggestion(suggestion)}
                  style={resolveSuggestionRowStyle(tokens, { selected })}
                >
                  <Text style={resolveSuggestionLabelStyle(tokens, { disabled: rowDisabled })}>
                    {suggestion.label}
                  </Text>
                  {/* 보이는 보조 텍스트일 뿐입니다. 임의의 노드를 문자열로 만들지 않습니다. */}
                  {suggestion.description == null ? null : isTextual(suggestion.description) ? (
                    <Text
                      style={resolveSuggestionDescriptionStyle(tokens, { disabled: rowDisabled })}
                    >
                      {suggestion.description}
                    </Text>
                  ) : (
                    suggestion.description
                  )}
                </Pressable>
              );
            })
          ) : // 라이브 리전으로 만들지 않습니다 — 비동기 결과 안내는 별개의 제품 정책입니다.
          isTextual(noSuggestionsText) ? (
            <Text style={resolveSuggestionEmptyStyle(tokens)}>{noSuggestionsText}</Text>
          ) : (
            noSuggestionsText
          )}
        </View>
      ) : null}
    </View>
  );
};
