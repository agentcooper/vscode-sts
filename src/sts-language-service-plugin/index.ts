import { join } from "path";
import { ScriptKind, JsxEmit } from "typescript/lib/tsserverlibrary";
import { resolve, dirname } from "path";

const created = new Map();

const globalCompilerOptions = {
  strict: true,
  noUnusedLocals: true,
  jsx: JsxEmit.React,
  jsxFactory: "createElement",
  lib: [join(__dirname, "../../declarations/core.d.ts")],
  typeRoots: [],
  allowNonTsExtensions: true,
};

const virtualConfigShared = {
  include: ["./"],
};

const files: Record<string, string> = {
  "/Users/artemtyurin/vscode-sts/example/v1/tsconfig.json": JSON.stringify({
    ...virtualConfigShared,
    files: ["/Users/artemtyurin/vscode-sts/declarations/v1.d.ts"],
  }),
  "/Users/artemtyurin/vscode-sts/example/v2/tsconfig.json": JSON.stringify({
    ...virtualConfigShared,
    files: ["/Users/artemtyurin/vscode-sts/declarations/v2.d.ts"],
  }),
};

const LOG_PREFIX = "[STS]";
const STS_EXTENSION = ".sts";

const ENABLE_VIRTUAL_FILES = true;

let needsReload = true;

type TS = typeof import("typescript/lib/tsserverlibrary");
type Log = (message: string) => void;

function patchSys(ts: TS, log: Log) {
  const _readFile = ts.sys.readFile;
  const _fileExists = ts.sys.fileExists;
  const _watchFile = ts.sys.watchFile!;

  ts.sys.readFile = (path: string, encoding?: string | undefined) => {
    log(`ts.sys.readFile: path = ${path}`);

    if (ENABLE_VIRTUAL_FILES && path in files) {
      return files[path];
    }

    return _readFile.call(ts.sys, path, encoding);
  };

  ts.sys.fileExists = (path: string) => {
    log(`ts.sys.fileExists: path = ${path}`);

    if (ENABLE_VIRTUAL_FILES && path in files) {
      return true;
    }

    return _fileExists.call(ts.sys, path);
  };

  ts.sys.watchFile = (
    path: string,
    callback: ts.FileWatcherCallback,
    pollingInterval?: number | undefined,
  ) => {
    log(`ts.sys.watchFile: path = ${path}`);

    if (ENABLE_VIRTUAL_FILES && path in files) {
      setTimeout(() => {
        if (!created.has(path)) {
          created.set(path, true);
          callback(path, ts.FileWatcherEventKind.Created);
        }
      }, 0);
      return {
        close() {
          created.delete(path);
        },
      };
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

function patchTS(ts: TS, projectService: ts.server.ProjectService) {
  const _ts = ts as any;
  const _getSupportedExtensions = _ts.getSupportedExtensions;

  _ts.getSupportedExtensions = (...args: any[]) => {
    const r = _getSupportedExtensions(...args);

    setTimeout(() => {
      if (needsReload) {
        projectService.reloadProjects();
        needsReload = false;
      }
    }, 0);

    return [...r, STS_EXTENSION];
  };
}

function init(modules: { typescript: TS }) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    const { projectService } = info.project;

    function log(message: string) {
      projectService.logger.info(`${LOG_PREFIX} ${message}`);
    }

    if (ENABLE_VIRTUAL_FILES) {
      patchSys(ts, log);
    }

    patchLanguageServiceHost(ts, info.languageServiceHost, log);

    patchTS(ts, projectService);

    return info.languageService;
  }

  return { create };
}

export = init;
