import React, { useEffect, useRef, useState } from 'react';

interface Props {
  instance: InstanceInfo;
  onClose: () => void;
  onUpdate: (updated: InstanceInfo) => void;
}

export function EditInstanceModal({ instance, onClose, onUpdate }: Props) {
  const [name, setName] = useState(instance.name);
  const [instanceType, setInstanceType] = useState<'server' | 'singleplayer' | 'imported'>(
    instance.type === 'singleplayer' ? 'singleplayer'
    : instance.type === 'imported' ? 'imported'
    : 'server',
  );
  const [versionId, setVersionId] = useState(instance.versionId);
  const [modLoader, setModLoader] = useState<'vanilla' | 'fabric' | 'quilt'>(
    instance.modLoader === 'fabric' ? 'fabric' : instance.modLoader === 'quilt' ? 'quilt' : 'vanilla',
  );
  const [serverHost, setServerHost] = useState(instance.serverAutoConnect?.host ?? '');
  const [serverPort, setServerPort] = useState(String(instance.serverAutoConnect?.port ?? 25565));
  const [serverVersion, setServerVersion] = useState(instance.serverMinecraftVersion ?? '');
  const [versions, setVersions] = useState<Array<{ id: string; releaseTime: string }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.launcher.game.getVersions().then(({ versions: all }) => {
      setVersions(all.filter((v) => v.type === 'release'));
      setLoadingVersions(false);
    });
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Instance name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const config: Partial<InstanceConfig> = {
        name: name.trim(),
        type: instanceType,
        versionId,
        modLoader,
        ...(instanceType === 'server' && serverHost.trim()
          ? { serverAutoConnect: { host: serverHost.trim(), port: parseInt(serverPort, 10) || 25565 } }
          : { serverAutoConnect: undefined }),
        serverMinecraftVersion: instanceType === 'server' ? (serverVersion.trim() || undefined) : undefined,
      };
      if (instanceType === 'imported') {
        config.serverAutoConnect = undefined;
        config.serverMinecraftVersion = undefined;
      }
      const updated = await window.launcher.instances.update(instance.id, config);
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save changes.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <span className="modal__title">Edit Instance</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ei-type">Instance Type</label>
            <select
              id="ei-type"
              value={instanceType}
              onChange={(e) => setInstanceType(e.target.value as 'server' | 'singleplayer' | 'imported')}
            >
              <option value="server">Multiplayer (remote/local server)</option>
              <option value="singleplayer">New Singleplayer</option>
              <option value="imported">Existing Singleplayer (import from other launcher)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ei-name">Instance Name</label>
            <input
              id="ei-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Instance"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="ei-version">Version</label>
            <select
              id="ei-version"
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
              disabled={loadingVersions}
            >
              {loadingVersions ? (
                <option>Loading versions…</option>
              ) : (
                versions.map((v) => (
                  <option key={v.id} value={v.id}>{v.id}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ei-mod-loader">Mod Loader</label>
            <select
              id="ei-mod-loader"
              value={modLoader}
              onChange={(e) => setModLoader(e.target.value as 'vanilla' | 'fabric' | 'quilt')}
            >
              <option value="vanilla">None (Vanilla)</option>
              <option value="fabric">Fabric</option>
              <option value="quilt">Quilt</option>
            </select>
          </div>

          {instanceType === 'imported' && (
            <div className="form-group">
              <label>Game Directory</label>
              <input
                type="text"
                value={instance.gameDirectory}
                readOnly
                style={{ opacity: 0.7, cursor: 'default' }}
              />
              <p className="form-group__hint">
                Directory cannot be changed after import. Delete and re-import to use a different folder.
              </p>
            </div>
          )}

          {instanceType === 'server' && (
            <>
              <div className="form-group">
                <label>Auto-connect to server <span className="form-group__hint" style={{ display: 'inline' }}>(optional)</span></label>
                <div className="form-row">
                  <input
                    type="text"
                    value={serverHost}
                    onChange={(e) => setServerHost(e.target.value)}
                    placeholder="e.g. mc.example.com"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    placeholder="25565"
                    min={1}
                    max={65535}
                    style={{ flex: 1 }}
                  />
                </div>
                <p className="form-group__hint">Leave host empty to remove auto-connect.</p>
              </div>

              <div className="form-group">
                <label htmlFor="ei-server-version">
                  Server Minecraft Version{' '}
                  <span className="form-group__hint" style={{ display: 'inline' }}>(optional)</span>
                </label>
                <input
                  id="ei-server-version"
                  type="text"
                  value={serverVersion}
                  onChange={(e) => setServerVersion(e.target.value)}
                  placeholder="e.g. 1.21.1"
                />
                <p className="form-group__hint">
                  If set, you'll be warned before launching when your instance version differs.
                </p>
              </div>
            </>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving || loadingVersions}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
