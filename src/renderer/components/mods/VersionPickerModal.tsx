import React, { useEffect, useRef, useState } from 'react';

interface Props {
  mod: ModSearchHit;
  instanceId: string;
  instances: InstanceInfo[];
  onClose: () => void;
  onInstalled: () => void;
}

export function VersionPickerModal({ mod, instanceId, instances, onClose, onInstalled }: Props) {
  const [versions, setVersions] = useState<ModVersionInfo[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instance = instances.find((i) => i.id === instanceId);
    if (!instance) {
      setLoading(false);
      return;
    }

    window.launcher.mods
      .getVersions(mod.slug, instance.versionId, instance.modLoader)
      .then((list) => {
        setVersions(list);
        if (list.length > 0) {
          setSelectedVersionId(list[0].id);
        }
      })
      .catch((err: any) => {
        setError(err.message ?? 'Failed to load versions.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mod.slug, instanceId, instances]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      await window.launcher.mods.install(instanceId, mod.slug, selectedVersionId, mod.title, mod.slug);
      onInstalled();
    } catch (err: any) {
      setError(err.message ?? 'Install failed.');
      setInstalling(false);
    }
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <span className="modal__title">Install {mod.title}</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading ? (
          <p style={{ padding: '16px' }}>Loading versions...</p>
        ) : versions.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--text-muted)' }}>
            No compatible versions found for this Minecraft version.
          </p>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="vp-version">Version</label>
              <select
                id="vp-version"
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.version_number}) — {v.game_versions.join(', ')}
                  </option>
                ))}
              </select>
            </div>

            {selectedVersionId && (() => {
              const v = versions.find((v) => v.id === selectedVersionId);
              const file = v?.files.find((f) => f.primary) ?? v?.files[0];
              return file ? (
                <p className="form-group__hint">
                  {file.filename} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              ) : null;
            })()}

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={onClose} disabled={installing}>
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={handleInstall}
                disabled={installing || !selectedVersionId}
              >
                {installing ? 'Installing...' : 'Install'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
