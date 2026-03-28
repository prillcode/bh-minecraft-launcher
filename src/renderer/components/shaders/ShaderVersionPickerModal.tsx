import React, { useEffect, useRef, useState } from 'react';

interface Props {
  shader: ModSearchHit;
  instanceId: string;
  instances: InstanceInfo[];
  onClose: () => void;
  onInstalled: (shader: ShaderInfo) => void;
}

export function ShaderVersionPickerModal({ shader, instanceId, instances, onClose, onInstalled }: Props) {
  const [versions, setVersions] = useState<ModVersionInfo[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instance = instances.find((i) => i.id === instanceId);
    if (!instance) {
      setLoading(false);
      return;
    }

    window.launcher.mods
      .getVersions(shader.slug, instance.versionId, undefined)
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
  }, [shader.slug, instanceId, instances]);

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
    if (!selectedVersionId) return;
    setInstalling(true);
    setDownloadPercent(0);
    setError(null);

    const unsub = window.launcher.shaders.onDownloadProgress(({ percent }) => {
      setDownloadPercent(percent);
    });

    try {
      const result = await window.launcher.shaders.installModrinth(instanceId, selectedVersionId, shader.title);
      onInstalled(result);
    } catch (err: any) {
      setError(err.message ?? 'Install failed.');
      setInstalling(false);
    } finally {
      unsub();
    }
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <span className="modal__title">Install {shader.title}</span>
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
              <label htmlFor="sv-version">Version</label>
              <select
                id="sv-version"
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                disabled={installing}
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

            {installing && downloadPercent > 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Downloading… {downloadPercent}%
              </p>
            )}

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
