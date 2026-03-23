import React, { useEffect, useState } from 'react';

interface Props {
  instanceId: string;
  refreshKey: number;
}

export function InstalledModsPanel({ instanceId, refreshKey }: Props) {
  const [mods, setMods] = useState<InstalledModInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceId) return;
    setLoading(true);
    window.launcher.mods.list(instanceId).then((m) => {
      setMods(m);
      setLoading(false);
    });
  }, [instanceId, refreshKey]);

  const handleRemove = async (mod: InstalledModInfo) => {
    if (!window.confirm('Remove "' + mod.name + '"?')) return;
    setRemovingId(mod.id);
    await window.launcher.mods.remove(instanceId, mod.id);
    setMods((prev) => prev.filter((m) => m.id !== mod.id));
    setRemovingId(null);
  };

  return (
    <div className="installed-mods">
      <h3 className="installed-mods__title">Installed Mods</h3>

      {loading ? (
        <p className="installed-mods__empty">Loading...</p>
      ) : mods.length === 0 ? (
        <p className="installed-mods__empty">No mods installed for this instance.</p>
      ) : (
        <ul className="installed-mods__list">
          {mods.map((mod) => (
            <li key={mod.id} className="installed-mod-row">
              <div className="installed-mod-row__info">
                <span className="installed-mod-row__name">{mod.name}</span>
                <span className="installed-mod-row__version">{mod.versionNumber}</span>
              </div>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => handleRemove(mod)}
                disabled={removingId === mod.id}
              >
                {removingId === mod.id ? 'Removing...' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
