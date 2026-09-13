import fs from 'node:fs/promises';
import path from 'node:path';

import { VERIFICATION_KINDS, VERIFICATION_STATUSES } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import {
  VERIFICATION_KINDS as EVAL_VERIFICATION_KINDS,
  VERIFICATION_STATUSES as EVAL_VERIFICATION_STATUSES,
} from '../../evals/consumer/runner/schema';
import { REPO_ROOT } from '../generate-consumer-catalog/config';

import { commandById, COMMANDS, PROFILE_COMMANDS, UnregisteredCommandError } from './registry';

describe('command registry', () => {
  it('계약의 verification 어휘는 eval harness 와 같다', () => {
    expect([...VERIFICATION_STATUSES]).toEqual([...EVAL_VERIFICATION_STATUSES]);
    expect([...VERIFICATION_KINDS]).toEqual([...EVAL_VERIFICATION_KINDS]);
  });

  it('등록되지 않은 id 는 실행 대상으로 해석되지 않는다', () => {
    expect(() => commandById('rm -rf /')).toThrow(UnregisteredCommandError);
    expect(() => commandById('test.quality-lab --watch')).toThrow(UnregisteredCommandError);
  });

  it('id 는 겹치지 않는다', () => {
    const ids = COMMANDS.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('static profile 은 어떤 명령도 실행하지 않는다', () => {
    expect(PROFILE_COMMANDS.static).toEqual([]);
  });

  it('pnpm script 를 가리키는 명령은 실제 root script 가 있다', async () => {
    const { scripts } = JSON.parse(await fs.readFile(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    const scriptCommands = COMMANDS.filter(
      (command) =>
        command.argv[0] === 'pnpm' && command.argv[1] !== 'nx' && command.argv[1] !== 'exec',
    );
    expect(scriptCommands.length).toBeGreaterThan(0);
    for (const command of scriptCommands) expect(Object.keys(scripts)).toContain(command.argv[1]);
  });
});
