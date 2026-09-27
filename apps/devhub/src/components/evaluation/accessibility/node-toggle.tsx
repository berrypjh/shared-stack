import { useId, useRef, useState } from 'react';

import type { AxeRule } from '@berrypjh/observability-contracts';
import { Button, List, ListItem } from '@berrypjh/react-ui';

import { Mono } from '../mono';

/** 노드 목록 펼침. 안쪽 접기 버튼으로 닫으면 포커스를 여는 버튼으로 돌려준다. */
export const NodeToggle = ({ rule }: { rule: AxeRule }) => {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  return (
    <>
      <Button
        ref={toggle}
        variant="text"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${rule.id} 영향받은 노드 ${rule.nodeCount}개`}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '접기' : '펼치기'}
      </Button>
      <div id={panelId} hidden={!open} className="mt-xs flex flex-col gap-xs">
        <List className="flex flex-col gap-xs">
          {rule.nodes.map((node, index) => (
            <ListItem key={`${node.target.join('|')}-${index}`}>
              <Mono>{node.target.join(' , ')}</Mono>
              {node.excerpt && (
                <code className="devhub-code typo-caption-small block break-all text-text-light">
                  {node.excerpt}
                </code>
              )}
            </ListItem>
          ))}
        </List>
        {rule.nodeCount > rule.nodes.length && (
          <p className="typo-caption-small text-text-light">{`${rule.nodes.length}개만 싣는다 (전체 ${rule.nodeCount}개)`}</p>
        )}
        <Button
          variant="text"
          size="sm"
          aria-label={`${rule.id} 노드 목록 접기`}
          onClick={() => {
            setOpen(false);
            toggle.current?.focus();
          }}
        >
          접기
        </Button>
      </div>
    </>
  );
};
