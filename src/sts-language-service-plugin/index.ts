import { join } from "path";
import { ScriptKind } from "typescript/lib/tsserverlibrary";
import { resolve, dirname } from "path";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    function log(s: string) {
      info.project.projectService.logger.info(`[STS] ${s}`);
    }

    info.project.enableLanguageService();

    const openClientFile = info.project.projectService.openClientFile;

    info.project.projectService.openClientFile = (...args) => {
      log(`openClientFile ${args[0]}`);
      return openClientFile(...args);
    };

    const projectRoot = info.project.getCurrentDirectory();
    log(`Plugin is active, projectRoot = ${projectRoot}`);

    const compilerOptions = {
      strict: true,
      noUnusedLocals: true,
      jsx: ts.JsxEmit.React,
      jsxFactory: "createElement",
      lib: [join(__dirname, "../../declarations/core.d.ts")],
      typeRoots: [],
    };

    info.languageServiceHost.getScriptKind = (filename: string) => {
      log(`getScriptKind`);
      return ScriptKind.TSX;
    };

    const readFile = info.languageServiceHost.readFile;
    if (!readFile) {
      log(`Fail`);
      return info.languageService;
    }
    info.languageServiceHost.readFile = (
      fileName: string,
      encoding?: string,
    ) => {
      log(`readFile ${fileName}`);
      return readFile(fileName, encoding);
    };

    info.languageServiceHost.getCompilationSettings;

    const getCompilationSettings =
      info.languageServiceHost.getCompilationSettings;
    info.languageServiceHost.getCompilationSettings = () => {
      const projectConfig = getCompilationSettings.call(
        info.languageServiceHost,
      );
      const compilationSettings = { ...projectConfig, ...compilerOptions };
      return compilationSettings;
    };

    info.languageServiceHost.resolveModuleNames = (
      moduleNames: string[],
      containingFile: string,
      reusedNames: string[] | undefined,
      redirectedReference: ts.ResolvedProjectReference | undefined,
      options: ts.CompilerOptions,
    ) => {
      info.project.projectService.logger.info(
        `[STS] In ${containingFile}, found moduleNames = ${moduleNames}`,
      );

      return moduleNames.map(moduleName => {
        const { resolvedModule } = ts.resolveModuleName(
          moduleName,
          containingFile,
          options,
          ts.sys,
          undefined,
          undefined,
        );

        info.project.projectService.logger.info(
          `[STS] Resolved moduleName = ${moduleName} to resolvedModule = ${JSON.stringify(
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

    return info.languageService;
  }

  return { create };
}

export = init;
