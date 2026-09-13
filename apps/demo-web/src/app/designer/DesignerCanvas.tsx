import { Chip } from '@berrypjh/react-ui';

import type { PropertyOverrides, ScenarioMeta } from '../presentation/model';
import type { WebPresentation } from '../presentation/registry';
import { Panel, Section } from '../shell/ui';

import { StateMatrix } from './StateMatrix';
import { VariantMatrix } from './VariantMatrix';

/**
 * Canvas region — scenario 선택 · Canvas · 비교.
 *
 * Developer View 와 **같은 scenario source** 를 읽고, Canvas · Variant Matrix · State Matrix 가
 * 모두 같은 `renderScenario` adapter 를 쓴다. docs chrome 은 가져오지 않는다 — adapter 는
 * example 만 돌려주고 면은 여기가 소유한다.
 *
 * state 를 갖지 않는다. scenario 와 override 는 Inspector 와 공유해야 하므로 workspace session 이
 * 소유하고, 이 region 은 받은 것을 그린다.
 *
 * Canvas 가 primary working area 다 — 비교가 Canvas 를 대체하지 않고 아래로 이어진다.
 */
export const DesignerCanvas = ({
  presentation,
  active,
  overrides,
  onSelectScenario,
}: {
  presentation: WebPresentation;
  active: ScenarioMeta | undefined;
  overrides: PropertyOverrides;
  onSelectScenario: (scenarioId: string) => void;
}) => {
  const { data, renderScenario } = presentation;
  const comparison = data.comparison;
  const overrideNames = Object.keys(overrides);

  return (
    <div className="flex flex-col gap-2xl min-w-0">
      <Section title="Scenario" note="Developer View 와 같은 presentation definition 을 읽는다">
        <div role="group" aria-label="Scenario" className="flex flex-wrap gap-xs">
          {data.scenarios.map((scenario) => (
            <Chip
              key={scenario.id}
              size="sm"
              selected={scenario.id === active?.id}
              onClick={() => onSelectScenario(scenario.id)}
            >
              {scenario.label}
            </Chip>
          ))}
        </div>
      </Section>

      {/* 제목에 컴포넌트 이름을 넣어, 보조 기술에서 이 canvas 가 무엇을 그리는지가 제목만으로 드러난다. */}
      <Section
        title={`Canvas · ${data.label}`}
        note={
          active
            ? `${active.id}${
                overrideNames.length > 0 ? ` · override: ${overrideNames.join(', ')}` : ''
              }`
            : undefined
        }
      >
        <Panel
          testId="designer-canvas"
          className="flex flex-wrap gap-lg items-center min-h-[180px]"
        >
          {active ? renderScenario(active.id, overrides) : null}
        </Panel>
      </Section>

      {comparison?.variantMatrix && (
        <VariantMatrix
          componentLabel={data.label}
          matrix={comparison.variantMatrix}
          renderScenario={renderScenario}
        />
      )}

      {comparison?.stateMatrix && (
        <StateMatrix
          componentLabel={data.label}
          matrix={comparison.stateMatrix}
          renderScenario={renderScenario}
        />
      )}

      {/*
        축이 없는 컴포넌트는 빈 matrix 를 만들지 않고 이유를 밝힌다. 없는 기능을 있는 것처럼
        보이게 하지 않는 것이 이 화면의 규칙이다.
      */}
      {comparison?.notes && comparison.notes.length > 0 && (
        <Section title="비교 범위">
          <ul className="flex flex-col gap-sm" data-testid="comparison-notes">
            {comparison.notes.map((note) => (
              <li key={note} className="text-text-light text-xxsm break-keep">
                {note}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {!comparison && (
        <p role="status" className="text-text-light text-xsm break-keep">
          이 컴포넌트는 아직 비교 metadata 를 선언하지 않았다.
        </p>
      )}
    </div>
  );
};
