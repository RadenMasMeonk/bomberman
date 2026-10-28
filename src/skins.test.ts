import { describe, expect, it } from 'vitest';
import { DEFAULT_SKIN_ID, SKINS, getSkin, isSkinId } from './skins';

describe('player skins', () => {
  it('exposes unique ids', () => {
    const ids = new Set(SKINS.map((s) => s.id));
    expect(ids.size).toBe(SKINS.length);
  });

  it('keeps the default skin in the roster', () => {
    expect(isSkinId(DEFAULT_SKIN_ID)).toBe(true);
  });

  it('resolves a known skin by id', () => {
    expect(getSkin('azure').name).toBe('AZURE TIDE');
  });

  it('falls back to the first skin for unknown or missing ids', () => {
    expect(getSkin('does-not-exist')).toBe(SKINS[0]);
    expect(getSkin(null)).toBe(SKINS[0]);
    expect(getSkin(undefined)).toBe(SKINS[0]);
  });

  it('gives every skin a complete palette', () => {
    for (const skin of SKINS) {
      for (const color of Object.values(skin.palette)) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});
