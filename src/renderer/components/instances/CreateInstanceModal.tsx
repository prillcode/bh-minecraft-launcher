import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (instance: InstanceInfo) => void;
}

export function CreateInstanceModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [instanceType, setInstanceType] = useState<'server' | 'singleplayer' | 'imported'>('server');
  const [versionId, setVersionId] = useState('');
  const [modLoader, setModLoader] = useState<'vanilla' | 'fabric' | 'quilt'>('vanilla');
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('25565');
  const [importedDir, setImportedDir] = useState('');
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

  const handlePickDirectory = async () => {
    const selected = await window.launcher.instances.pickDirectory();
    if (selected === null) return;
    setImportedDir(selected);
    if (!name.trim()) {
      setName(selected.split('/').pop() ?? selected.split('\\').pop() ?? '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Instance name is required.');
      return;
    }
    if (instanceType === 'imported' && !importedDir) {
      setError('Please select a game directory.');
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
        ...(instanceType === 'imported' ? { gameDirectory: importedDir } : {}),
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
              onChange={(e) => setInstanceType(e.target.value as 'server' | 'singleplayer' | 'imported')}
            >
              <option value="server">Multiplayer (remote/local server)</option>
              <option value="singleplayer">New Singleplayer</option>
              <option value="imported">Existing Singleplayer (import from other launcher)</option>
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

          {instanceType === 'imported' && (
            <div className="form-group">
              <label>Game Directory</label>
              <button type="button" className="btn btn--ghost" onClick={handlePickDirectory}>
                Choose Folder
              </button>
              {importedDir ? (
                <p className="form-group__hint" style={{ wordBreak: 'break-all' }}>{importedDir}</p>
              ) : (
                <p className="form-group__hint">Select the game directory of your existing Minecraft install</p>
              )}
              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                  Or browse from a common location
                </summary>
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.8', maxHeight: '140px', overflowY: 'auto' }}>
                  {[
                    { group: 'Official Launcher (Mojang)', entries: [
                      { label: 'Windows', path: '%APPDATA%\\.minecraft', navigateTo: '%APPDATA%\\.minecraft' },
                      { label: 'macOS', path: '~/Library/Application Support/minecraft', navigateTo: '~/Library/Application Support/minecraft' },
                      { label: 'Linux', path: '~/.minecraft', navigateTo: '~/.minecraft' },
                      { label: 'Linux (Flatpak)', path: '~/.var/app/com.mojang.Minecraft/data/minecraft', navigateTo: '~/.var/app/com.mojang.Minecraft/data/minecraft' },
                    ]},
                    { group: 'Prism Launcher / MultiMC', entries: [
                      { label: 'Windows', path: '%APPDATA%\\PrismLauncher\\instances\\<name>\\.minecraft', navigateTo: '%APPDATA%\\PrismLauncher\\instances' },
                      { label: 'macOS', path: '~/Library/Application Support/PrismLauncher/instances/<name>/.minecraft', navigateTo: '~/Library/Application Support/PrismLauncher/instances' },
                      { label: 'Linux', path: '~/.local/share/PrismLauncher/instances/<name>/.minecraft', navigateTo: '~/.local/share/PrismLauncher/instances' },
                    ]},
                    { group: 'ATLauncher', entries: [
                      { label: 'Windows', path: '%APPDATA%\\ATLauncher\\instances\\<name>', navigateTo: '%APPDATA%\\ATLauncher\\instances' },
                      { label: 'macOS', path: '~/Library/Application Support/ATLauncher/instances/<name>', navigateTo: '~/Library/Application Support/ATLauncher/instances' },
                      { label: 'Linux', path: '~/.ATLauncher/instances/<name>', navigateTo: '~/.ATLauncher/instances' },
                    ]},
                  ].map(({ group, entries }) => (
                    <div key={group} style={{ marginBottom: '8px' }}>
                      <p style={{ fontWeight: 600, marginBottom: '2px' }}>{group}</p>
                      {entries.map(({ label, path, navigateTo }) => (
                        <code
                          key={label}
                          title="Click to open folder picker here"
                          style={{ display: 'block', cursor: 'pointer' }}
                          onClick={() => window.launcher.instances.pickDirectory(navigateTo).then((selected) => {
                            if (!selected) return;
                            setImportedDir(selected);
                            if (!name.trim()) setName(selected.split('/').pop() ?? selected.split('\\').pop() ?? '');
                          })}
                        >
                          {label}: {path}
                        </code>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
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
