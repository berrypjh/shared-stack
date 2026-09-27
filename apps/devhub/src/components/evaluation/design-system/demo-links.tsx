import { List, ListItem } from '@berrypjh/react-ui';

import { LINK } from '@/components/ui/entity-link';
import { DEMO_WEB_COMMAND, DEMO_WEB_LINKS } from '@/lib/evaluation/design-system';

import { CopyCommand } from '../copy-command';
import { Section } from '../section';

/** 토큰 탐색 · consumer preview 는 demo-web 으로 연결만 한다. */
export const DemoLinks = () => (
  <Section title="토큰 탐색 · consumer preview">
    <p className="typo-body-small break-keep text-text-light">
      평가는 토큰 inspector 와 consumer preview 를 복제하지 않는다. demo-web 로컬 서버에서 본다.
    </p>
    <List className="typo-body-small flex flex-wrap gap-md">
      {DEMO_WEB_LINKS.map((link) => (
        <ListItem key={link.href}>
          <a className={LINK} href={link.href}>
            {link.label}
          </a>
        </ListItem>
      ))}
    </List>
    <CopyCommand command={DEMO_WEB_COMMAND} />
  </Section>
);
