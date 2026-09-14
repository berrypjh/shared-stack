import { Button, ThemeProvider } from '@berrypjh/react-ui';

import '@berrypjh/react-ui/styles.css';

export const App = () => (
  <ThemeProvider mode="light">
    <Button variant="contained" color="primary">
      확인
    </Button>
  </ThemeProvider>
);
