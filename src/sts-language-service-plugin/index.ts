import { join } from "path";
import {
  ScriptKind,
  JsxEmit,
  CompilerOptions,
} from "typescript/lib/tsserverlibrary";
import { resolve, dirname } from "path";

const globalCompilerOptions: CompilerOptions = {
  strict: true,
  noUnusedLocals: true,
  jsx: JsxEmit.React,
  jsxFactory: "createElement",
  lib: [join(__dirname, "../../declarations/core.d.sts")],
  typeRoots: [],
  allowNonTsExtensions: true,
  allowJs: false,
};

const virtualConfigShared = {
  include: ["./"],
};

const LOG_PREFIX = "[STS]";
const STS_EXTENSION = ".sts";

let needsRefresh = true;

const tsconfigFilename = "/tsconfig.json";
const customConfigFilename = "/stsconfig.json";

type TS = typeof import("typescript/lib/tsserverlibrary");
type Log = (message: string) => void;

function isTSConfig(path: string) {
  return path.endsWith(tsconfigFilename);
}

function getCustomConfigPath(path: string) {
  return path.replace(tsconfigFilename, customConfigFilename);
}

function getVirtualTSConfigFromCustomConfig(customConfigContent: string) {
  // TODO: think about cache
  const json = JSON.parse(customConfigContent);
  return JSON.stringify({
    ...virtualConfigShared,
    files: [`/Users/artemtyurin/vscode-sts/declarations/${json.version}.d.sts`],
  });
}

function patchSys(ts: TS, log: Log) {
  const _readFile = ts.sys.readFile;
  const _fileExists = ts.sys.fileExists;
  const _watchFile = ts.sys.watchFile!;

  ts.sys.readFile = (path: string, encoding?: string | undefined) => {
    log(`ts.sys.readFile: path = ${path}`);

    if (isTSConfig(path)) {
      log(
        `ts.sys.readFile: redirecting ${path} to ${getCustomConfigPath(path)}`,
      );

      const customConfigContent = _readFile.call(
        ts.sys,
        getCustomConfigPath(path),
      );

      if (customConfigContent) {
        return getVirtualTSConfigFromCustomConfig(customConfigContent);
      }
    }

    return _readFile.call(ts.sys, path, encoding);
  };

  ts.sys.fileExists = (path: string) => {
    log(`ts.sys.fileExists: path = ${path}`);

    if (isTSConfig(path)) {
      log(
        `ts.sys.fileExists: redirecting ${path} to ${getCustomConfigPath(
          path,
        )}`,
      );
      return _fileExists.call(ts.sys, getCustomConfigPath(path));
    }

    return _fileExists.call(ts.sys, path);
  };

  ts.sys.watchFile = (
    path: string,
    callback: ts.FileWatcherCallback,
    pollingInterval?: number | undefined,
  ) => {
    log(`ts.sys.watchFile: path = ${path}`);

    if (isTSConfig(path)) {
      log(
        `ts.sys.watchFile: redirecting ${path} to ${getCustomConfigPath(path)}`,
      );
      return _watchFile.call(
        ts.sys,
        getCustomConfigPath(path),
        callback,
        pollingInterval,
      );
    }

    return _watchFile.call(ts.sys, path, callback, pollingInterval);
  };
}

function patchLanguageServiceHost(
  ts: TS,
  host: ts.LanguageServiceHost,
  log: Log,
) {
  const getScriptKind = host.getScriptKind;
  const getCompilationSettings = host.getCompilationSettings;

  host.getScriptKind = (filename: string) => {
    if (getScriptKind) {
      const scriptKind = getScriptKind.call(host, filename);

      if (scriptKind !== ScriptKind.Unknown) {
        return scriptKind;
      }
    }

    return ScriptKind.TSX;
  };

  host.getCompilationSettings = () => {
    const projectConfig = getCompilationSettings.call(host);
    const compilationSettings = { ...projectConfig, ...globalCompilerOptions };
    return compilationSettings;
  };

  host.resolveModuleNames = (
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    options: ts.CompilerOptions,
  ) => {
    log(`In ${containingFile}, found moduleNames = ${moduleNames}`);

    return moduleNames.map(moduleName => {
      const { resolvedModule } = ts.resolveModuleName(
        moduleName,
        containingFile,
        options,
        ts.sys,
        undefined,
        undefined,
      );

      log(
        `Resolved moduleName = ${moduleName} to resolvedModule = ${JSON.stringify(
          resolvedModule,
        )}`,
      );

      if (!resolvedModule) {
        return {
          resolvedFileName: resolve(dirname(containingFile), moduleName),
          extension: ts.Extension.Tsx,
        };
      }

      return resolvedModule;
    });
  };
}

function patchTS(ts: TS) {
  const _ts = ts as any;
  const _getSupportedExtensions = _ts.getSupportedExtensions;

  _ts.getSupportedExtensions = (...args: any[]) => {
    const r = _getSupportedExtensions(...args);
    return [...r, STS_EXTENSION];
  };
}

function refreshIfNeeded(projectService: ts.server.ProjectService) {
  if (!needsRefresh) {
    return;
  }
  setTimeout(() => {
    // clear the cache
    (projectService as any).configFileExistenceInfoCache.clear();

    projectService.reloadProjects();
    needsRefresh = false;
  }, 0);
}

function init(modules: { typescript: TS }) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    const { projectService } = info.project;

    function log(message: string) {
      projectService.logger.info(`${LOG_PREFIX} ${message}`);
    }

    patchSys(ts, log);
    patchTS(ts);

    patchLanguageServiceHost(ts, info.languageServiceHost, log);

    refreshIfNeeded(projectService);

    return info.languageService;
  }

  return { create };
}

export = init;
