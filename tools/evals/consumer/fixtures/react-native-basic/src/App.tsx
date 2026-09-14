import { Box, ThemeProvider } from '@berrypjh/react-native-ui';

export const App = () => (
  <ThemeProvider mode="light">
    <Box p="md" bg="background.surface" radius="md" />
  </ThemeProvider>
);
