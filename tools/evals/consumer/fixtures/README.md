# fixtures

평가 task가 참조하는 최소 consumer project. 실제 published package 경로로만 import한다
(`@berrypjh/react-ui`, `@berrypjh/react-native-ui`). monorepo 내부 source 경로 import는
정상 경로가 아니며 `graders/public-import.ts`가 위반으로 잡는다.

| fixture              | 용도                          |
| -------------------- | ----------------------------- |
| `web-basic`          | React 웹 소비자               |
| `react-native-basic` | React Native 소비자           |
| `mixed`              | Web + RN 양쪽이 필요한 소비자 |
| `no-ui`              | UI 라이브러리와 무관한 소비자 |

app 전체를 복제하지 않는다. D4/D5 검증은 이 fixture를 `tmp/llm-evals/work/<run-id>/` 아래로
복사한 뒤 agent가 바꾼 파일을 덮어쓰고 거기서 `tsc`/`vitest`를 돌린다 — 원본 fixture는 건드리지 않는다.
