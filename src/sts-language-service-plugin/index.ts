import { join } from "path";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    info.project.enableLanguageService();

    info.project.projectService.logger.info("STS plugin is active");

    const compilerOptions = {
      strict: true,
      noUnusedLocals: true,
      jsx: ts.JsxEmit.React,
      jsxFactory: "createElement",
      lib: [join(__dirname, "../../declarations/core.d.ts")],
    };

    info.project.projectService.setCompilerOptionsForInferredProjects(
      compilerOptions,
    );

    const getCompilationSettings =
      info.languageServiceHost.getCompilationSettings;

    info.languageServiceHost.getCompilationSettings = () => {
      const projectConfig = getCompilationSettings.call(
        info.languageServiceHost,
      );
      const compilationSettings = { ...projectConfig, ...compilerOptions };
      return compilationSettings;
    };

    return info.languageService;
  }

  return { create };
}

export = init;
