import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { JavaRuntime, VersionDetail } from './types';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Detects installed Java runtimes across common OS locations.
 */
export class JavaDetector {
  /**
   * Scan for all available Java runtimes.
   */
  async detect(): Promise<JavaRuntime[]> {
    const candidates = await this.findCandidates();
    const runtimes: JavaRuntime[] = [];

    for (const javaPath of candidates) {
      try {
        const info = await this.probeRuntime(javaPath);
        if (info) runtimes.push(info);
      } catch {
        // Skip invalid candidates
      }
    }

    // Sort: highest version first, 64-bit preferred
    runtimes.sort((a, b) => {
      if (a.is64Bit !== b.is64Bit) return a.is64Bit ? -1 : 1;
      return b.majorVersion - a.majorVersion;
    });

    logger.info(`Found ${runtimes.length} Java runtimes`);
    return runtimes;
  }

  /**
   * Pick the best Java for a given Minecraft version.
   */
  async findBest(version: VersionDetail): Promise<string> {
    const requiredMajor = version.javaVersion?.majorVersion ?? 17;
    const runtimes = await this.detect();

    // Prefer exact major match, then closest higher version
    const exact = runtimes.find((r) => r.majorVersion === requiredMajor && r.is64Bit);
    if (exact) return exact.path;

    const compatible = runtimes.find((r) => r.majorVersion >= requiredMajor && r.is64Bit);
    if (compatible) return compatible.path;

    // Last resort: any java
    if (runtimes.length > 0) return runtimes[0].path;

    throw new Error(`No Java ${requiredMajor}+ found. Please install Java.`);
  }

  private async findCandidates(): Promise<string[]> {
    const candidates: string[] = [];

    // JAVA_HOME
    if (process.env.JAVA_HOME) {
      candidates.push(path.join(process.env.JAVA_HOME, 'bin', 'java'));
    }

    // PATH-based
    try {
      const cmd = process.platform === 'win32' ? 'where java' : 'which java';
      const { stdout } = await execAsync(cmd);
      candidates.push(...stdout.trim().split('\n').filter(Boolean));
    } catch {
      // java not on PATH
    }

    // OS-specific common locations
    if (process.platform === 'win32') {
      const programFiles = [
        process.env['ProgramFiles'] ?? 'C:\\Program Files',
        process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
        path.join(process.env.LOCALAPPDATA ?? '', 'Programs'),
      ];
      for (const base of programFiles) {
        for (const vendor of ['Java', 'Eclipse Adoptium', 'Microsoft', 'Zulu', 'Amazon Corretto']) {
          try {
            const vendorDir = path.join(base, vendor);
            const entries = await fs.readdir(vendorDir);
            for (const entry of entries) {
              candidates.push(path.join(vendorDir, entry, 'bin', 'java.exe'));
            }
          } catch {
            // Directory doesn't exist
          }
        }
      }
    } else if (process.platform === 'linux') {
      // Common Linux Java locations
      try {
        const jvmDir = '/usr/lib/jvm';
        const entries = await fs.readdir(jvmDir);
        for (const entry of entries) {
          candidates.push(path.join(jvmDir, entry, 'bin', 'java'));
        }
      } catch {}
    } else if (process.platform === 'darwin') {
      try {
        const { stdout } = await execAsync('/usr/libexec/java_home -V 2>&1');
        const paths = stdout.match(/\/.+/gm);
        if (paths) {
          candidates.push(...paths.map((p) => path.join(p.trim(), 'bin', 'java')));
        }
      } catch {}
    }

    // Deduplicate
    return [...new Set(candidates)];
  }

  private async probeRuntime(javaPath: string): Promise<JavaRuntime | null> {
    try {
      await fs.access(javaPath);
    } catch {
      return null;
    }

    const { stderr } = await execAsync(`"${javaPath}" -version`);
    const versionMatch = stderr.match(/version "(\d+)(?:\.(\d+))?/);
    if (!versionMatch) return null;

    const major = parseInt(versionMatch[1], 10);
    const is64 = stderr.includes('64-Bit');

    return {
      path: javaPath,
      version: versionMatch[0].replace('version "', ''),
      majorVersion: major >= 9 ? major : parseInt(versionMatch[2] ?? '8', 10),
      is64Bit: is64,
    };
  }
}
