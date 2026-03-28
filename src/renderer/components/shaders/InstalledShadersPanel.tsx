import React, { useEffect, useState } from 'react';

interface Props {
  instanceId: string;
  refreshKey: number;
}

export function InstalledShadersPanel({ instanceId, refreshKey }: Props) {
  const [shaders, setShaders] = useState<ShaderInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instanceId) return;
    setLoading(true);
    window.launcher.shaders.list(instanceId).then((s) => {
      setShaders(s);
      setLoading(false);
    });
  }, [instanceId, refreshKey]);

  const handleRemove = async (fileName: string) => {
    if (!window.confirm('Remove "' + fileName + '"?')) return;
    await window.launcher.shaders.remove(instanceId, fileName);
    setShaders((prev) => prev.filter((s) => s.fileName !== fileName));
  };

  return (
    <div className="installed-mods">
      <h3 className="installed-mods__title">Installed Shader Packs</h3>

      {loading ? (
        <p className="installed-mods__empty">Loading...</p>
      ) : shaders.length === 0 ? (
        <p className="installed-mods__empty">No shader packs installed.</p>
      ) : (
        <ul className="installed-mods__list">
          {shaders.map((s) => (
            <li key={s.fileName} className="installed-mod-row">
              <div className="installed-mod-row__info">
                <span className="installed-mod-row__name">{s.fileName}</span>
                <span className="installed-mod-row__version">
                  {(s.fileSize / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => handleRemove(s.fileName)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
