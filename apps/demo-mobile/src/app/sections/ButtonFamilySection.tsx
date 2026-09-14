import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Fab, IconButton } from '@berrypjh/react-native-ui';

import { Row } from '../shell/layout';
import { useDemoPalette } from '../shell/palette';
import { Caption, Label } from '../shell/Section';

/**
 * Button 계열 데모.
 *
 * 공개 패키지 import만 씁니다 — 소비자가 실제로 쓰는 경로를 확인하는 층입니다.
 * 아이콘 규약이 없어 글리프 `<Text>`로 둡니다. Button·Fab 은 슬롯 노드에 색을 주입하지
 * 않으므로(`cloneElement` 안 함) **호출하는 쪽이 색을 줘야 합니다** — 예전에는 색이 없어
 * 검정으로 렌더되어 어두운 테마에서 아이콘이 보이지 않았습니다.
 */
export const ButtonFamilySection = () => {
  const p = useDemoPalette();
  const [pressCount, setPressCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  /** contained 버튼·Fab 표면 위 글자색. */
  const onSolid = p.readableOn(p.color.primaryBtn.default);
  /** outlined·text 버튼처럼 표면이 비어 있을 때. */
  const onSurface = p.color.text.primary;

  const onSubmit = () => {
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1200);
  };

  return (
    <View>
      <Label>variant</Label>
      <Row>
        <Button variant="contained" onPress={() => setPressCount((n) => n + 1)}>
          Contained
        </Button>
        <Button variant="outlined" onPress={() => setPressCount((n) => n + 1)}>
          Outlined
        </Button>
        <Button variant="text" onPress={() => setPressCount((n) => n + 1)}>
          Text
        </Button>
      </Row>
      <Caption>onPress 횟수: {pressCount}</Caption>

      <Label>size</Label>
      <Row>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </Row>

      <Label>color</Label>
      <Row>
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button variant="outlined" color="secondary">
          Secondary outlined
        </Button>
      </Row>

      <Label>아이콘 슬롯 · disabled</Label>
      <Row>
        <Button startIcon={<Text style={{ color: onSolid }}>←</Text>}>Back</Button>
        <Button endIcon={<Text style={{ color: onSolid }}>→</Text>}>Next</Button>
        <Button variant="outlined" startIcon={<Text style={{ color: onSurface }}>☆</Text>}>
          Outlined
        </Button>
        <Button disabled>Disabled</Button>
      </Row>

      <Label>loading</Label>
      <Row>
        <Button loading loadingPosition="start">
          Start
        </Button>
        <Button loading loadingPosition="center">
          Center
        </Button>
        <Button loading loadingPosition="end">
          End
        </Button>
      </Row>

      <Label>실제 상호작용 — 누르면 1.2초 동안 loading</Label>
      <View style={styles.block}>
        <Button loading={submitting} onPress={onSubmit} fullWidth>
          {submitting ? '제출 중…' : '제출하기'}
        </Button>
      </View>

      <Label>Fab</Label>
      <Row>
        <Fab
          icon={<Text style={{ color: onSolid }}>＋</Text>}
          accessibilityLabel="추가"
          onPress={() => setPressCount(0)}
        />
        <Fab
          icon={<Text style={{ color: onSolid }}>＋</Text>}
          accessibilityLabel="추가 (secondary)"
          color="secondary"
        />
        <Fab
          icon={<Text style={{ color: onSolid }}>＋</Text>}
          accessibilityLabel="추가 (비활성)"
          disabled
        />
        <Fab shape="extended" icon={<Text style={{ color: onSolid }}>＋</Text>}>
          만들기
        </Fab>
      </Row>

      <Label>IconButton — accessibilityLabel 은 필수</Label>
      <Row>
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="즐겨찾기"
          onPress={() => setPressCount((n) => n + 1)}
        />
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="즐겨찾기 (secondary)"
          color="secondary"
        />
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="즐겨찾기 (비활성)"
          disabled
        />
        <IconButton
          icon={({ color }) => <Text style={{ color }}>★</Text>}
          accessibilityLabel="저장 중"
          loading
        />
      </Row>
      <Caption>
        IconButton 의 `icon` 은 함수 형태를 받아 색·크기를 넘겨줍니다 — 슬롯 중 유일합니다.
      </Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  block: { marginTop: 2 },
});
