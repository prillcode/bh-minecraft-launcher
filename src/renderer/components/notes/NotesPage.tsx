import React, { useEffect, useRef, useState } from 'react';
import { useSelectedInstance } from '../../stores/selected-instance-context';

function timeAgo(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotesPage() {
  const { selectedInstanceId } = useSelectedInstance();
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editScreenshots, setEditScreenshots] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerScreenshots, setPickerScreenshots] = useState<ScreenshotInfo[]>([]);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  // Reload notes when instance changes
  useEffect(() => {
    if (!selectedInstanceId) {
      setNotes([]);
      setActiveNoteId(null);
      return;
    }
    window.launcher.notes.list(selectedInstanceId).then((list) => {
      setNotes(list);
      setActiveNoteId(null);
    });
  }, [selectedInstanceId]);

  // Sync editor when active note changes
  useEffect(() => {
    if (!activeNote) {
      setEditTitle('');
      setEditText('');
      setEditScreenshots([]);
      return;
    }
    setEditTitle(activeNote.title);
    setEditText(activeNote.text);
    setEditScreenshots(activeNote.screenshotPaths);
  }, [activeNoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleAutoSave = (title: string, text: string, screenshotPaths: string[]) => {
    if (!activeNoteId || !selectedInstanceId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const updated = await window.launcher.notes.update(selectedInstanceId, activeNoteId, {
        title,
        text,
        screenshotPaths,
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)).sort((a, b) => b.updatedAt - a.updatedAt),
      );
    }, 500);
  };

  const handleTitleChange = (value: string) => {
    setEditTitle(value);
    scheduleAutoSave(value, editText, editScreenshots);
  };

  const handleTextChange = (value: string) => {
    setEditText(value);
    scheduleAutoSave(editTitle, value, editScreenshots);
  };

  const handleNewNote = async () => {
    if (!selectedInstanceId) return;
    const note = await window.launcher.notes.create(selectedInstanceId, {
      title: 'New Note',
      text: '',
      screenshotPaths: [],
    });
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
  };

  const handleDeleteNote = async () => {
    if (!activeNoteId || !selectedInstanceId) return;
    await window.launcher.notes.delete(selectedInstanceId, activeNoteId);
    const remaining = notes.filter((n) => n.id !== activeNoteId);
    setNotes(remaining);
    setActiveNoteId(remaining[0]?.id ?? null);
  };

  const handleOpenPicker = async () => {
    if (!selectedInstanceId) return;
    const shots = await window.launcher.notes.listScreenshots(selectedInstanceId);
    setPickerScreenshots(shots);
    setPickerSelected(new Set(editScreenshots));
    setShowPicker(true);
  };

  const handlePickerConfirm = () => {
    const paths = Array.from(pickerSelected);
    setEditScreenshots(paths);
    scheduleAutoSave(editTitle, editText, paths);
    setShowPicker(false);
  };

  const handleRemoveScreenshot = (filePath: string) => {
    const paths = editScreenshots.filter((p) => p !== filePath);
    setEditScreenshots(paths);
    scheduleAutoSave(editTitle, editText, paths);
  };

  return (
    <div className="notes">
      {/* Left pane — note list */}
      <div className="notes__list">
        <div className="notes__list-header">
          <button
            className="btn btn--primary btn--sm"
            style={{ width: '100%' }}
            onClick={handleNewNote}
            disabled={!selectedInstanceId}
          >
            + New Note
          </button>
        </div>

        <div className="notes__list-items">
          {!selectedInstanceId && (
            <p className="notes__list-empty">Select an instance to manage notes.</p>
          )}
          {selectedInstanceId && notes.length === 0 && (
            <p className="notes__list-empty">No notes yet. Click New Note to start.</p>
          )}
          {notes.map((note) => (
            <button
              key={note.id}
              className={`note-item${note.id === activeNoteId ? ' note-item--active' : ''}`}
              onClick={() => setActiveNoteId(note.id)}
            >
              <div className="note-item__title">{note.title}</div>
              <div className="note-item__meta">{timeAgo(note.updatedAt)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right pane — editor */}
      <div className="notes__editor">
        {!activeNote ? (
          <div className="notes__empty">
            {!selectedInstanceId
              ? 'Select an instance to manage notes.'
              : 'Select a note or create a new one.'}
          </div>
        ) : (
          <>
            <div className="notes__editor-header">
              <input
                className="notes__title-input"
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title"
              />
              <button className="btn btn--danger btn--sm" onClick={handleDeleteNote}>
                Delete
              </button>
            </div>

            <div className="notes__body">
              <textarea
                className="notes__textarea"
                value={editText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Write your notes here — waypoints, coords, base locations, tips..."
              />

              <div className="notes__screenshots-section">
                <span className="notes__screenshots-label">Screenshots</span>
                <div className="notes__screenshots">
                  {editScreenshots.map((filePath) => (
                    <div key={filePath} className="notes__thumb-wrap">
                      <img
                        className="notes__thumb"
                        src={`launcher-file://${filePath}`}
                        alt=""
                        onClick={() => setLightboxSrc(`launcher-file://${filePath}`)}
                      />
                      <button
                        className="notes__thumb-remove"
                        onClick={() => handleRemoveScreenshot(filePath)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button className="btn btn--ghost btn--sm" onClick={handleOpenPicker}>
                  Browse Screenshots
                </button>
              </div>
            </div>

            {/* Screenshot picker overlay */}
            {showPicker && (
              <div
                className="screenshot-picker"
                onClick={(e) => { if (e.target === e.currentTarget) setShowPicker(false); }}
              >
                <div className="screenshot-picker__inner">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Select Screenshots</span>
                  {pickerScreenshots.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      No screenshots found. Press F2 in-game to take one.
                    </p>
                  ) : (
                    <div className="screenshot-picker__grid">
                      {pickerScreenshots.map((s) => (
                        <div
                          key={s.filePath}
                          className={`screenshot-picker__item${pickerSelected.has(s.filePath) ? ' screenshot-picker__item--selected' : ''}`}
                          onClick={() =>
                            setPickerSelected((prev) => {
                              const next = new Set(prev);
                              next.has(s.filePath) ? next.delete(s.filePath) : next.add(s.filePath);
                              return next;
                            })
                          }
                        >
                          <img src={`launcher-file://${s.filePath}`} alt={s.fileName} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => setShowPicker(false)}>
                      Cancel
                    </button>
                    <button className="btn btn--primary btn--sm" onClick={handlePickerConfirm}>
                      Add Selected
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="lightbox" onClick={() => setLightboxSrc(null)}>
          <img className="lightbox__img" src={lightboxSrc} alt="Screenshot" />
        </div>
      )}
    </div>
  );
}
