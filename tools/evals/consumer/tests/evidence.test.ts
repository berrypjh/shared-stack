import { describe, expect, it } from 'vitest';

import {
  componentEvidence,
  isEvidenceId,
  parseEvidenceId,
  propEvidence,
  tokenEvidence,
} from '../runner/evidence';

describe('evidence ids', () => {
  it('round-trips component and prop ids', () => {
    expect(componentEvidence('@berrypjh/react-ui', 'Button')).toBe(
      'component:@berrypjh/react-ui#Button',
    );
    expect(parseEvidenceId(propEvidence('@berrypjh/react-ui', 'Button', 'loading'))).toEqual({
      kind: 'prop',
      owner: '@berrypjh/react-ui',
      subject: 'Button.loading',
    });
  });

  it('treats token and doc ids as ownerless', () => {
    expect(parseEvidenceId(tokenEvidence('color.primary.pr500'))).toEqual({
      kind: 'token',
      owner: null,
      subject: 'color.primary.pr500',
    });
  });

  it('rejects prose and malformed ids', () => {
    expect(isEvidenceId('the Button component')).toBe(false);
    expect(isEvidenceId('component:@berrypjh/react-ui')).toBe(false);
    expect(isEvidenceId('component:@berrypjh/react-ui#')).toBe(false);
    expect(isEvidenceId('widget:Button')).toBe(false);
  });
});
