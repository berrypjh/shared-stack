/** test 전용. 파일 첫 테스트는 lazy 화면 chunk 로딩까지 떠안아 CI 부하에서 기본 1초를 넘긴다. */
import { configure } from '@testing-library/react';

configure({ asyncUtilTimeout: 5000 });
