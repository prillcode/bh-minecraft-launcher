export interface NoteEntry {
  id: string;
  instanceId: string;
  title: string;
  text: string;
  screenshotPaths: string[];
  createdAt: number;
  updatedAt: number;
}
