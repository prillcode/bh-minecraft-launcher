export interface ModCategory {
  id: string;
  label: string;
  slugs: string[];
}

export const MOD_CATEGORIES: ModCategory[] = [
  {
    id: 'compatibility',
    label: 'Compatibility',
    slugs: ['fabric-api'],
  },
  {
    id: 'performance',
    label: 'Performance',
    slugs: ['sodium', 'lithium', 'ferrite-core', 'entityculling'],
  },
  {
    id: 'hud',
    label: 'HUD & Minimap',
    slugs: ['journeymap', 'xaeros-minimap', 'appleskin', 'roughly-enough-items'],
  },
  {
    id: 'gameplay',
    label: 'Gameplay & QoL',
    slugs: ['waystones', 'inventory-profiles-next', 'mouse-tweaks'],
  },
];
