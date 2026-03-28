import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (instance: InstanceInfo) => void;
}

export function CreateInstanceModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [instanceType, setInstanceType] = useState<'server' | 'singleplayer'>('server');
  const [versionId, setVersionId] = useState('');
  const [modLoader, setModLoader] = useState<'vanilla' | 'fabric' | 'quilt'>('vanilla');
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('25565');
  const [versions, setVersions] = useState<Array<{ id: string; releaseTime: string }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.launcher.game.getVersions().then(({ latest, versions: all }) => {
      const releases = all.filter((v) => v.type === 'release');
      setVersions(releases);
      setVersionId(latest.release);
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
    setCreating(true);
    setError(null);
    try {
      const config: InstanceConfig = {
        name: name.trim(),
        type: instanceType,
        versionId,
        modLoader,
        ...(instanceType === 'server' && serverHost.trim()
          ? { serverAutoConnect: { host: serverHost.trim(), port: parseInt(serverPort, 10) || 25565 } }
          : {}),
      };
      const instance = await window.launcher.instances.create(config);
      onCreate(instance);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create instance.');
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <span className="modal__title">New Instance</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ci-type">Instance Type</label>
            <select
              id="ci-type"
              value={instanceType}
              onChange={(e) => setInstanceType(e.target.value as 'server' | 'singleplayer')}
            >
              <option value="server">Server</option>
              <option value="singleplayer">Singleplayer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ci-name">Instance Name</label>
            <input
              id="ci-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Instance"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="ci-version">Version</label>
            <select
              id="ci-version"
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
            <label htmlFor="ci-mod-loader">Mod Loader</label>
            <select
              id="ci-mod-loader"
              value={modLoader}
              onChange={(e) => setModLoader(e.target.value as 'vanilla' | 'fabric' | 'quilt')}
            >
              <option value="vanilla">None (Vanilla)</option>
              <option value="fabric">Fabric</option>
              <option value="quilt">Quilt</option>
            </select>
          </div>

          {instanceType === 'server' && (
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
              <p className="form-group__hint">Leave host empty to skip auto-connect.</p>
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={creating || loadingVersions}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
