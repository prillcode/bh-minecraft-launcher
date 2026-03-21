import { useState, useEffect } from 'react';

type LaunchState = 'idle' | 'checking' | 'downloading' | 'launching' | 'running';

interface DownloadProgress {
  phase: string;
  current: number;
  total: number;
  fileName: string;
}

export function PlayButton({ instanceId }: { instanceId: string | null }) {
  const [state, setState] = useState<LaunchState>('idle');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    window.launcher.on('download:progress', (data: unknown) => {
      setProgress(data as DownloadProgress);
    });
    window.launcher.on('launch:exit', () => {
      setState('idle');
      setProgress(null);
    });

    return () => {
      window.launcher.removeAllListeners('download:progress');
      window.launcher.removeAllListeners('launch:exit');
    };
  }, []);

  const handlePlay = async () => {
    if (!instanceId) return;
    try {
      setState('launching');
      await window.launcher.game.launch(instanceId);
      setState('running');
    } catch (err) {
      console.error('Launch failed:', err);
      setState('idle');
    }
  };

  const handleKill = async () => {
    await window.launcher.game.kill();
    setState('idle');
  };

  const labels: Record<LaunchState, string> = {
    idle: 'PLAY',
    checking: 'Checking files...',
    downloading: progress
      ? `${progress.phase} ${progress.current}/${progress.total}`
      : 'Downloading...',
    launching: 'Launching...',
    running: 'RUNNING — Click to Kill',
  };

  return (
    <button
      className="play-button"
      data-state={state}
      onClick={state === 'running' ? handleKill : handlePlay}
      disabled={!instanceId || state === 'checking' || state === 'downloading' || state === 'launching'}
    >
      {labels[state]}
    </button>
  );
}
