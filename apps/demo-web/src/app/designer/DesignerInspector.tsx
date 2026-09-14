import type { ThemeName } from '@berrypjh/react-ui';

import type {
  ComparisonMeta,
  DesignerPropertyValue,
  PropertyOverrides,
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
 */
export const DesignerInspector = ({
  componentLabel,
  comparison,
  tokens,
  overrides,
  onPropertyChange,
  onReset,
  scenarioId,
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
  stateIds: readonly string[];
  theme: ThemeName;
}) => (
  <div className="flex flex-col gap-2xl min-w-0">
    {comparison && (
      <PropertiesInspector
        comparison={comparison}
        overrides={overrides}
        onChange={onPropertyChange}
        onReset={onReset}
      />
    )}
    <TokenInspector
      componentLabel={componentLabel}
      tokens={tokens}
      scenarioId={scenarioId}
      stateIds={stateIds}
      theme={theme}
    />
  </div>
);
