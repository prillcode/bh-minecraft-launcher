import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedInstance } from '../../stores/selected-instance-context';
import { ShaderVersionPickerModal } from './ShaderVersionPickerModal';
import { InstalledShadersPanel } from './InstalledShadersPanel';
import { POPULAR_SHADER_SLUGS } from '../../data/popular-shaders';

interface ShaderCardProps {
  shader: ModSearchHit;
  onInstall: () => void;
}

function ShaderCard({ shader, onInstall }: ShaderCardProps) {
  return (
    <div className="mod-card">
      {shader.icon_url && <img className="mod-card__icon" src={shader.icon_url} alt="" />}
      <div className="mod-card__info">
        <span className="mod-card__name">{shader.title}</span>
        <span className="mod-card__desc">{shader.description}</span>
        <span className="mod-card__downloads">{shader.downloads.toLocaleString()} downloads</span>
      </div>
      <button className="btn btn--primary btn--sm mod-card__install" onClick={onInstall}>
        Install
      </button>
    </div>
  );
}

export function ShadersTab() {
  const { selectedInstanceId } = useSelectedInstance();
  const navigate = useNavigate();
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [shaderPickerMod, setShaderPickerMod] = useState<ModSearchHit | null>(null);
  const [installedRefreshKey, setInstalledRefreshKey] = useState(0);
  const [localInstalling, setLocalInstalling] = useState(false);
  const [popularShaders, setPopularShaders] = useState<ModSearchHit[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  useEffect(() => {
    window.launcher.instances.list().then(setInstances);
  }, []);

  useEffect(() => {
    setResults([]);
    setInstalledRefreshKey((k) => k + 1);
  }, [selectedInstanceId]);

  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) ?? null;
  const isSupported =
    selectedInstance?.modLoader === 'fabric' || selectedInstance?.modLoader === 'quilt';

  useEffect(() => {
    if (!selectedInstanceId || !isSupported) {
      setPopularShaders([]);
      return;
    }
    setPopularLoading(true);
    window.launcher.mods.getProjects(POPULAR_SHADER_SLUGS)
      .then(setPopularShaders)
      .catch(() => setPopularShaders([]))
      .finally(() => setPopularLoading(false));
  }, [selectedInstanceId, isSupported]);

  const handleSearch = async () => {
    if (!selectedInstanceId) {
      setSearchError('Select an instance first.');
      return;
    }
    setSearchError(null);
    setSearching(true);
    try {
      const response = await window.launcher.shaders.search(query, selectedInstanceId);
      setResults(response.hits);
    } catch (err: any) {
      setSearchError(err.message ?? 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!selectedInstanceId || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(handleSearch, 350);
    return () => clearTimeout(timer);
  }, [query, selectedInstanceId]);

  const handleInstallLocal = async () => {
    if (!selectedInstanceId) return;
    setLocalInstalling(true);
    try {
      const result = await window.launcher.shaders.installLocal(selectedInstanceId);
      if (result) {
        setInstalledRefreshKey((k) => k + 1);
      }
    } finally {
      setLocalInstalling(false);
    }
  };

  return (
    <div className="mods">
      <div className="mods__header">
        <h2>Shaders</h2>
      </div>

      <div className="mods__instance-header">
        {selectedInstance ? (
          <>
            <span className="mods__instance-label">
              Instance: <strong>{selectedInstance.name}</strong> ({selectedInstance.versionId})
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/instances')}>
              ← Change
            </button>
          </>
        ) : (
          <>
            <span className="mods__instance-label mods__instance-label--none">No instance selected</span>
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/instances')}>
              ← Select Instance
            </button>
          </>
        )}
      </div>

      <div className="mods__controls">
        <form className="mods__search-form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Modrinth shaders..."
            disabled={!selectedInstanceId || !isSupported}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!selectedInstanceId || !isSupported || searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <button
          className="btn btn--ghost"
          onClick={handleInstallLocal}
          disabled={!selectedInstanceId || !isSupported || localInstalling}
        >
          {localInstalling ? 'Installing...' : 'Install from file'}
        </button>
      </div>

      {searchError && <p className="mods__error">{searchError}</p>}

      {!selectedInstanceId && (
        <div className="mods__empty">
          <p>Select an instance to manage shader packs.</p>
        </div>
      )}

      {selectedInstanceId && !isSupported && (
        <div className="mods__empty">
          <p>Shader packs require a mod loader that supports Iris (Fabric or Quilt).</p>
          <p className="form-group__hint" style={{ marginTop: '8px' }}>
            Edit the instance and switch the Mod Loader to <strong>Fabric</strong> to enable shader support.
          </p>
        </div>
      )}

      {isSupported && query.length === 0 && results.length === 0 && (
        <div className="mods__section">
          <h3 className="mods__section-title">Popular Shaders</h3>
          {popularLoading ? (
            <p className="mods__empty">Loading popular shaders…</p>
          ) : (
            <div className="mods__results">
              {popularShaders.map((hit) => (
                <ShaderCard
                  key={hit.slug}
                  shader={hit}
                  onInstall={() => setShaderPickerMod(hit)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isSupported && results.length > 0 && (
        <div className="mods__results">
          {results.map((hit) => (
            <ShaderCard
              key={hit.slug}
              shader={hit}
              onInstall={() => setShaderPickerMod(hit)}
            />
          ))}
        </div>
      )}

      {shaderPickerMod && selectedInstanceId && (
        <ShaderVersionPickerModal
          shader={shaderPickerMod}
          instanceId={selectedInstanceId}
          instances={instances}
          onClose={() => setShaderPickerMod(null)}
          onInstalled={() => {
            setShaderPickerMod(null);
            setInstalledRefreshKey((k) => k + 1);
            setQuery('');
            setResults([]);
          }}
        />
      )}

      {isSupported && selectedInstanceId && (
        <InstalledShadersPanel
          instanceId={selectedInstanceId}
          refreshKey={installedRefreshKey}
        />
      )}
    </div>
  );
}
