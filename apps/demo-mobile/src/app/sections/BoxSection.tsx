import { Text, View } from 'react-native';

import { Box } from '@berrypjh/react-native-ui';

import { demoStyles } from '../shell/styles';

/** 토큰 prop 만으로 배경·radius·여백을 주는 레이아웃 컴포넌트. */
export const BoxSection = () => (
  <View>
    <Text style={demoStyles.sectionLabel}>{`<Box> with token props`}</Text>
    <Box bg="primary.pr500" radius="md" p="md" m="sm">
      <Text style={{ color: '#fff' }}>
        bg=&quot;primary.pr500&quot; radius=&quot;md&quot; p=&quot;md&quot;
      </Text>
    </Box>
    <Box bg="secondary.se500" radius="lg" p="lg" m="sm">
      <Text style={{ color: '#fff' }}>
        bg=&quot;secondary.se500&quot; radius=&quot;lg&quot; p=&quot;lg&quot;
      </Text>
    </Box>
    <Box bg="success.su500" radius="rounded" p="md" m="sm">
      <Text style={{ color: '#fff' }}>bg=&quot;success.su500&quot; radius=&quot;rounded&quot;</Text>
    </Box>
    <Box bg="neutral.ne200" radius="sm" p="md" m="sm">
      <Text>raw token: bg=&quot;neutral.ne200&quot;</Text>
    </Box>
  </View>
);
