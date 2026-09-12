/**
 * 정보 구조.
 *
 * 섹션 11개를 한 스크롤에 쌓으면 본문만 900줄이 넘어가 원하는 컴포넌트를 찾기 어렵습니다.
 * 그래서 목록 → 상세로 나누고, 그룹은 demo-web 사이드바(`shell/nav.ts`)와 같은 작업 단위를
 * 따릅니다 — 입력을 만든다 / 액션을 붙인다 / 배치한다 / 토큰을 확인한다.
 *
 * 제목과 설명이 여기 모여 있는 이유는 목록의 부제와 상세 헤더가 **같은 문장**을 써야 하기
 * 때문입니다. 화면마다 따로 적으면 한쪽만 고치는 드리프트가 생깁니다.
 */
export type SectionKey =
  | 'input-family'
  | 'form-architecture'
  | 'text-field'
  | 'search-field'
  | 'select'
  | 'segment-control'
  | 'selection-control'
  | 'button-family'
  | 'box'
  | 'avatar'
  | 'badge'
  | 'chip'
  | 'semantic-color'
  | 'color-scale'
  | 'theme-tokens';

export type NavItem = {
  key: SectionKey;
  label: string;
  description: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: 'Input',
    items: [
      {
        key: 'input-family',
        label: 'Input 계열',
        description:
          'PlainInput · FilledInput · BoxedInput. TextInput 하나를 감싸며 값은 문자열, 콜백은 onChangeText 입니다.',
      },
      {
        key: 'form-architecture',
        label: 'Form 구조',
        description:
          'FormControl · InputLabel · FormHelperText. FormControl 이 상태를 내려보내고 focus 를 조정합니다. 보이는 라벨은 입력의 접근 가능한 이름이 아니라서 입력마다 accessibilityLabel 을 따로 줍니다.',
      },
      {
        key: 'text-field',
        label: 'TextField',
        description:
          'FormControl · InputLabel · Input · FormHelperText 를 한 번에 세우는 합성 계층입니다. 문자열 label 은 입력의 접근 가능한 이름이 되지만, 헬퍼는 보이는 텍스트까지만 보장합니다.',
      },
      {
        key: 'search-field',
        label: 'SearchField',
        description:
          '검색 입력 + 지우기 + 제안 목록. 후보는 소비자가 좁혀서 넘기고, 목록은 blur 로 닫히지 않습니다 — RN 에는 web 의 포커스 봉쇄가 없기 때문입니다.',
      },
      {
        key: 'select',
        label: 'Select',
        description:
          '데이터 options 기반 단일 선택. 값과 개폐 상태가 독립이고, 해제는 배경 탭 · Android back · iOS 스크린리더 escape 입니다.',
      },
      {
        key: 'segment-control',
        label: 'SegmentControl',
        description:
          '상호배타 선택. controlled 전용이라 value 가 유일한 권한이고, 세그먼트는 button 역할 + selected 상태입니다.',
      },
      {
        key: 'selection-control',
        label: 'Checkbox · Radio · Switch',
        description:
          '선택 컨트롤. Checkbox·Radio 는 Pressable 에 checkbox·radio 역할을, Switch 는 core Switch 에 토큰 색만 입힙니다. 테마를 바꾸면 면·표시자·트랙이 함께 움직입니다.',
      },
    ],
  },
  {
    label: 'Action',
    items: [
      {
        key: 'button-family',
        label: 'Button 계열',
        description:
          'Button · Fab · IconButton. Pressable 기반이고 disabled·loading 은 접근성 상태로도 알립니다.',
      },
    ],
  },
  {
    label: 'Layout',
    items: [
      {
        key: 'box',
        label: 'Box',
        description: '토큰 prop 만으로 배경·모서리·여백을 주는 레이아웃 컴포넌트입니다.',
      },
    ],
  },
  {
    label: 'Identity',
    items: [
      {
        key: 'avatar',
        label: 'Avatar',
        description:
          '정적 identity visual. 이미지가 없거나 실패하면 이니셜을 그립니다. 누를 수 없고 최소 터치 타깃도 없습니다 — 누르는 identity 컨트롤은 Pressable 로 감쌉니다.',
      },
      {
        key: 'badge',
        label: 'Badge',
        description:
          '앵커 위에 얹는 overlay indicator — 알림·개수·점. 앵커의 역할·이름·누름을 건드리지 않고, standalone 태그가 아닙니다 (그 역할은 Chip 이 가집니다).',
      },
      {
        key: 'chip',
        label: 'Chip',
        description:
          'compact label. onPress 가 없으면 passive View(누를 수 없음), 있으면 ButtonBase 기반 toggle 입니다. selected·disabled 는 interactive 모드에만 있습니다.',
      },
    ],
  },
  {
    label: 'Foundation',
    items: [
      {
        key: 'semantic-color',
        label: 'Semantic color',
        description: '테마를 바꾸면 따라 바뀌는 의미 기반 색입니다.',
      },
      {
        key: 'color-scale',
        label: 'Color scale',
        description: '테마와 무관하게 고정인 primitive 팔레트입니다.',
      },
      {
        key: 'theme-tokens',
        label: '테마 토큰',
        description: 'useTheme() 으로 런타임에 조회한 값입니다.',
      },
    ],
  },
];

/** 키 → 항목. 상세 화면이 제목·설명을 되찾을 때 씁니다. */
export const itemFor = (key: SectionKey): NavItem => {
  const found = NAV.flatMap((g) => g.items).find((i) => i.key === key);

  // NAV 가 SectionKey 를 모두 덮는지는 타입이 아니라 이 단언이 지킵니다 —
  // 키를 추가하고 항목을 빠뜨리면 여기서 즉시 드러납니다.
  if (!found) throw new Error(`nav 항목이 없습니다: ${key}`);

  return found;
};
