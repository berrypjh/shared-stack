import type { Observation } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { Mono } from '@/components/evaluation/mono';
import { Section } from '@/components/evaluation/section';
import { observationValueText } from '@/lib/evaluation/format';
import { OUTCOME_LABEL } from '@/lib/evaluation/labels';

const observationText = (observation: Observation) =>
  `${observationValueText(observation)}${observation.outcome ? ` · 판정 ${OUTCOME_LABEL[observation.outcome]}` : ''}`;

/** 한 영역의 원본 관측. 값이 없는 관측은 0 이 아니라 그 상태 글로 보인다. */
export const Observations = ({ items }: { items: Observation[] }) =>
  items.length === 0 ? null : (
    <List className="flex flex-col gap-xs typo-body-small">
      {items.map((observation) => (
        <ListItem key={observation.id}>
          <Mono>{observation.id}</Mono> — {observationText(observation)}
        </ListItem>
      ))}
    </List>
  );

/** 영역 카드. 영역이 없으면 0 이 아니라 unsupported 와 그 영역을 가진 run 을 보여 준다. */
export const AreaCard = ({
  title,
  present,
  missing,
  children,
}: {
  title: string;
  present: boolean;
  missing: ReactNode;
  children: ReactNode;
}) => <Section title={title}>{present ? children : missing}</Section>;
