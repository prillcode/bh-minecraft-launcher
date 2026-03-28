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
  const [installingLabel, setInstallingLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  // null = not checked yet; [] = no deps needed; non-empty = deps awaiting confirmation
  const [pendingDeps, setPendingDeps] = useState<DependencyInfo[] | null>(null);
  const [depCheckLoading, setDepCheckLoading] = useState(false);

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

  // Reset dep check state whenever the user picks a different version
  useEffect(() => {
    setPendingDeps(null);
  }, [selectedVersionId]);

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

  const runInstall = async (deps: DependencyInfo[]) => {
    setInstalling(true);
    setError(null);
    try {
      // Install each required dependency sequentially
      for (const dep of deps) {
        setInstallingLabel(`Installing ${dep.title}…`);
        await window.launcher.mods.install(instanceId, dep.project_id, dep.versionId, dep.title, dep.slug);
      }
      // Install the originally selected mod
      setInstallingLabel(`Installing ${mod.title}…`);
      await window.launcher.mods.install(instanceId, mod.slug, selectedVersionId, mod.title, mod.slug);
      onInstalled();
    } catch (err: any) {
      setError(err.message ?? 'Install failed.');
      setInstalling(false);
      setInstallingLabel('');
    }
  };

  const handleInstall = async () => {
    setError(null);

    // Phase 1 — dep check (pendingDeps not yet resolved)
    if (pendingDeps === null) {
      setDepCheckLoading(true);
      try {
        const deps = await window.launcher.mods.getRequiredDeps(instanceId, selectedVersionId);
        setDepCheckLoading(false);
        if (deps.length === 0) {
          // No deps needed — proceed directly to install
          setPendingDeps([]);
          await runInstall([]);
        } else {
          // Show confirmation prompt
          setPendingDeps(deps);
        }
      } catch (err: any) {
        setDepCheckLoading(false);
        setPendingDeps(null); // reset so user can retry
        setError('Failed to check dependencies.');
      }
      return;
    }

    // Phase 2 — deps confirmed (pendingDeps is [] or user clicked "Install all")
    await runInstall(pendingDeps);
  };

  const isWorking = installing || depCheckLoading;
  const showDepPrompt = pendingDeps !== null && pendingDeps.length > 0;

  const installButtonLabel = (() => {
    if (depCheckLoading) return 'Checking…';
    if (installing) return installingLabel || 'Installing…';
    if (showDepPrompt) return `Install all (${pendingDeps.length + 1} mods)`;
    return 'Install';
  })();

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
            {showDepPrompt ? (
              <div className="form-group">
                <p style={{ marginBottom: '8px' }}>This mod requires:</p>
                <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
                  {pendingDeps.map((d) => (
                    <li key={d.project_id}>{d.title} ({d.versionNumber})</li>
                  ))}
                </ul>
                <p className="form-group__hint">These will be installed automatically.</p>
              </div>
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
              </>
            )}

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>
                {error}
              </p>
            )}

            {installing && installingLabel && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {installingLabel}
              </p>
            )}

            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={onClose} disabled={isWorking}>
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={handleInstall}
                disabled={isWorking || !selectedVersionId}
              >
                {installButtonLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
