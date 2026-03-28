import React, { useEffect, useState } from 'react';
import { CreateInstanceModal } from './CreateInstanceModal';
import { EditInstanceModal } from './EditInstanceModal';
import { useSelectedInstance } from '../../stores/selected-instance-context';

export function InstanceList() {
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [pingResults, setPingResults] = useState<Record<string, ServerPingResult>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<InstanceInfo | null>(null);
  const { selectedInstanceId, setSelectedInstanceId } = useSelectedInstance();

  useEffect(() => {
    window.launcher.instances.list().then((list) => {
      setInstances(list);
      if (list.length > 0) {
        const stillExists = list.some((i) => i.id === selectedInstanceId);
        if (!stillExists) {
          setSelectedInstanceId(list[0].id);
        }
      }
      // Ping servers for server instances that have a default server set
      for (const inst of list) {
        if (inst.type !== 'singleplayer' && inst.serverAutoConnect) {
          const { host, port } = inst.serverAutoConnect;
          window.launcher.servers.ping(host, port)
            .then((result) => setPingResults((prev) => ({ ...prev, [inst.id]: result })))
            .catch(() => { /* server offline or unreachable — keep globe icon */ });
        }
      }
    });
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await window.launcher.instances.delete(id);
    setInstances((prev) => {
      const remaining = prev.filter((i) => i.id !== id);
      if (selectedInstanceId === id) {
        setSelectedInstanceId(remaining.length > 0 ? remaining[0].id : '');
      }
      return remaining;
    });
  };

  const handleCreated = (instance: InstanceInfo) => {
    setInstances((prev) => [instance, ...prev]);
    if (instance.type !== 'singleplayer' && instance.serverAutoConnect) {
      const { host, port } = instance.serverAutoConnect;
      window.launcher.servers.ping(host, port)
        .then((result) => setPingResults((prev) => ({ ...prev, [instance.id]: result })))
        .catch(() => {});
    }
  };

  const handleUpdated = (updated: InstanceInfo) => {
    setInstances((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    if (updated.type !== 'singleplayer' && updated.serverAutoConnect) {
      const { host, port } = updated.serverAutoConnect;
      window.launcher.servers.ping(host, port)
        .then((result) => setPingResults((prev) => ({ ...prev, [updated.id]: result })))
        .catch(() => setPingResults((prev) => { const next = { ...prev }; delete next[updated.id]; return next; }));
    } else {
      setPingResults((prev) => { const next = { ...prev }; delete next[updated.id]; return next; });
    }
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
              className={`instance-card${selectedInstanceId === inst.id ? ' instance-card--selected' : ''}`}
              onClick={() => setSelectedInstanceId(inst.id)}
            >
              <div className="instance-card__icon">
                {inst.type === 'singleplayer'
                  ? '🌳'
                  : pingResults[inst.id]?.favicon
                    ? <img src={pingResults[inst.id].favicon!} alt="" className="instance-card__server-icon" />
                    : '🌍'}
              </div>
              <div className="instance-card__info">
                <h3>{inst.name}</h3>
                <span className="instance-card__version">
                  {inst.versionId}
                  {inst.modLoader && inst.modLoader !== 'vanilla' && ` · ${inst.modLoader}`}
                </span>
                {inst.type === 'singleplayer' ? (
                  <>
                    <span className="instance-card__server">Singleplayer</span>
                    <span className="instance-card__motd">{inst.gameDirectory}</span>
                  </>
                ) : (
                  <>
                    {inst.serverAutoConnect && (
                      <span className="instance-card__server">
                        Multiplayer — {inst.serverAutoConnect.host}:{inst.serverAutoConnect.port}
                      </span>
                    )}
                    {pingResults[inst.id]?.motd && (
                      <span className="instance-card__motd">{pingResults[inst.id].motd}</span>
                    )}
                  </>
                )}
                {inst.lastPlayed && (
                  <span className="instance-card__last-played">
                    Last played {new Date(inst.lastPlayed).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                className="instance-card__edit"
                onClick={(e) => { e.stopPropagation(); setEditingInstance(inst); }}
                aria-label={`Edit ${inst.name}`}
              >
                ⚙
              </button>
              <button
                className="instance-card__delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(inst.id, inst.name); }}
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
