import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedInstance } from '../../stores/selected-instance-context';
import { VersionPickerModal } from './VersionPickerModal';
import { InstalledModsPanel } from './InstalledModsPanel';
import { MOD_CATEGORIES } from '../../data/mod-categories';

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
  const { selectedInstanceId } = useSelectedInstance();
  const navigate = useNavigate();
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [versionPickerMod, setVersionPickerMod] = useState<ModSearchHit | null>(null);
  const [installedRefreshKey, setInstalledRefreshKey] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.launcher.instances.list().then(setInstances);
  }, []);

  useEffect(() => {
    setResults([]);
    setInstalledRefreshKey((k) => k + 1);
  }, [selectedInstanceId]);

  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) ?? null;
  const isVanilla = !selectedInstance || !selectedInstance.modLoader || selectedInstance.modLoader === 'vanilla';

  const handleCategoryClick = async (categoryId: string) => {
    if (!selectedInstanceId || isVanilla) return;

    if (activeCategoryId === categoryId) {
      setActiveCategoryId(null);
      setResults([]);
      return;
    }

    setActiveCategoryId(categoryId);
    setQuery('');
    setCategoryLoading(true);
    try {
      const category = MOD_CATEGORIES.find(c => c.id === categoryId)!;
      const projects = await window.launcher.mods.getProjects(category.slugs);
      setResults(projects);
    } catch {
      setResults([]);
    } finally {
      setCategoryLoading(false);
    }
  };

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

  useEffect(() => {
    if (query.length > 0) setActiveCategoryId(null);
    if (!selectedInstanceId || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(handleSearch, 350);
    return () => clearTimeout(timer);
  }, [query, selectedInstanceId]);

  return (
    <div className="mods">
      <div className="mods__header">
        <h2>Mods</h2>
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

      {selectedInstanceId && !isVanilla && (
        <div className="category-chips">
          <button
            className={`category-chip ${activeCategoryId === null ? 'category-chip--active' : ''}`}
            onClick={() => {
              setActiveCategoryId(null);
              setResults([]);
              searchInputRef.current?.focus();
            }}
            disabled={categoryLoading}
          >
            Search All
          </button>
          {MOD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${activeCategoryId === cat.id ? 'category-chip--active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
              disabled={categoryLoading}
            >
              {categoryLoading && activeCategoryId === cat.id ? 'Loading…' : cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="mods__controls">
        <form className="mods__search-form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <input
            ref={searchInputRef}
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
            setQuery('');
            setResults([]);
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
