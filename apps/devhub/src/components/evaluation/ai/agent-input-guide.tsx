import { Mono } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { LIVE_MAX_TURNS, LIVE_PROVIDERS } from '@/lib/evaluation/live';

import { EvalCommands } from './eval-commands';

const ITEM = 'typo-body-small break-keep text-text-default';

const number = (value: number) => value.toLocaleString('en-US');

/**
 * "실제 입력" 을 재는 법. 이 값은 모델을 실제로 호출해야만 생겨 제공자 · 키 · 비용 · 범위를
 * 명령 옆에 둔다. 본문 맨 아래에 접어 두고, 고른 실행이 없을 때만 펼친다.
 */
export const AgentInputHowTo = ({ open }: { open: boolean }) => (
  <EvalCommands open={open} title="실제 입력 재는 법">
    <p className={ITEM}>
      {`제공자(--provider)와 모델(--model)을 꼭 고른다. 컨텍스트 한도 기본값: ${LIVE_PROVIDERS.map((provider) => `${provider.label} ${number(provider.contextLimit)}`).join(' · ')} 토큰.`}
    </p>
    <List className="flex flex-col gap-xs">
      <ListItem className={ITEM}>
        키는 실행할 때만 쓰고 어디에도 저장하지 않는다 (<Mono>.env</Mono> 는 커밋되지 않음).
      </ListItem>
      <ListItem className={ITEM}>
        범위: smoke 과제 × 모든 variant × 시도 1번. 과제 하나에 최대 {LIVE_MAX_TURNS}턴. 다른 서버
        주소는 <Mono>--base-url</Mono>, 한도는 <Mono>--context-limit</Mono> 로 바꾼다.
      </ListItem>
      <ListItem className={ITEM}>
        실행 전에 첫 메시지를 세어 한도를 넘는 variant 는 실행하지 않는다 — 0 이 아니라 "실행하지
        않음" 과 이유로 남는다.
      </ListItem>
      <ListItem className={ITEM}>
        Claude · OpenAI 는 호출마다 비용이 든다. 로컬은 비용이 없지만 느리고, 모델에 따라 도구를 잘
        못 써 성공률이 낮게 나올 수 있다.
      </ListItem>
      <ListItem className={ITEM}>
        로컬 Ollama 는 기본 컨텍스트가 작아 입력을 오류 없이 잘라 버린다. 그러면 실행이 멈추고
        이유를 알린다.
      </ListItem>
      <ListItem className={ITEM}>
        과제 전체(dev)는 harness 를 <Mono>--live --all-tasks</Mono> 로 직접 돌린 뒤{' '}
        <Mono>pnpm quality:collect --profile=eval --from=tmp/llm-evals/&lt;실행&gt;</Mono> 로
        가져온다.
      </ListItem>
      <ListItem className={ITEM}>
        끝나면 <Mono>eval-live-&lt;날짜&gt;-&lt;시각&gt;</Mono> 실행이 생긴다. 같은 실행이 성적표 ·
        라우팅 · 검색 · 검증에도 실제 모델 결과로 나온다. Progressive + Repair 는 아직 수정 단계를
        돌리지 않아 Verification 과 같게 동작한다.
      </ListItem>
    </List>
  </EvalCommands>
);
