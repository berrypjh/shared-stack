import type { ThemeName } from '@berrypjh/react-ui';

import type {
  ComparisonMeta,
  DesignerPropertyValue,
  PropertyOverrides,
  ScenarioOverrides,
  TokenIntrospection,
} from '../presentation/model';

import { PropertiesInspector } from './PropertiesInspector';
import { TokenInspector } from './TokenInspector';

/**
 * Inspector region — Properties + Tokens.
 *
 * 둘을 한 region 으로 묶는 이유는 좁은 화면에서 **함께** sheet 로 들어가야 하기 때문이다.
 * 각자 자기 labelled region 을 그대로 갖고 있어서, 묶여도 보조 기술에서 두 묶음이 구분된다.
 *
 * 폭을 강제하지 않는다 — 세 열 배치든 sheet 든 배치는 부모가 정한다.
 *
 * Photoshop 패널 독처럼 쌓는다. 자주 만지는 Properties 는 위에 고정하고, 길어지는 Tokens 만
 * 남은 높이 안에서 스크롤한다. 부모가 높이를 주지 않으면(sheet) 그냥 이어서 흐른다.
 */
export const DesignerInspector = ({
  componentLabel,
  comparison,
  tokens,
  overrides,
  onPropertyChange,
  onReset,
  scenarioId,
  scenarioProps,
  stateIds,
  theme,
}: {
  componentLabel: string;
  comparison: ComparisonMeta | undefined;
  tokens: TokenIntrospection | undefined;
  overrides: PropertyOverrides;
  onPropertyChange: (prop: string, value: DesignerPropertyValue | undefined) => void;
  onReset: () => void;
  scenarioId: string | undefined;
  scenarioProps: ScenarioOverrides | undefined;
  stateIds: readonly string[];
  theme: ThemeName;
}) => (
  <div className="flex flex-col flex-1 min-h-0 min-w-0">
    {comparison && (
      <div className="shrink-0 p-lg border-b border-stroke-light">
        <PropertiesInspector
          comparison={comparison}
          overrides={overrides}
          scenarioProps={scenarioProps}
          onChange={onPropertyChange}
          onReset={onReset}
        />
      </div>
    )}
    <div className="flex-1 min-h-0 overflow-y-auto p-lg">
      <TokenInspector
        componentLabel={componentLabel}
        tokens={tokens}
        scenarioId={scenarioId}
        stateIds={stateIds}
        theme={theme}
      />
    </div>
  </div>
);
