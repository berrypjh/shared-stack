import { useState } from 'react';
import { View } from 'react-native';

import { Checkbox, Radio, RadioGroup, Switch } from '@berrypjh/react-native-ui';

import { Column, Row } from '../shell/layout';
import { Caption, Label } from '../shell/Section';

type Channels = { email: boolean; push: boolean };

/**
 * 선택 컨트롤 데모 — 소비자 사용 모양과 테마 전환을 기기에서 눈으로 확인하는 자리다.
 *
 * Checkbox·Radio 는 Pressable 에 checkbox·radio 역할을, Switch 는 core Switch 에 토큰 색만
 * 입힌다. 동작 계약은 라이브러리 테스트가 지키고, 여기는 테스트 프레임워크가 아니다.
 */
export const SelectionControlSection = () => {
  const [terms, setTerms] = useState(false);
  const [channels, setChannels] = useState<Channels>({ email: true, push: false });
  const [ship, setShip] = useState('standard');
  const [alerts, setAlerts] = useState(true);

  const all = channels.email && channels.push;
  const some = channels.email || channels.push;

  return (
    <View>
      <Label>Checkbox</Label>
      <Column>
        <Checkbox label="이용 약관에 동의합니다" checked={terms} onCheckedChange={setTerms} />
        <Checkbox
          label="전체 알림"
          checked={all}
          indeterminate={some && !all}
          onCheckedChange={(next) => setChannels({ email: next, push: next })}
        />
        <Checkbox
          label="이메일"
          checked={channels.email}
          onCheckedChange={(email) => setChannels((prev) => ({ ...prev, email }))}
        />
        <Checkbox
          label="푸시"
          checked={channels.push}
          onCheckedChange={(push) => setChannels((prev) => ({ ...prev, push }))}
        />
        <Checkbox label="비활성 (선택됨)" defaultChecked disabled />
      </Column>
      <Caption>
        일부만 켜지면 &quot;전체 알림&quot; 이 혼합(mixed) 상태가 됩니다. 누르면 전부 켜집니다.
      </Caption>

      <Label>RadioGroup</Label>
      <RadioGroup label="배송 방법" value={ship} onValueChange={setShip}>
        <Radio value="standard" label="일반 배송" />
        <Radio value="express" label="빠른 배송" />
        <Radio value="pickup" label="매장 방문 (준비 중)" disabled />
      </RadioGroup>
      <Caption>선택: {ship} — 이미 선택된 항목을 다시 눌러도 해제되지 않습니다</Caption>

      <Label>Switch</Label>
      <Row>
        <Switch accessibilityLabel="새 댓글 알림" value={alerts} onValueChange={setAlerts} />
        <Switch accessibilityLabel="비활성 스위치" value disabled onValueChange={() => undefined} />
      </Row>
      <Caption>
        {alerts ? '켜짐' : '꺼짐'} — core Switch 라 애니메이션·터치 영역은 native 것입니다. 테마를
        바꾸면 트랙과 thumb 이 토큰을 따라 바뀝니다.
      </Caption>
    </View>
  );
};
