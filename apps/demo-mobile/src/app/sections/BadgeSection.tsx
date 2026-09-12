import { View } from 'react-native';

import { Avatar, Badge, IconButton } from '@berrypjh/react-native-ui';

import { Caption, Label } from '../shell/Section';
import { demoStyles } from '../shell/styles';

/**
 * Badge 데모 — 소비자 사용 모양과 테마 전환을 기기에서 눈으로 확인하는 자리다.
 *
 * Badge 는 overlay indicator 라 앵커가 필요하다. 실제 합성 두 가지(Avatar + Badge,
 * IconButton + 읽지 않음 Badge)를 담아 **앵커의 누름이 살아 있는지**를 손으로 확인한다.
 * 동작 계약은 라이브러리 테스트가 지키고, 여기는 테스트 프레임워크가 아니다.
 */
export const BadgeSection = () => (
  <View>
    <Label>Avatar + Badge</Label>
    <View style={demoStyles.row}>
      <Badge count={3} label="읽지 않은 알림 3개">
        <Avatar accessibilityLabel="홍길동" size="lg">
          길동
        </Avatar>
      </Badge>
      <Badge count={137} label="읽지 않은 알림 137개">
        <Avatar accessibilityLabel="김철수" size="lg">
          철수
        </Avatar>
      </Badge>
      <Badge variant="dot" label="접속 중" intent="primary" placement="bottom-end">
        <Avatar accessibilityLabel="이영희" size="lg">
          영희
        </Avatar>
      </Badge>
    </View>
    <Caption>
      137 은 max(99)를 넘어 99+ 로 줄었습니다. 스크린리더는 label 의 실제 수를 읽습니다 — &quot;99
      플러스&quot; 는 정보가 아니기 때문입니다.
    </Caption>

    <Label>IconButton + 읽지 않음</Label>
    <View style={demoStyles.row}>
      <Badge count={5} label="읽지 않은 알림 5개">
        <IconButton accessibilityLabel="알림" icon="🔔" onPress={() => undefined} />
      </Badge>
      <Badge variant="dot" label="새 메시지 있음">
        <IconButton accessibilityLabel="메시지" icon="✉️" onPress={() => undefined} />
      </Badge>
      <Badge count={5} invisible>
        <IconButton accessibilityLabel="읽은 알림" icon="🔔" onPress={() => undefined} />
      </Badge>
    </View>
    <Caption>
      배지를 얹어도 버튼은 그대로 눌립니다 — 표시자가 pointerEvents=&quot;none&quot; 이고 루트에
      accessible 을 걸지 않아 버튼의 역할·이름이 살아 있습니다. 마지막은 invisible 입니다.
    </Caption>

    <Label>intent · size</Label>
    <View style={demoStyles.row}>
      <Badge count={1} intent="error" label="1개" />
      <Badge count={1} intent="primary" label="1개" />
      <Badge count={1} intent="secondary" label="1개" />
      <Badge count={1} intent="neutral" label="1개" />
      <Badge count={1} size="sm" label="1개" />
      <Badge variant="dot" size="sm" label="표시" />
    </View>
    <Caption>
      intent 는 네 가지입니다. warning·success 는 ember 테마에서 글자 대비가 4.35·4.34 로 AA (4.5)에
      미달해 어휘에서 뺐습니다. neutral 만 전경이 text.default 입니다.
    </Caption>
  </View>
);
