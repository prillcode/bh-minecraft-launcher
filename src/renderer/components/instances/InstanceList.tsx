import React, { useEffect, useState } from 'react';
import { CreateInstanceModal } from './CreateInstanceModal';
import { EditInstanceModal } from './EditInstanceModal';

export function InstanceList() {
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [launching, setLaunching] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<InstanceInfo | null>(null);

  useEffect(() => {
    window.launcher.instances.list().then(async (list) => {
      if (list.length === 0) {
        try {
          const instance = await window.launcher.instances.createBlockhaven();
          setInstances([instance]);
        } catch {
          setInstances([]);
        }
      } else {
        setInstances(list);
      }
    });
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await window.launcher.instances.delete(id);
    setInstances((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCreated = (instance: InstanceInfo) => {
    setInstances((prev) => [instance, ...prev]);
  };

  const handleUpdated = (updated: InstanceInfo) => {
    setInstances((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  return (
    <div className="instances">
      <div className="instances__header">
        <h2>Instances</h2>
        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
          + New Instance
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="instances__empty">
          <p>No instances yet.</p>
          <button className="btn btn--primary" style={{ marginTop: '16px' }} onClick={() => setShowCreateModal(true)}>
            Create your first instance
          </button>
        </div>
      ) : (
        <div className="instances__grid">
          {instances.map((inst) => (
            <div
              key={inst.id}
              className="instance-card"
              onClick={() => !launching && setEditingInstance(inst)}
              style={{ cursor: launching ? 'default' : 'pointer' }}
            >
              <div className="instance-card__icon">🌍</div>
              <div className="instance-card__info">
                <h3>{inst.name}</h3>
                <span className="instance-card__version">
                  {inst.versionId}
                  {inst.modLoader && inst.modLoader !== 'vanilla' && ` · ${inst.modLoader}`}
                </span>
                {inst.serverAutoConnect && (
                  <span className="instance-card__server">
                    {inst.serverAutoConnect.host}:{inst.serverAutoConnect.port}
                  </span>
                )}
                {inst.lastPlayed && (
                  <span className="instance-card__last-played">
                    Last played {new Date(inst.lastPlayed).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                className="instance-card__play"
                onClick={(e) => { e.stopPropagation(); handleLaunch(inst.id); }}
                disabled={launching !== null}
              >
                {launching === inst.id ? '⏳' : '▶'}
              </button>
              <button
                className="instance-card__delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(inst.id, inst.name); }}
                disabled={launching !== null}
                aria-label={`Delete ${inst.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateInstanceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreated}
        />
      )}

      {editingInstance && (
        <EditInstanceModal
          instance={editingInstance}
          onClose={() => setEditingInstance(null)}
          onUpdate={handleUpdated}
        />
      )}
    </div>
  );
}
