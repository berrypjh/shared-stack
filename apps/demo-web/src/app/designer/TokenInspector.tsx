import { useState } from 'react';

import { ThemeName } from '@berrypjh/react-ui';

import { TokenPreview } from '../pages/TokenPreview';
import type { TokenBinding, TokenIntrospection } from '../presentation/model';
import { resolveToken } from '../presentation/tokenCatalog';
import { Section } from '../shell/ui';

/**
 * Token Inspector.
 *
 * token list 페이지가 아니다 — **지금 고른 컴포넌트·scenario·state 를 설명하는** 도구다.
 * 그래서 binding 은 definition 이 stylesheet 근거로 고른 것만 오고, 문맥에 맞는 것만 그린다.
 *
 * token identity(id)와 CSS 변수는 theme 과 무관하게 고정이고, theme 을 바꾸면 **해석된 값만**
 * 바뀐다. 값은 metadata 가 아니라 공개 catalog 에서 매 렌더에 읽는다.
 *
 * 폭을 강제하지 않는다 — 배치는 부모가 정한다. 긴 token 이름과 CSS 변수는 가로 스크롤을
 * 만들지 않고 `break-all` 로 줄바꿈한다.
 *
 * lineage(semantic → primitive)는 공개 artifact 에 없다. 있는 척하지 않고 사실을 적는다.
 */

type CopyState = { label: string; ok: boolean } | null;

const useCopy = () => {
  const [state, setState] = useState<CopyState>(null);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setState({ label, ok: true });
    } catch {
      // 실패를 성공처럼 보이게 하지 않는다.
      setState({ label, ok: false });
    }
  };

  return { state, copy };
};

/**
 * 글자 자체가 복사 버튼이다 — Figma Dev Mode 처럼 보이는 이름을 누르면 그 이름이 복사된다.
 * 칩 두 개를 따로 두면 좁은 패널에서 한 토큰이 세 줄로 늘어났다.
 *
 * 접근 가능한 이름은 보이는 글자로 시작한다 (WCAG 2.5.3).
 */
const CopyText = ({
  text,
  action,
  onCopy,
}: {
  text: string;
  action: string;
  onCopy: (text: string, label: string) => void;
}) => (
  <button
    type="button"
    aria-label={`${text} ${action}`}
    title={action}
    onClick={() => onCopy(text, text)}
    className="min-w-0 flex-1 text-left font-mono text-xxsm break-all rounded-xs px-xs -mx-xs cursor-copy hover:bg-background-default"
  >
    {text}
  </button>
);

const TokenRow = ({
  tokenId,
  theme,
  onCopy,
}: {
  tokenId: string;
  theme: ThemeName;
  onCopy: (text: string, label: string) => void;
}) => {
  const resolved = resolveToken(tokenId, theme);

  return (
    <div className="py-sm border-t border-stroke-light first:border-t-0 flex flex-col gap-xs">
      <div className="flex items-center gap-sm text-text-default">
        <CopyText text={tokenId} action="이름 복사" onCopy={onCopy} />
        {resolved.ok ? (
          // 값은 글자로도 준다 — 색만으로 뜻을 전달하지 않는다.
          <span className="shrink-0 text-text-default text-xxsm">{resolved.token.value}</span>
        ) : (
          <span className="shrink-0 text-text-light text-xxsm" role="status">
            {resolved.reason === 'unknown-theme'
              ? `이 theme(${theme})은 token catalog 에 없음`
              : resolved.reason === 'unknown-token'
                ? 'catalog 에 없는 token'
                : '이 theme 에 값 없음'}
          </span>
        )}
      </div>

      {resolved.ok && (
        <div className="flex items-center gap-sm text-text-light">
          <CopyText text={resolved.token.cssVar} action="변수 복사" onCopy={onCopy} />
          <span className="shrink-0">
            <TokenPreview path={tokenId} value={resolved.token.value} />
          </span>
        </div>
      )}
    </div>
  );
};

/** 지금 고른 scenario·state 에 해당하는 binding 만 남긴다. */
const applicable = (
  bindings: readonly TokenBinding[],
  scenarioId: string | undefined,
  stateIds: readonly string[],
): readonly TokenBinding[] =>
  bindings.filter((binding) => {
    const scenarioOk =
      binding.scenarioIds === undefined ||
      (scenarioId !== undefined && binding.scenarioIds.includes(scenarioId));
    const stateOk =
      binding.stateIds === undefined || binding.stateIds.some((id) => stateIds.includes(id));
    return scenarioOk && stateOk;
  });

export const TokenInspector = ({
  componentLabel,
  tokens,
  scenarioId,
  stateIds,
  theme,
}: {
  componentLabel: string;
  tokens: TokenIntrospection | undefined;
  scenarioId: string | undefined;
  /** 이 컴포넌트가 선언한 state id 목록. state 로 좁힌 binding 을 걸러내는 데 쓴다. */
  stateIds: readonly string[];
  theme: ThemeName;
}) => {
  const { state, copy } = useCopy();
  const shown = tokens ? applicable(tokens.bindings, scenarioId, stateIds) : [];

  return (
    <section aria-label="Token Inspector" data-testid="token-inspector" className="min-w-0">
      <Section title="Tokens" note={`${componentLabel} 를 그리는 토큰 · 현재 테마 ${theme}`}>
        {/* 복사 결과는 조용히 지나가면 안 된다 — 시각과 보조 기술 양쪽에 알린다. */}
        <p
          aria-live="polite"
          data-testid="copy-status"
          className={`text-xxsm mb-md ${state?.ok === false ? 'text-text-error' : 'text-text-light'}`}
        >
          {state === null
            ? ''
            : state.ok
              ? `복사 완료: ${state.label}`
              : `복사 실패: ${state.label}`}
        </p>

        {shown.length === 0 ? (
          <p role="status" className="text-text-light text-xsm break-keep">
            이 컴포넌트의 토큰은 현재 introspect 불가. 쓰이는 토큰은 컴포넌트 stylesheet 를 읽은
            근거가 있을 때만 적고, 추측으로 채우지 않음
          </p>
        ) : (
          <div className="flex flex-col gap-lg">
            {/* Photoshop 레이어 그룹처럼 묶음 단위로 접는다. 처음에는 모두 펼쳐 둔다. */}
            {shown.map((binding) => (
              <details key={binding.id} open>
                <summary className="cursor-pointer text-text-light text-xxsm font-semiBold mb-xs">
                  {binding.label} ({binding.tokenIds.length})
                </summary>
                {binding.tokenIds.map((tokenId) => (
                  <TokenRow key={tokenId} tokenId={tokenId} theme={theme} onCopy={copy} />
                ))}
              </details>
            ))}
          </div>
        )}

        {tokens?.notes && tokens.notes.length > 0 && (
          <ul className="flex flex-col gap-sm mt-xl" data-testid="token-notes">
            {tokens.notes.map((note) => (
              <li key={note} className="text-text-light text-xxsm break-keep">
                {note}
              </li>
            ))}
          </ul>
        )}

        {/*
          공개 token artifact 는 해석된 값만 담는다 — 생성기가 alias 참조를 내보내지 않는다.
          그래서 계보를 만들어 낼 수 없고, 만들어 낸 척하지도 않는다.
        */}
        <p className="text-text-light text-xxsm mt-xl break-keep" data-testid="lineage-limit">
          Semantic / Primitive lineage — Not currently introspectable from the public token catalog.
          공개 토큰 artifact 는 해석된 값만 담고 alias 참조를 내보내지 않음
        </p>
      </Section>
    </section>
  );
};
