import { Link } from 'react-router-dom';

import { entityById } from '@/lib/catalog/entities';

export const LINK = 'text-text-link underline-offset-2 hover:underline';

/**
 * 카탈로그 ID 를 그 항목 화면으로 가는 링크로. 찾지 못하면 ID 를 글자로만 둔다.
 * `hash` 를 주면 이동 뒤 그 자리(예: 상세 정보)에 머문다.
 */
export const EntityLink = ({ id, hash }: { id: string; hash?: string }) => {
  const entity = entityById(id);
  return entity ? (
    <Link to={hash ? `${entity.href}#${hash}` : entity.href} className={LINK}>
      {entity.label}
    </Link>
  ) : (
    <span>{id}</span>
  );
};
