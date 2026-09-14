import { Checkbox, Chip } from '@berrypjh/react-ui';

import type {
  ComparisonMeta,
  DesignerPropertyValue,
  PropertyOverrides,
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
 * 컨트롤은 시맨틱에 맞는 것을 쓴다 — 배타 선택은 `Chip selected`(aria-pressed), boolean 은
 * `Checkbox`. 독립 region 으로 두어 COMMAND 06 이 drawer 로 감쌀 수 있게 한다.
 */
export const PropertiesInspector = ({
  comparison,
  overrides,
  onChange,
  onReset,
}: {
  comparison: ComparisonMeta;
  overrides: PropertyOverrides;
  onChange: (prop: string, value: DesignerPropertyValue | undefined) => void;
  onReset: () => void;
}) => {
  const { properties } = comparison;

  return (
    <section aria-label="Properties" data-testid="properties-inspector" className="min-w-0">
      <Section
        title="Properties"
        note="Canvas 의 현재 scenario 위에만 적용된다"
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
            이 컴포넌트는 Designer 에서 조절할 property 를 선언하지 않았다.
          </p>
        ) : (
          <div className="flex flex-col gap-lg">
            {properties.map((property) =>
              property.control.kind === 'enum' ? (
                <div key={property.id}>
                  <p
                    id={`property-${property.id}`}
                    className="text-text-light text-xxsm font-semiBold mb-xs"
                  >
                    {property.label}
                  </p>
                  <div
                    role="group"
                    aria-labelledby={`property-${property.id}`}
                    className="flex flex-wrap gap-xs"
                  >
                    {property.control.options.map((option) => {
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
                </div>
              ) : (
                <Checkbox
                  key={property.id}
                  checked={overrides[property.prop] === true}
                  onChange={(e) => onChange(property.prop, e.target.checked ? true : undefined)}
                  data-testid={`property-${property.id}`}
                >
                  {property.label}
                </Checkbox>
              ),
            )}
          </div>
        )}
      </Section>
    </section>
  );
};
