import { useState } from 'react';
import { View } from 'react-native';

import { SegmentControl, type SegmentOption } from '@berrypjh/react-native-ui';

import { Column } from '../shell/layout';
import { Caption, Label } from '../shell/Section';

type Range = 'day' | 'week' | 'month';

const RANGES: readonly SegmentOption<Range>[] = [
  { value: 'day', label: '일간' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
];

type Density = 'compact' | 'cozy' | 'wide';

const DENSITIES: readonly SegmentOption<Density>[] = [
  { value: 'compact', label: '좁게' },
  { value: 'cozy', label: '보통' },
  { value: 'wide', label: '넓게 (준비 중)', disabled: true },
];

/**
 * SegmentControl 데모.
 *
 * **controlled 전용** 입니다 — `value` 가 선택 상태의 유일한 권한이고 내부 상태가 없습니다.
 * 누른다고 스스로 바뀌지 않으므로 소비자가 반드시 `onChange` 를 처리해야 합니다.
 *
 * 세그먼트는 button 역할 + `accessibilityState.selected` 입니다. 상호배타라는 이유만으로
 * radio/tab 으로 바꾸지 않습니다 — 폼 radio 도, 화면을 전환하는 tab 도 아닙니다.
 *
 * `size`·`fullWidth`·루트 `disabled` 는 **없습니다** (web 에도 없습니다).
 */
export const SegmentControlSection = () => {
  const [range, setRange] = useState<Range>('week');
  const [density, setDensity] = useState<Density>('cozy');

  return (
    <View>
      <Label>controlled 선택</Label>
      <Column>
        <SegmentControl options={RANGES} value={range} onChange={setRange} />
      </Column>
      <Caption>선택: {range} — 상태는 데모가 가집니다</Caption>
      <Caption>
        문자열 라벨은 보이는 텍스트가 그대로 이름이 됩니다. 이미 선택된 세그먼트를 다시 눌러도
        onChange 가 호출됩니다(web 과 같은 동작).
      </Caption>

      <Label>옵션별 disabled</Label>
      <Column>
        <SegmentControl options={DENSITIES} value={density} onChange={setDensity} />
      </Column>
      <Caption>
        선택: {density} · &quot;넓게&quot; 는 비활성이라 눌리지 않고 accessibilityState.disabled 로
        알립니다. 세그먼트는 시각 크기와 무관하게 최소 터치 타깃(48)을 지킵니다.
      </Caption>

      <Label>텍스트가 아닌 라벨 — accessibilityLabel 로 이름을 준다</Label>
      <Column>
        <SegmentControl
          options={[
            { value: 'day', label: '▤', accessibilityLabel: '일간 보기' },
            { value: 'week', label: '▦', accessibilityLabel: '주간 보기' },
            { value: 'month', label: '▧', accessibilityLabel: '월간 보기' },
          ]}
          value={range}
          onChange={setRange}
        />
      </Column>
      <Caption>
        글리프는 이름이 되지 못하므로 옵션마다 accessibilityLabel 을 줍니다. 테마를 바꾸면 트랙과
        선택 표면이 토큰을 따라 움직입니다.
      </Caption>
    </View>
  );
};
