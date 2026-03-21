import React, { useEffect, useState } from 'react';

interface DownloadStatus {
  phase: string;
  current: number;
  total: number;
  fileName: string;
}

export function StatusBar() {
  const [download, setDownload] = useState<DownloadStatus | null>(null);
  const [gameRunning, setGameRunning] = useState(false);

  useEffect(() => {
    window.launcher.on('download:progress', (progress: unknown) => {
      setDownload(progress as DownloadStatus);
    });

    window.launcher.on('launch:exit', () => {
      setGameRunning(false);
    });

    return () => {
      window.launcher.removeAllListeners('download:progress');
      window.launcher.removeAllListeners('launch:exit');
    };
  }, []);

  return (
    <footer className="status-bar">
      {download && download.current < download.total ? (
        <div className="status-bar__download">
          <span className="status-bar__phase">{download.phase}</span>
          <div className="status-bar__progress-track">
            <div
              className="status-bar__progress-fill"
              style={{ width: `${(download.current / download.total) * 100}%` }}
            />
          </div>
          <span className="status-bar__count">
            {download.current}/{download.total}
          </span>
        </div>
      ) : gameRunning ? (
        <span className="status-bar__running">● Minecraft is running</span>
      ) : (
        <span className="status-bar__ready">Ready</span>
      )}
    </footer>
  );
}
