import React, { useEffect, useState } from 'react';
import { VersionPickerModal } from './VersionPickerModal';
import { InstalledModsPanel } from './InstalledModsPanel';

interface ModCardProps {
  mod: ModSearchHit;
  installing: boolean;
  onInstall: () => void;
}

function ModCard({ mod, installing, onInstall }: ModCardProps) {
  return (
    <div className="mod-card">
      {mod.icon_url && <img className="mod-card__icon" src={mod.icon_url} alt="" />}
      <div className="mod-card__info">
        <span className="mod-card__name">{mod.title}</span>
        <span className="mod-card__desc">{mod.description}</span>
        <span className="mod-card__downloads">{mod.downloads.toLocaleString()} downloads</span>
      </div>
      <button
        className="btn btn--primary btn--sm mod-card__install"
        onClick={onInstall}
        disabled={installing}
      >
        {installing ? 'Installing...' : 'Install'}
      </button>
    </div>
  );
}

export function ModsTab() {
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [versionPickerMod, setVersionPickerMod] = useState<ModSearchHit | null>(null);
  const [installedRefreshKey, setInstalledRefreshKey] = useState(0);

  useEffect(() => {
    window.launcher.instances.list().then((list) => {
      setInstances(list);
      if (list.length > 0) {
        setSelectedInstanceId(list[0].id);
      }
    });
  }, []);

  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) ?? null;
  const isVanilla = !selectedInstance || !selectedInstance.modLoader || selectedInstance.modLoader === 'vanilla';

  const handleSearch = async () => {
    if (!selectedInstanceId) {
      setSearchError('Select an instance first.');
      return;
    }
    setSearchError(null);
    setSearching(true);
    try {
      const response = await window.launcher.mods.search(query, selectedInstanceId);
      setResults(response.hits);
    } catch (err: any) {
      setSearchError(err.message ?? 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mods">
      <div className="mods__header">
        <h2>Mods</h2>
      </div>

      <div className="mods__controls">
        <select
          className="mods__instance-select"
          value={selectedInstanceId}
          onChange={(e) => {
            setSelectedInstanceId(e.target.value);
            setResults([]);
            setInstalledRefreshKey((k) => k + 1);
          }}
        >
          <option value="">— Select an instance —</option>
          {instances.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.versionId})</option>
          ))}
        </select>

        <form className="mods__search-form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Modrinth..."
            disabled={!selectedInstanceId || isVanilla}
          />
          <button type="submit" className="btn btn--primary" disabled={!selectedInstanceId || isVanilla || searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {searchError && <p className="mods__error">{searchError}</p>}

      {!selectedInstanceId && (
        <div className="mods__empty">
          <p>Select an instance to browse mods.</p>
        </div>
      )}

      {selectedInstanceId && isVanilla && (
        <div className="mods__empty">
          <p>Mods require a mod loader.</p>
          <p className="form-group__hint" style={{ marginTop: '8px' }}>
            This instance uses vanilla Minecraft, which cannot load mods.<br />
            Edit the instance and switch the Mod Loader to <strong>Fabric</strong> to enable mod support.
          </p>
        </div>
      )}

      {!isVanilla && results.length > 0 && (
        <div className="mods__results">
          {results.map((hit) => (
            <ModCard
              key={hit.slug}
              mod={hit}
              installing={installingId === hit.slug}
              onInstall={() => setVersionPickerMod(hit)}
            />
          ))}
        </div>
      )}

      {versionPickerMod && selectedInstanceId && (
        <VersionPickerModal
          mod={versionPickerMod}
          instanceId={selectedInstanceId}
          instances={instances}
          onClose={() => setVersionPickerMod(null)}
          onInstalled={() => {
            setVersionPickerMod(null);
            setInstalledRefreshKey((k) => k + 1);
          }}
        />
      )}

      {selectedInstanceId && !isVanilla && (
        <InstalledModsPanel
          instanceId={selectedInstanceId}
          refreshKey={installedRefreshKey}
        />
      )}
    </div>
  );
}
