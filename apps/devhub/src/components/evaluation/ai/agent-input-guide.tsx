import { Mono } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { LIVE_MAX_TURNS, LIVE_PROVIDERS } from '@/lib/evaluation/live';

import { EvalCommands } from './eval-commands';

const Part = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-xs">
    <h3 className="typo-body-small-strong text-text-default">{title}</h3>
    {children}
  </div>
);

const ITEM = 'typo-body-small break-keep text-text-default';

const number = (value: number) => value.toLocaleString('en-US');

/**
 * "실제 입력" 이 무엇이고, 어떻게 만들고, 어떻게 보이는지. 이 값은 모델을 실제로 호출해야만 생겨
 * 제공자 · 키 · 비용 · 범위를 먼저 알려야 한다.
 */
export const AgentInputGuide = () => (
  <section
    aria-label="실제 입력 안내"
    className="flex flex-col gap-lg rounded-md border border-stroke-light bg-background-default p-md"
  >
    <Part title="무엇인가">
      <p className={ITEM}>
        평가 에이전트가 과제를 푸는 동안 모델에 실제로 보낸 입력 토큰이다. 처음 받은 컨텍스트에
        더해, 도구로 찾아 읽은 내용과 이어진 대화가 턴마다 다시 들어가 쌓인 양이다. 세어서 추정한
        값이 아니라 모델 API 가 응답마다 보고한 사용량(usage)을 더한 값이다.
      </p>
      <p className={ITEM}>
        "처음 받는 컨텍스트" 는 시작할 때의 자료만 센 크기이고, 이 값은 실제로 일을 하며 쓴 양이라
        둘의 차이가 도구 조회 · 재시도의 비용이다.
      </p>
    </Part>

    <Part title="어떻게 실행하나">
      <p className={ITEM}>
        제공자(<Mono>--provider</Mono>)와 모델(<Mono>--model</Mono>)을 꼭 고른다 — 셋 다 같은
        모양이다. 평가 · 수집 · DevHub 로 내보내기까지 한 번에 한다.
      </p>
      <EvalCommands withTitle={false} />
      <p className={ITEM}>
        {`컨텍스트 한도 기본값: ${LIVE_PROVIDERS.map((provider) => `${provider.label} ${number(provider.contextLimit)}`).join(' · ')} 토큰.`}
      </p>
      <List className="flex flex-col gap-xs">
        <ListItem className={ITEM}>
          키는 저장소 루트의 <Mono>.env</Mono> 나 환경변수에 둔다. 실행할 때만 쓰고 어디에도
          저장하지 않는다 (<Mono>.env</Mono> 는 커밋되지 않음).
        </ListItem>
        <ListItem className={ITEM}>
          범위: smoke 과제 × 모든 variant × 시도 1번. 과제 하나에 최대 {LIVE_MAX_TURNS}턴. 다른 서버
          주소는 <Mono>--base-url</Mono>, 한도는 <Mono>--context-limit</Mono> 로 바꾼다.
        </ListItem>
        <ListItem className={ITEM}>
          실행 전에 첫 메시지를 세어 한도를 넘는 variant 는 실행하지 않는다 — 0 이 아니라 이유로
          남는다.
        </ListItem>
        <ListItem className={ITEM}>
          Claude · OpenAI 는 호출마다 비용이 든다. 로컬은 비용이 없지만 느리고, 모델에 따라 도구를
          잘 못 써 성공률이 낮게 나올 수 있다.
        </ListItem>
        <ListItem className={ITEM}>
          로컬: Ollama 를 컨텍스트를 늘려 띄운다 (예:{' '}
          <Mono>OLLAMA_CONTEXT_LENGTH=32768 ollama serve</Mono>). 기본값은 작아서 입력을 오류 없이
          잘라 버리는데, 그러면 실행이 멈추고 이유를 알린다.
        </ListItem>
        <ListItem className={ITEM}>
          과제 전체(dev)는 harness 를 <Mono>--live --all-tasks</Mono> 로 직접 돌린 뒤{' '}
          <Mono>pnpm quality:collect --profile=eval --from=tmp/llm-evals/&lt;실행&gt;</Mono> 로
          가져온다.
        </ListItem>
      </List>
    </Part>

    <Part title="결과는 어떻게 나오나">
      <List className="flex flex-col gap-xs">
        <ListItem className={ITEM}>
          <Mono>eval-live-&lt;날짜&gt;-&lt;시각&gt;</Mono> 실행이 하나 생기고, 실행 선택에서 고르면
          이 칸에 보인다. 어떤 제공자 · 모델로 돌렸는지는 각 평가 화면의 "이 실행" 과 상세 칸에
          나온다.
        </ListItem>
        <ListItem className={ITEM}>
          variant 마다 묶여 과제 · 시도마다 한 행이다. 막대는 그 variant 안의 최댓값 기준이다.
        </ListItem>
        <ListItem className={ITEM}>
          한도로 실행하지 않은 variant 는 0 이 아니라 "실행하지 않음" 과 이유로 남는다.
        </ListItem>
        <ListItem className={ITEM}>
          모델마다 토큰을 세는 방식(tokenizer)이 달라, 다른 모델의 실제 입력과는 숫자를 바로
          비교하지 않는다. 같은 모델끼리 variant 를 비교한다.
        </ListItem>
        <ListItem className={ITEM}>
          같은 실행이 성적표 · 라우팅 · 검색 · 검증에도 실제 모델 결과로 나온다. Progressive +
          Repair 는 아직 수정 단계를 돌리지 않아 Verification 과 같게 동작한다.
        </ListItem>
      </List>
    </Part>
  </section>
);
