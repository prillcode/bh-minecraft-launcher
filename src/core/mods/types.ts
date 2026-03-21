export interface InstalledMod {
  id: string;               // Modrinth project ID
  slug: string;
  name: string;
  versionId: string;        // Modrinth version ID
  versionNumber: string;
  fileName: string;
  sha1: string;
  installedAt: number;
  enabled: boolean;         // false = renamed to .disabled
}
