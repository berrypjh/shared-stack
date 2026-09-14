import { View } from 'react-native';

import { Avatar } from '@berrypjh/react-native-ui';

import { Row } from '../shell/layout';
import { Caption, Label } from '../shell/Section';

/** 로드되는 이미지. data URI 라 네트워크에 기대지 않는다. */
const LOADABLE = {
  uri:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
        '<rect width="96" height="96" fill="#10B981"/>' +
        '<circle cx="48" cy="36" r="16" fill="#F2F4F7"/>' +
        '<ellipse cx="48" cy="84" rx="28" ry="22" fill="#F2F4F7"/></svg>',
    ),
};

/** 절대 로드되지 않는다 — fallback 전환을 기기에서 눈으로 확인하는 자리다. */
const BROKEN = { uri: 'https://invalid.invalid/none.png' };

/**
 * Avatar 데모 — 소비자 사용 모양과 테마 전환을 기기에서 눈으로 확인하는 자리다.
 *
 * Avatar 는 정적 identity visual 이라 누를 수 없다. 동작 계약은 라이브러리 테스트가 지키고,
 * 여기는 테스트 프레임워크가 아니다.
 */
export const AvatarSection = () => (
  <View>
    <Label>이미지</Label>
    <Row>
      <Avatar source={LOADABLE} accessibilityLabel="홍길동" size="sm" />
      <Avatar source={LOADABLE} accessibilityLabel="홍길동" size="md" />
      <Avatar source={LOADABLE} accessibilityLabel="홍길동" size="lg" />
      <Avatar source={LOADABLE} accessibilityLabel="홍길동" size="lg" shape="rounded" />
    </Row>
    <Caption>
      sm 24 · md 32 · lg 48 (spacing 토큰). shape 는 circle · rounded 두 가지입니다.
    </Caption>

    <Label>Fallback</Label>
    <Row>
      <Avatar accessibilityLabel="홍길동" size="sm">
        홍
      </Avatar>
      <Avatar accessibilityLabel="홍길동" size="md">
        길동
      </Avatar>
      <Avatar accessibilityLabel="김철수" size="lg">
        철수
      </Avatar>
      <Avatar size="lg" />
    </Row>
    <Caption>
      이미지가 없으면 이니셜을 그립니다. 면과 글자가 테마를 따라 움직이고, 마지막처럼 fallback 이
      없으면 빈 면이 자리만 지킵니다.
    </Caption>

    <Label>이미지 실패</Label>
    <Row>
      <Avatar source={BROKEN} accessibilityLabel="홍길동" size="lg">
        길동
      </Avatar>
      <Avatar source={BROKEN} size="lg">
        철수
      </Avatar>
    </Row>
    <Caption>
      로드에 실패하면 이니셜로 넘어갑니다. accessibilityLabel 을 준 쪽은 루트가 하나의 image 요소라
      이름만 읽히고, 주지 않은 쪽은 보이는 글자가 그대로 읽힙니다.
    </Caption>
  </View>
);
