import { Fragment, type ReactNode } from 'react';

import { Page, Panel, Preview, Section } from '../shell/ui';

import type { PresentationSection } from './model';
import type { WebPresentation } from './registry';

/**
 * Developer View renderer. shared scenario 목록을 docs 형태로 그린다.
 *
 * docs chrome(`Preview` · `Panel`)은 **이 layer 가 소유한다**. adapter 가 그것을 내보내면
 * Designer canvas 안에 docs surface 가 한 겹 더 생긴다 — scenario 는 example 만 돌려준다.
 *
 * `Fragment` 로 감싸는 이유는 DOM 을 하나도 더하지 않기 위해서다. wrapper element 를 두면
 * scenario 가 `Preview` 의 flex item 자리를 잃는다.
 */
const SectionBody = ({
  section,
  renderScenario,
}: {
  section: PresentationSection;
  renderScenario: (scenarioId: string) => ReactNode;
}) => {
  if (section.surface === 'panel') {
    return (
      <div className="flex flex-col gap-lg">
        {section.scenarioIds.map((id) => (
          <Panel key={id}>{renderScenario(id)}</Panel>
        ))}
      </div>
    );
  }

  return (
    <Preview>
      {section.scenarioIds.map((id) => (
        <Fragment key={id}>{renderScenario(id)}</Fragment>
      ))}
    </Preview>
  );
};

export const DeveloperComponentPage = ({ presentation }: { presentation: WebPresentation }) => {
  const { data, renderScenario } = presentation;

  return (
    <Page title={data.label} lead={data.lead}>
      {data.sections.map((section) => (
        <Section key={section.id} title={section.label} note={section.note}>
          <SectionBody section={section} renderScenario={renderScenario} />
          {section.footnote && (
            <Panel className="mt-lg">
              <p className="text-text-light text-xsm break-keep">{section.footnote}</p>
            </Panel>
          )}
        </Section>
      ))}
    </Page>
  );
};
