import { spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import { getLauncherPaths } from '../utils/paths';
import { JavaDetector } from './java-detector';
import { InstanceManager } from './instance';
import { VersionManifest } from './version-manifest';
import { FabricProvisioner } from './fabric-provisioner';
import type { LaunchOptions, VersionDetail, Instance } from './types';
import { logger } from '../utils/logger';

/**
 * Assembles the full `java` command line and spawns the Minecraft process.
 *
 * A Minecraft launch command looks roughly like:
 *   java -Xmx2G -Xms512M -cp <all-libs>:<client.jar>
 *        net.minecraft.client.main.Main
 *        --username <name> --accessToken <token> --uuid <uuid>
 *        --version <ver> --assetsDir <dir> --assetIndex <idx>
 *        --gameDir <dir>
 */
export class GameLauncher {
  private activeProcess: ChildProcess | null = null;
  private versionManifest = new VersionManifest();
  private javaDetector = new JavaDetector();
  private instanceManager = new InstanceManager();
  private fabricProvisioner = new FabricProvisioner();

  async launch(options: LaunchOptions): Promise<ChildProcess> {
    const paths = getLauncherPaths();

    // TODO: Load instance config from disk
    const instance = await this.loadInstance(options.instanceId);
    const version = await this.versionManifest.getVersion(instance.versionId);

    const javaPath = instance.javaPath ?? (await this.javaDetector.findBest(version));

    let mainClass = version.mainClass;
    let extraLibs: string[] = [];
    if (instance.modLoader === 'fabric') {
      const fabric = await this.fabricProvisioner.provision(instance.versionId, options.onProgress);
      mainClass = fabric.mainClass;
      extraLibs = fabric.libraryPaths;
    }

    const classpath = this.buildClasspath(version, paths.libraries, paths.versions, extraLibs);
    const gameArgs = this.buildGameArgs(version, instance, options);
    const jvmArgs = this.buildJvmArgs(version, instance, paths);

    const allArgs = [...jvmArgs, '-cp', classpath, mainClass, ...gameArgs];

    logger.info(`Launching: ${javaPath} [${allArgs.length} args]`);
    logger.debug(`Full command: ${javaPath} ${allArgs.join(' ')}`);

    const child = spawn(javaPath, allArgs, {
      cwd: instance.gameDirectory,
      detached: false,
    });

    child.stdout?.on('data', (data) => options.onStdout?.(data.toString()));
    child.stderr?.on('data', (data) => options.onStderr?.(data.toString()));
    child.on('exit', (code) => {
      logger.info(`Minecraft exited with code ${code}`);
      options.onExit?.(code);
      this.activeProcess = null;
    });

    this.activeProcess = child;
    return child;
  }

  kill(): void {
    if (this.activeProcess) {
      this.activeProcess.kill();
      this.activeProcess = null;
    }
  }

  private buildClasspath(
    version: VersionDetail,
    librariesDir: string,
    versionsDir: string,
    extraLibs: string[] = [],
  ): string {
    const separator = process.platform === 'win32' ? ';' : ':';
    const libs: string[] = [...extraLibs];

    for (const lib of version.libraries) {
      if (!this.shouldIncludeLibrary(lib)) continue;
      if (lib.downloads.artifact) {
        libs.push(path.join(librariesDir, lib.downloads.artifact.path));
      }
    }

    // Add client JAR
    libs.push(path.join(versionsDir, version.id, `${version.id}.jar`));

    return libs.join(separator);
  }

  private buildGameArgs(
    version: VersionDetail,
    instance: Instance,
    options: LaunchOptions,
  ): string[] {
    const args: string[] = [];

    const substitutions: Record<string, string> = {
      '${auth_player_name}': options.profile.name,
      '${version_name}': version.id,
      '${game_directory}': instance.gameDirectory,
      '${assets_root}': getLauncherPaths().assets,
      '${assets_index_name}': version.assets,
      '${auth_uuid}': options.profile.id,
      '${auth_access_token}': options.accessToken,
      '${user_type}': options.userType ?? 'msa',
      '${version_type}': version.type,
      '${clientid}': '',
      '${auth_xuid}': '',
    };

    if (version.arguments?.game) {
      for (const arg of version.arguments.game) {
        if (typeof arg === 'string') {
          args.push(this.substitute(arg, substitutions));
        }
        // TODO: Handle conditional args (rules-based)
      }
    }

    // Auto-connect to server if configured (great for BlockHaven!)
    // --server/--port were removed in 1.20; use --quickPlayMultiplayer instead
    if (instance.serverAutoConnect) {
      args.push('--quickPlayMultiplayer', `${instance.serverAutoConnect.host}:${instance.serverAutoConnect.port}`);
    }

    return args;
  }

  private buildJvmArgs(
    version: VersionDetail,
    instance: Instance,
    paths: ReturnType<typeof getLauncherPaths>,
  ): string[] {
    const args: string[] = [
      `-Xms${instance.minMemoryMb}M`,
      `-Xmx${instance.maxMemoryMb}M`,
      `-Djava.library.path=${path.join(paths.natives, version.id)}`,
      '-Dminecraft.launcher.brand=blockhaven-launcher',
      '-Dminecraft.launcher.version=0.1.0',
    ];

    // Add version-specific JVM args
    if (version.arguments?.jvm) {
      const stringArgs = version.arguments.jvm.filter((a): a is string => typeof a === 'string');
      for (let i = 0; i < stringArgs.length; i++) {
        const arg = stringArgs[i];
        // Skip classpath placeholder and the -cp flag that precedes it — handled in allArgs
        if (arg.includes('${classpath}')) continue;
        if (arg === '-cp' && stringArgs[i + 1]?.includes('${classpath}')) { i++; continue; }
        args.push(this.substitute(arg, {
          '${natives_directory}': path.join(paths.natives, version.id),
          '${launcher_name}': 'blockhaven-launcher',
          '${launcher_version}': '0.1.0',
        }));
      }
    }

    // User-defined extra JVM args
    if (instance.jvmArgs) {
      args.push(...instance.jvmArgs);
    }

    return args;
  }

  private shouldIncludeLibrary(lib: { rules?: Array<{ action: string; os?: { name?: string } }> }): boolean {
    if (!lib.rules) return true;

    const osName = ({ win32: 'windows', darwin: 'osx', linux: 'linux' } as Record<string, string>)[process.platform] ?? 'linux';
    let dominated = false;

    for (const rule of lib.rules) {
      if (rule.action === 'allow') {
        if (!rule.os) dominated = true;
        else if (rule.os.name === osName) dominated = true;
      } else if (rule.action === 'disallow') {
        if (rule.os?.name === osName) return false;
      }
    }

    return dominated;
  }

  private substitute(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(key, value);
    }
    return result;
  }

  private async loadInstance(id: string): Promise<Instance> {
    return this.instanceManager.get(id);
  }
}
