import { createHash } from 'crypto';
import * as fs from 'fs/promises';

export async function sha1File(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return createHash('sha1').update(data).digest('hex');
}

export function sha1Buffer(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex');
}

export async function verifyFile(filePath: string, expectedSha1: string): Promise<boolean> {
  try {
    const hash = await sha1File(filePath);
    return hash === expectedSha1;
  } catch {
    return false;
  }
}
