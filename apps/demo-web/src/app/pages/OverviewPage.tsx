import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { Page, Section } from '../shell/ui';
import { RuntimeVerification } from '../verification/RuntimeVerification';
import { useCurrentTheme } from '../verification/useCurrentTheme';

/** 개발자가 들어와서 가장 먼저 보는 화면. 현재 상태와 다음 행동만 담는다. */

const ENTRIES = [
  {
    to: '/verify',
    name: 'Runtime',
    desc: '토큰이 이 실행 환경의 최종 UI까지 도달했는지 테마별로 확인합니다.',
  },
  { to: '/tokens', name: 'Tokens', desc: '현재 테마의 토큰을 이름이나 CSS 변수로 찾습니다.' },
  {
    to: '/foundation',
    name: 'Styles',
    desc: '토큰 계층, 버튼 색 역할, 필드 상태, elevation, motion.',
  },
  {
    to: '/components/button',
    name: '컴포넌트',
    desc: '실제 앱 환경에서 컴포넌트 상태를 확인합니다.',
  },
];

export const OverviewPage = () => {
  const theme = useCurrentTheme();

  return (
    <Page
      testId="overview-page"
      title="개요"
      lead="Shared Stack이 이 실행 환경에서 제대로 통합됐는지 확인합니다."
    >
      <Section title="Runtime 검증" note="Default와 Sample을 동시에 측정합니다">
        <RuntimeVerification theme={theme} />
      </Section>

      <Section title="바로가기">
        <List className="border-t border-stroke-light">
          {ENTRIES.map((e) => (
            <ListItem key={e.to} className="border-b border-stroke-light">
              <Link
                to={e.to}
                className="flex flex-col sm:flex-row sm:items-baseline gap-2xs sm:gap-lg py-lg no-underline group"
              >
                <span className="text-text-default text-xsm font-semiBold sm:w-[160px] shrink-0 group-hover:text-text-primary">
                  {e.name}
                </span>
                <span className="text-text-light text-xsm">{e.desc}</span>
              </Link>
            </ListItem>
          ))}
        </List>
      </Section>
    </Page>
  );
};

export default OverviewPage;
