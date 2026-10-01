import { CopyCommand, DataTable, Mono } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { LIVE_PROVIDERS, liveCommand } from '@/lib/evaluation/live';
import { collectCommand } from '@/lib/evaluation/status';

/** 제공자마다 실행 전에 준비할 것. 키는 실행할 때만 쓰고 저장하지 않는다. */
const NEEDS: Record<(typeof LIVE_PROVIDERS)[number]['id'], ReactNode> = {
  claude: (
    <>
      <Mono>ANTHROPIC_API_KEY</Mono> · 모델 이름 (예: <Mono>claude-sonnet-5-5</Mono>) · 호출마다
      비용
    </>
  ),
  openai: (
    <>
      <Mono>OPENAI_API_KEY</Mono> · 모델 이름 · 호출마다 비용
    </>
  ),
  local: (
    <>
      Ollama 를 <Mono>OLLAMA_CONTEXT_LENGTH=32768 ollama serve</Mono> 로 띄움 · 모델 이름 (예:{' '}
      <Mono>qwen3:14b</Mono>) · 비용 없음
    </>
  ),
};

/** 실행 위치 · 키 안내와 제공자별 명령 표. */
const CommandTable = () => (
  <>
    <p className="typo-body-small break-keep text-text-light">
      저장소 루트에서 실행한다. 키는 루트 <Mono>.env</Mono> 나 환경변수에 두면 되고, 끝나면 위 실행
      선택에 새 실행이 생긴다.
    </p>
    <DataTable caption="평가 돌리는 명령" headers={['무엇으로', '명령', '필요한 것']}>
      <tr>
        <th scope="row" className="whitespace-nowrap">
          모델 없이 확인
        </th>
        <td>
          <CopyCommand command={collectCommand('eval')} />
        </td>
        <td className="break-keep">정해 둔 결과로 평가 도구만 확인 · 점수는 모델 성능이 아님</td>
      </tr>
      {LIVE_PROVIDERS.map((provider) => (
        <tr key={provider.id}>
          <th scope="row" className="whitespace-nowrap">
            {provider.label}
          </th>
          <td>
            <CopyCommand command={liveCommand(provider.id)} />
          </td>
          <td className="break-keep">{NEEDS[provider.id]}</td>
        </tr>
      ))}
    </DataTable>
  </>
);

/**
 * 소비자 평가를 다시 돌리는 명령. 평가 · 수집 · DevHub 로 내보내기까지 한 번에 하고, 끝나면 실행
 * 선택에 새 실행이 생긴다. 명령 버튼은 복사만 한다. 본문 맨 아래에 접어 두고 `open` 일 때만 펼친
 * 채로 시작한다. `children` 은 표 아래에 붙는 화면별 안내다.
 */
export const EvalCommands = ({
  open,
  title = '평가 돌리는 법',
  children,
}: {
  open: boolean;
  title?: string;
  children?: ReactNode;
}) => (
  <section aria-label={title}>
    <details open={open} className="rounded-md border border-stroke-light bg-background-surface">
      <summary className="cursor-pointer px-md py-sm typo-body-small-strong text-text-default">
        {title}
      </summary>
      <div className="flex flex-col gap-sm border-t border-stroke-light p-md">
        <CommandTable />
        {children}
      </div>
    </details>
  </section>
);
