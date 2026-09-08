import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { SearchField, type SearchFieldSuggestion } from '@berrypjh/react-native-ui';

import { Caption, Label } from '../shell/Section';
import { demoStyles } from '../shell/styles';

const FRUITS: SearchFieldSuggestion[] = [
  { id: '1', label: '사과', value: 'apple', description: '가을 제철' },
  { id: '2', label: '바나나' },
  { id: '3', label: '체리', value: 'cherry', description: '품절', disabled: true },
];

/**
 * SearchField 데모.
 *
 * **후보는 소비자가 좁힙니다.** SearchField 는 데이터를 가져오지도 거르지도 않습니다 —
 * 아래 예시의 필터링은 데모 코드가 합니다.
 *
 * 지우기 버튼은 `clearAccessibilityLabel` 을 줘야 나타납니다. 이름 없는 버튼을 만들지 않고
 * 영어 기본값도 박지 않습니다.
 *
 * 제안 목록은 **blur 로 닫히지 않습니다** — RN 에는 web 의 포커스 봉쇄가 없어서, 닫아 버리면
 * 제안을 누르는 터치가 목록 언마운트와 경쟁합니다. 선택·지우기·제출이 닫습니다.
 */
export const SearchFieldSection = () => {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState('(없음)');
  const [submitted, setSubmitted] = useState('(없음)');

  // 필터링은 데모가 합니다 — 컴포넌트는 받은 후보를 그대로 그립니다.
  const filtered = useMemo(
    () => (query === '' ? FRUITS : FRUITS.filter((f) => f.label.includes(query))),
    [query],
  );

  return (
    <View>
      <Label>controlled 질의 + 지우기 + 제출</Label>
      <View style={demoStyles.stack}>
        <SearchField
          accessibilityLabel="과일 검색"
          placeholder="과일 이름"
          value={query}
          onChangeText={setQuery}
          clearAccessibilityLabel="검색어 지우기"
          onClear={() => setPicked('(없음)')}
          onSubmitEditing={(e) => setSubmitted(e.nativeEvent.text || '(빈 질의)')}
        />
      </View>
      <Caption>
        질의: {query || '(비어 있음)'} · 제출: {submitted}
      </Caption>
      <Caption>
        지우기 버튼은 질의가 있고 편집 가능할 때만 보입니다. enterKeyHint·inputMode 는 search
        입니다.
      </Caption>

      <Label>제안 목록 — 선택·비활성·빈 상태</Label>
      <View style={demoStyles.stack}>
        <SearchField
          accessibilityLabel="제안이 있는 검색"
          placeholder="사/바/체 를 입력해 보세요"
          value={query}
          onChangeText={setQuery}
          clearAccessibilityLabel="검색어 지우기"
          suggestions={filtered}
          noSuggestionsText="일치하는 과일이 없습니다"
          onSuggestionSelect={(s) => setPicked(s.label)}
        />
      </View>
      <Caption>고른 제안: {picked}</Caption>
      <Caption>
        입력을 누르면 열립니다. &quot;체리&quot; 는 비활성이라 눌러도 값이 바뀌지 않고 목록도 닫히지
        않습니다. 값이 없는 제안(&quot;바나나&quot;)은 label 이 질의 값이 됩니다.
      </Caption>

      <Label>uncontrolled + disabled</Label>
      <View style={demoStyles.stack}>
        <SearchField
          accessibilityLabel="최근 검색"
          defaultValue="지난 검색어"
          clearAccessibilityLabel="지우기"
          variant="filled"
        />
        <SearchField
          accessibilityLabel="비활성 검색"
          defaultValue="검색할 수 없음"
          clearAccessibilityLabel="지우기"
          suggestions={FRUITS}
          disabled
        />
      </View>
      <Caption>
        비활성일 때는 지우기 버튼도 제안 목록도 나타나지 않습니다. 제안 행은 button 역할입니다 — RN
        은 option 역할을 네이티브 역할로 매핑하지 않습니다.
      </Caption>
    </View>
  );
};
