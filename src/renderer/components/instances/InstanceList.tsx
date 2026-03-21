import React, { useEffect, useState } from 'react';

interface Instance {
  id: string;
  name: string;
  versionId: string;
  modLoader?: string;
  lastPlayed?: number;
}

export function InstanceList() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [launching, setLaunching] = useState<string | null>(null);

  useEffect(() => {
    window.launcher.instances.list().then(setInstances);
  }, []);

  const handleLaunch = async (instanceId: string) => {
    setLaunching(instanceId);
    try {
      await window.launcher.game.launch(instanceId);
    } catch (err: any) {
      alert(`Launch failed: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="instances">
      <div className="instances__header">
        <h2>Instances</h2>
        <button className="btn btn--primary" onClick={() => {/* TODO: open create modal */}}>
          + New Instance
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="instances__empty">
          <p>No instances yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="instances__grid">
          {instances.map((inst) => (
            <div key={inst.id} className="instance-card">
              <div className="instance-card__icon">🌍</div>
              <div className="instance-card__info">
                <h3>{inst.name}</h3>
                <span className="instance-card__version">
                  {inst.versionId}
                  {inst.modLoader && inst.modLoader !== 'vanilla' && ` · ${inst.modLoader}`}
                </span>
                {inst.lastPlayed && (
                  <span className="instance-card__last-played">
                    Last played {new Date(inst.lastPlayed).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                className="instance-card__play"
                onClick={() => handleLaunch(inst.id)}
                disabled={launching !== null}
              >
                {launching === inst.id ? '⏳' : '▶'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
