import { describe, expect, it } from 'vitest';

import { FLASH_ATTRIBUTE, markAnchor } from './anchor-flash';

const element = () => {
  const calls: string[] = [];
  return {
    calls,
    removeAttribute: (name: string) => calls.push(`remove ${name}`),
    setAttribute: (name: string) => calls.push(`set ${name}`),
  };
};

describe('markAnchor', () => {
  it('re-marks the decoded target so the animation plays again', () => {
    const target = element();
    const ids: string[] = [];
    const found = markAnchor(
      {
        getElementById: (id) => {
          ids.push(id);
          return target;
        },
      },
      '#%ED%85%8C%EB%A7%88-%EC%B6%94%EA%B0%80',
    );
    expect(ids).toEqual(['테마-추가']);
    expect(found).toBe(target);
    expect(target.calls).toEqual([`remove ${FLASH_ATTRIBUTE}`, `set ${FLASH_ATTRIBUTE}`]);
  });

  it('does nothing without a hash or a target', () => {
    expect(markAnchor({ getElementById: () => element() }, '')).toBeNull();
    expect(markAnchor({ getElementById: () => null }, '#missing')).toBeNull();
  });

  it('keeps a hash that is not valid percent-encoding as written', () => {
    const ids: string[] = [];
    const lookup = (id: string) => {
      ids.push(id);
      return null;
    };
    markAnchor({ getElementById: lookup }, '#100%');
    expect(ids).toEqual(['100%']);
  });
});
