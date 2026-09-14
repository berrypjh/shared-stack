import { isValidElement, type ReactNode } from 'react';

/**
 * ReactNode → 사람이 읽을 수 있는 텍스트.
 * 문자열·숫자는 그대로 쓰고, 배열과 ReactElement는 재귀로 순회해 합친다.
 */
export const getNodeText = (node: ReactNode): string => {
  if (node == null || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => getNodeText(item)).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }

  return '';
};
