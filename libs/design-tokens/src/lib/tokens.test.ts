import { describe, expect, it } from 'vitest';

import { classifyTokenPath, colorToRgbChannels, cssVarName, TOKEN_CATEGORIES } from './tokens.js';

describe('classifyTokenPath', () => {
  it('rewrites primitive color heads under the color category', () => {
    expect(classifyTokenPath(['primary', 'pr700'])).toEqual(['color', 'primary', 'pr700']);
    expect(classifyTokenPath(['success', 'su500'])).toEqual(['color', 'success', 'su500']);
  });

  it('rewrites semantic color heads under the color category', () => {
    expect(classifyTokenPath(['background', 'primary'])).toEqual([
      'color',
      'background',
      'primary',
    ]);
    expect(classifyTokenPath(['text', 'default'])).toEqual(['color', 'text', 'default']);
  });

  it('rewrites the selection control family under the color category', () => {
    expect(classifyTokenPath(['selectionControl', 'checked'])).toEqual([
      'color',
      'selectionControl',
      'checked',
    ]);
  });

  it('rewrites typography heads under the typography category', () => {
    expect(classifyTokenPath(['fontSize', 'md'])).toEqual(['typography', 'fontSize', 'md']);
    expect(classifyTokenPath(['fontFamilies', 'inter'])).toEqual([
      'typography',
      'fontFamilies',
      'inter',
    ]);
  });

  it('splits border width heads into primitive and semantic buckets', () => {
    expect(classifyTokenPath(['primitiveBorder', 'hairline'])).toEqual([
      'borderWidth',
      'primitive',
      'hairline',
    ]);
    expect(classifyTokenPath(['semanticBorder', 'focus'])).toEqual([
      'borderWidth',
      'semantic',
      'focus',
    ]);
  });

  it('keeps single-segment heads (spacing, radius, component) as their own category', () => {
    expect(classifyTokenPath(['spacing', 'md'])).toEqual(['spacing', 'md']);
    expect(classifyTokenPath(['radius', 'md'])).toEqual(['radius', 'md']);
    expect(classifyTokenPath(['component', 'button'])).toEqual(['component', 'button']);
  });

  it('throws on an unregistered top-level head', () => {
    expect(() => classifyTokenPath(['tertiary', 'te500'])).toThrow(
      /Unmapped token head "tertiary"/,
    );
  });

  it('throws on an empty path', () => {
    expect(() => classifyTokenPath([])).toThrow(/Invalid token path/);
  });

  it('maps every head onto a known category', () => {
    const heads = [
      'primary',
      'spacing',
      'radius',
      'primitiveBorder',
      'border',
      'fontSize',
      'shadow',
      'elevation',
      'component',
    ];
    for (const head of heads) {
      expect(TOKEN_CATEGORIES).toContain(classifyTokenPath([head, 'x'])[0]);
    }
  });
});

describe('cssVarName', () => {
  it('kebab-cases the token path behind the prefix', () => {
    expect(cssVarName('ds', ['fontSize', 'md'])).toBe('--ds-font-size-md');
    expect(cssVarName('ds', ['primitiveBorder', 'hairline'])).toBe(
      '--ds-primitive-border-hairline',
    );
    expect(cssVarName('ds', ['elevation', '0', 'offsetX'])).toBe('--ds-elevation-0-offset-x');
  });

  it('omits the prefix segment when no prefix is given', () => {
    expect(cssVarName(undefined, ['spacing', 'md'])).toBe('--spacing-md');
  });

  it('collapses underscores, spaces and repeated dashes', () => {
    expect(cssVarName('ds', ['font_weight', 'semi Bold'])).toBe('--ds-font-weight-semi-bold');
  });
});

describe('colorToRgbChannels', () => {
  it('parses 6-digit hex into space-separated channels', () => {
    expect(colorToRgbChannels('#047857')).toBe('4 120 87');
    expect(colorToRgbChannels('#FFFFFF')).toBe('255 255 255');
  });

  it('expands 3-digit hex', () => {
    expect(colorToRgbChannels('#FFF')).toBe('255 255 255');
  });

  it('ignores the alpha channel of 8-digit hex', () => {
    expect(colorToRgbChannels('#0000001f')).toBe('0 0 0');
  });

  it('parses rgb() and rgba() function notation', () => {
    expect(colorToRgbChannels('rgb(4, 120, 87)')).toBe('4 120 87');
    expect(colorToRgbChannels('rgba(4 120 87 / 0.5)')).toBe('4 120 87');
  });

  it('returns null for non-color values', () => {
    expect(colorToRgbChannels('0.75rem')).toBeNull();
    expect(colorToRgbChannels(12)).toBeNull();
    expect(colorToRgbChannels(undefined)).toBeNull();
    expect(colorToRgbChannels('#12345')).toBeNull();
  });
});

describe('TOKEN_CATEGORIES', () => {
  it('is the current ten-category ABI in order', () => {
    expect(TOKEN_CATEGORIES).toEqual([
      'color',
      'spacing',
      'radius',
      'borderWidth',
      'border',
      'typography',
      'shadow',
      'elevation',
      'component',
      'motion',
    ]);
  });
});
