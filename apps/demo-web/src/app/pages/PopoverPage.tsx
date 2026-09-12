import { useState } from 'react';

import { Button, List, ListItem, Popover, PopoverPanel, PopoverTrigger } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { Page, Preview, Section } from '../shell/ui';

/**
 * Popover 데모.
 *
 * 이 페이지가 Storybook 이 보여줄 수 없는 것을 보는 자리다. Popover 는 **portal 을 쓰지
 * 않는다** — 패널이 DOM 상 그 자리에 그려지므로 앱의 stacking context 안에서 겹침이 결정된다.
 * 이 데모의 topbar 는 `z-10`, 모바일 드로어는 `z-20` 을 쓴다. 고립된 캔버스에는 그런 층이
 * 없어서 여기서만 드러난다.
 *
 * 위치도 라이브러리가 정하지 않는다. `Anchor` 가 그 몫이다.
 */

/** 위치는 소비자가 소유한다 — relative 앵커 + absolute 패널이 가장 단순한 배치다. */
const Anchor = ({ children }: { children: ReactNode }) => (
  <div className="relative inline-block">{children}</div>
);

/** 패널의 면·여백·그림자는 라이브러리가 토큰으로 그린다. 여기서 주는 것은 자리와 폭뿐이다. */
const panelPosition = 'absolute top-full left-0 mt-xs z-10 min-w-[240px]';

export const PopoverPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <Page title="Popover" lead="트리거에 붙는 비모달 surface. 위치와 겹침은 소비자가 정합니다.">
      <Section
        title="disclosure"
        note="기본 시맨틱. 트리거에 aria-expanded 만 붙고 패널에는 role 이 없다"
      >
        <Preview>
          <Anchor>
            <Popover>
              <PopoverTrigger>
                <Button variant="outlined">도움말 열기</Button>
              </PopoverTrigger>
              <PopoverPanel className={panelPosition}>
                <p className="text-text-default text-xsm break-keep">
                  패널의 배경·테두리·그림자는 라이브러리가 semantic 토큰으로 그립니다. 테마를 바꾸면
                  이 카드도 함께 움직입니다.
                </p>
              </PopoverPanel>
            </Popover>
          </Anchor>
        </Preview>
      </Section>

      <Section
        title="dialog"
        note="열리면 포커스가 패널로 들어가고 닫히면 트리거로 돌아온다. 이름이 필수다"
      >
        <Preview>
          <Anchor>
            <Popover semantics="dialog">
              <PopoverTrigger>
                <Button variant="contained">계정 메뉴</Button>
              </PopoverTrigger>
              {/* dialog 로 올리면 접근 가능한 이름을 반드시 준다 — 이름 없는 dialog 는 정체를 잃는다. */}
              <PopoverPanel aria-label="계정 메뉴" className={panelPosition}>
                <List className="text-xsm">
                  <ListItem>
                    <button
                      type="button"
                      className="w-full text-left px-sm py-xs rounded-sm text-text-default hover:bg-background-default"
                    >
                      프로필
                    </button>
                  </ListItem>
                  <ListItem>
                    <button
                      type="button"
                      className="w-full text-left px-sm py-xs rounded-sm text-text-default hover:bg-background-default"
                    >
                      설정
                    </button>
                  </ListItem>
                </List>
              </PopoverPanel>
            </Popover>
          </Anchor>
        </Preview>
      </Section>

      <Section
        title="light dismiss"
        note="바깥을 누르거나 Escape 를 누르면 닫힌다. 상태를 소비자가 들 수도 있다"
      >
        <Preview>
          <Anchor>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger>
                <Button variant="outlined">{open ? '열림' : '닫힘'}</Button>
              </PopoverTrigger>
              <PopoverPanel className={panelPosition}>
                <p className="text-text-default text-xsm break-keep">
                  바깥 클릭 · Escape 로 닫아 보세요. 버튼 라벨이 controlled 상태를 그대로
                  보여줍니다.
                </p>
              </PopoverPanel>
            </Popover>
          </Anchor>
          <span className="text-text-light text-xxsm" data-testid="popover-state">
            open: {String(open)}
          </span>
        </Preview>
      </Section>

      <Section
        title="겹침은 앱이 정한다"
        note="portal 이 없으므로 패널의 z 층과 잘림은 소비자가 책임진다"
      >
        <Preview>
          <Anchor>
            <Popover>
              <PopoverTrigger>
                <Button variant="outlined">아래 카드 위로 뜬다</Button>
              </PopoverTrigger>
              <PopoverPanel className={panelPosition}>
                <p className="text-text-default text-xsm break-keep">
                  `z-10` 을 주지 않으면 뒤따르는 카드가 패널을 덮습니다. 라이브러리는 z-index 를
                  정하지 않습니다.
                </p>
              </PopoverPanel>
            </Popover>
          </Anchor>
        </Preview>
        <div className="mt-lg bg-background-surface border border-stroke-default rounded-md p-xl">
          <p className="text-text-light text-xsm">
            뒤따르는 본문 카드입니다. 패널이 이 카드 위에 떠야 정상입니다.
          </p>
        </div>
      </Section>
    </Page>
  );
};

export default PopoverPage;
