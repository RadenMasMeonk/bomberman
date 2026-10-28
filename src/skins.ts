// Player skin roster — pure data, shared by the menu and the canvas renderer.

export interface SkinPalette {
  body: string;
  bodyEdge: string;
  limbs: string;
  hood: string;
  accent: string;
  mask: string;
  eyes: string;
  aura: string;
}

export interface Skin {
  id: string;
  name: string;
  realm: string;
  desc: string;
  swatch: readonly [string, string];
  palette: SkinPalette;
}

export const DEFAULT_SKIN_ID = 'crimson';

export const SKINS: readonly Skin[] = [
  {
    id: 'crimson',
    name: 'CRIMSON RONIN',
    realm: 'The Lantern Market',
    desc: 'Ninja klasik dengan ikat kepala merah menyala.',
    swatch: ['#1e293b', '#dc2626'],
    palette: {
      body: '#1e293b',
      bodyEdge: '#0b1220',
      limbs: '#172033',
      hood: '#111827',
      accent: '#dc2626',
      mask: '#e2e8f0',
      eyes: '#0b1220',
      aura: '#3b82f6',
    },
  },
  {
    id: 'azure',
    name: 'AZURE TIDE',
    realm: 'The Shattered Stones',
    desc: 'Arus biru yang tenang, secepat ombak malam.',
    swatch: ['#123a5c', '#38bdf8'],
    palette: {
      body: '#123a5c',
      bodyEdge: '#082033',
      limbs: '#0e2a44',
      hood: '#081a2b',
      accent: '#38bdf8',
      mask: '#e0f2fe',
      eyes: '#04121f',
      aura: '#38bdf8',
    },
  },
  {
    id: 'jade',
    name: 'JADE SPECTER',
    realm: 'The Hollow Woods',
    desc: 'Hantu hutan yang menyatu dengan cahaya kunang-kunang.',
    swatch: ['#14532d', '#4ade80'],
    palette: {
      body: '#14532d',
      bodyEdge: '#052e16',
      limbs: '#0f3d22',
      hood: '#062a17',
      accent: '#4ade80',
      mask: '#ecfdf5',
      eyes: '#06210f',
      aura: '#4ade80',
    },
  },
  {
    id: 'amethyst',
    name: 'AMETHYST VEIL',
    realm: 'The Molten Keep',
    desc: 'Selubung ungu yang menari di antara bara magma.',
    swatch: ['#3b0764', '#c084fc'],
    palette: {
      body: '#3b0764',
      bodyEdge: '#1e0533',
      limbs: '#2a0a4a',
      hood: '#190428',
      accent: '#c084fc',
      mask: '#f3e8ff',
      eyes: '#1a0526',
      aura: '#c084fc',
    },
  },
  {
    id: 'gilded',
    name: 'GILDED WARDEN',
    realm: 'The Edge of Night',
    desc: 'Penjaga gerbang emas, bersinar di ujung dunia.',
    swatch: ['#78350f', '#fbbf24'],
    palette: {
      body: '#78350f',
      bodyEdge: '#3b1d06',
      limbs: '#5c2a0a',
      hood: '#2f1704',
      accent: '#fbbf24',
      mask: '#fffbeb',
      eyes: '#2a1a05',
      aura: '#fbbf24',
    },
  },
  {
    id: 'frost',
    name: 'FROST SHADE',
    realm: 'The Hidden Shrine',
    desc: 'Bayangan salju dari dojo tersembunyi.',
    swatch: ['#1e3a5f', '#a5f3fc'],
    palette: {
      body: '#1e3a5f',
      bodyEdge: '#0b1e33',
      limbs: '#15304d',
      hood: '#0a1a2b',
      accent: '#a5f3fc',
      mask: '#ffffff',
      eyes: '#0a1a2b',
      aura: '#a5f3fc',
    },
  },
];

export function getSkin(id: string | null | undefined): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function isSkinId(id: string | null | undefined): id is string {
  return SKINS.some((s) => s.id === id);
}
