import { Checkbox, Chip } from '@berrypjh/react-ui';

import type {
  ComparisonMeta,
  ComparisonOption,
  DesignerPropertyValue,
  PropertyOverrides,
  ScenarioOverrides,
} from '../presentation/model';
import { Section } from '../shell/ui';

/**
 * Properties Inspector.
 *
 * definition 이 고른 **curated** property 만 그린다 — 생성 카탈로그의 prop 전체를 쏟지 않는다.
 * 라벨은 designer 용 말(`variant` → Style)이고 실제 prop key 는 metadata 안에 그대로 남아
 * source 와 묶여 있다.
 *
 * 값은 Canvas 위의 local override 다. 원본 scenario 를 바꾸지 않는다.
 *
 * 각 property 아래에 지금 scenario 가 정한 값을 적는다. 정하지 않은 값은 추측하지 않고
 * "미지정"으로 적는다 — 데모는 컴포넌트 기본값을 담고 있지 않다.
 *
 * 컨트롤은 시맨틱에 맞는 것을 쓴다 — 배타 선택은 `Chip selected`(aria-pressed), boolean 은
 * `Checkbox`. 독립 region 으로 두어 COMMAND 06 이 drawer 로 감쌀 수 있게 한다.
 */
const UNSET = '미지정 · 컴포넌트 기본값';

/** scenario 값을 option 라벨로 보여 준다. option 에 없는 값은 원래 값을 그대로 적는다. */
const scenarioLabel = (options: readonly ComparisonOption[], value: unknown): string => {
  if (value === undefined) return UNSET;
  return options.find((o) => o.value === value)?.label ?? String(value);
};

export const PropertiesInspector = ({
  comparison,
  overrides,
  scenarioProps,
  onChange,
  onReset,
}: {
  comparison: ComparisonMeta;
  overrides: PropertyOverrides;
  scenarioProps: ScenarioOverrides | undefined;
  onChange: (prop: string, value: DesignerPropertyValue | undefined) => void;
  onReset: () => void;
}) => {
  const { properties } = comparison;
  const enums = properties.flatMap((property) =>
    property.control.kind === 'enum' ? [{ property, options: property.control.options }] : [],
  );
  const toggles = properties.filter((property) => property.control.kind === 'boolean');
  const scenarioToggles = toggles.filter(
    (property) => scenarioProps?.[property.prop] !== undefined,
  );

  return (
    <section aria-label="Properties" data-testid="properties-inspector" className="min-w-0">
      <Section
        title="Properties"
        note="Canvas 의 현재 scenario 에만 적용"
        actions={
          Object.keys(overrides).length > 0 ? (
            <Chip size="sm" onClick={onReset}>
              초기화
            </Chip>
          ) : undefined
        }
      >
        {properties.length === 0 ? (
          <p role="status" className="text-text-light text-xsm break-keep">
            이 컴포넌트는 Designer 에서 조절할 property 를 선언하지 않음
          </p>
        ) : (
          <div className="flex flex-col gap-md">
            {/* Figma 처럼 라벨은 왼쪽 고정 열, 값은 오른쪽 — 위아래로 쌓을 때보다 높이가 절반이다. */}
            <div className="grid grid-cols-[56px_1fr] items-start gap-x-md gap-y-sm">
              {enums.map(({ property, options }) => (
                <div key={property.id} className="contents">
                  <p
                    id={`property-${property.id}`}
                    className="text-text-light text-xxsm font-semiBold pt-2xs"
                  >
                    {property.label}
                  </p>
                  <div className="min-w-0">
                    <div
                      role="group"
                      aria-labelledby={`property-${property.id}`}
                      aria-describedby={`property-${property.id}-scenario`}
                      className="flex flex-wrap gap-xs"
                    >
                      {options.map((option) => {
                        const selected = overrides[property.prop] === option.value;
                        return (
                          <Chip
                            key={option.id}
                            size="sm"
                            selected={selected}
                            // 같은 값을 다시 누르면 override 를 걷어낸다 — scenario 원래 값으로 돌아간다.
                            onClick={() =>
                              onChange(property.prop, selected ? undefined : option.value)
                            }
                          >
                            {option.label}
                          </Chip>
                        );
                      })}
                    </div>
                    <p
                      id={`property-${property.id}-scenario`}
                      className="text-text-light text-xxsm mt-2xs"
                    >
                      scenario: {scenarioLabel(options, scenarioProps?.[property.prop])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* boolean 은 툴바의 토글 묶음처럼 한 줄에 둔다. */}
            {toggles.length > 0 && (
              <div className="flex flex-wrap gap-x-lg gap-y-xs">
                {toggles.map((property) => (
                  <Checkbox
                    key={property.id}
                    checked={overrides[property.prop] === true}
                    onChange={(e) => onChange(property.prop, e.target.checked ? true : undefined)}
                    data-testid={`property-${property.id}`}
                  >
                    {property.label}
                  </Checkbox>
                ))}
                <p className="w-full text-text-light text-xxsm" data-testid="toggles-scenario">
                  scenario:{' '}
                  {scenarioToggles.length === 0
                    ? UNSET
                    : scenarioToggles
                        .map((p) => `${p.label} ${scenarioProps?.[p.prop] ? '켜짐' : '꺼짐'}`)
                        .join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </Section>
    </section>
  );
};
