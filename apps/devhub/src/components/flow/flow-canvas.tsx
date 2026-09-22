import {
  CanvasEdges,
  CanvasViewport,
  INSPECTOR_ID,
  type LegendItem,
  type Rect,
} from '@berrypjh/devhub-ui';
import { SkipLink } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { FlowModel, FlowNode } from '@/lib/catalog/flow';
import { NODE } from '@/lib/catalog/flow';

/** 노드 한 칸에 쓰는 글. 상태 · 담당 글자는 화면이 정한다. */
export type FlowText = {
  status: (node: FlowNode) => string;
  owner: (node: FlowNode) => string;
  box: (node: FlowNode) => string;
  href: (node: FlowNode) => string;
};

const rectOf = (node: FlowNode): Rect => ({ x: node.x, y: node.y, ...NODE });

/** 레인: 실행 위치 이름과 경계선. 장식이다 — 같은 실행 위치가 노드 안에 글로 있다. */
const Lanes = ({ model }: { model: FlowModel }) => (
  <div aria-hidden="true" className="absolute top-0 left-0" style={{ width: model.width }}>
    {model.lanes.map((lane) => (
      <div
        key={lane.id}
        className="absolute left-0 border-t border-stroke-light first:border-t-0"
        style={{ top: lane.y, height: lane.height, width: model.width }}
      >
        <span className="absolute top-md left-md w-[7.5rem] typo-caption-small text-text-light">
          {lane.name}
        </span>
      </div>
    ))}
  </div>
);

const StepItem = ({
  node,
  lane,
  text,
  selected,
  onFocus,
}: {
  node: FlowNode;
  lane: string;
  text: FlowText;
  selected: boolean;
  onFocus: (rect: Rect) => void;
}) => (
  <li
    className="absolute"
    style={{ left: node.x, top: node.y, width: NODE.width, height: NODE.height }}
  >
    <Link
      to={text.href(node)}
      aria-current={selected ? 'page' : undefined}
      onFocus={() => onFocus(rectOf(node))}
      className={[
        'flex h-full flex-col gap-2xs rounded-lg bg-background-surface p-md text-text-default shadow-xs hover:border-stroke-dark',
        text.box(node),
        selected
          ? 'outline-2 outline-offset-2 outline-stroke-primary bg-[image:linear-gradient(var(--ds-background-selected),var(--ds-background-selected))]'
          : '',
      ].join(' ')}
    >
      <span className="typo-caption-small text-text-light">
        {text.status(node)}
        {selected && (
          <span aria-hidden="true" className="typo-body-small-strong text-text-default">
            {' '}
            · 선택됨
          </span>
        )}
      </span>
      <span className="line-clamp-2 typo-body-small-strong">
        {node.order}. {node.intent}
      </span>
      <span className="mt-auto truncate typo-caption-small text-text-light">
        {lane} · {text.owner(node)}
      </span>
    </Link>
    {selected && <SkipLink targetId={INSPECTOR_ID}>이 단계의 상세 정보로 이동</SkipLink>}
  </li>
);

/**
 * 흐름 그림: 레인은 실행 위치, 선은 `next`. 노드 하나는 그 단계 주소로 가는 진짜 링크다.
 * 같은 내용이 목록 보기에 글로 있다.
 */
export const FlowCanvas = ({
  label,
  model,
  selectedId,
  text,
  legend,
}: {
  label: string;
  model: FlowModel;
  selectedId?: string;
  text: FlowText;
  legend: LegendItem[];
}) => {
  const selected = model.nodes.find((node) => node.id === selectedId);
  const laneName = new Map(model.lanes.map((lane) => [lane.id, lane.name]));
  const summary = `단계 ${model.nodes.length}개 · 연결 ${model.edges.length}개 · 선택: ${
    selected ? `${selected.order}. ${selected.intent}` : '없음'
  }`;
  return (
    <CanvasViewport
      label={label}
      content={{ width: model.width, height: model.height }}
      legend={legend}
      summary={summary}
      selected={selected && rectOf(selected)}
    >
      {({ reveal }) => (
        <>
          <Lanes model={model} />
          <CanvasEdges edges={model.edges} width={model.width} height={model.height} />
          <ol aria-label="단계" className="absolute top-0 left-0">
            {model.nodes.map((node) => (
              <StepItem
                key={node.id}
                node={node}
                lane={laneName.get(node.context) ?? node.context}
                text={text}
                selected={node.id === selectedId}
                onFocus={reveal}
              />
            ))}
          </ol>
        </>
      )}
    </CanvasViewport>
  );
};
