Work in progress VSCode extension for a DSL based on TypeScript. See https://github.com/microsoft/vscode/issues/85788.

# Goal

Provide all IntelliSense features that VSCode provides for TypeScript, but for custom file extension (e.g. `*.sts`). This is needed to support "internal" DSLs: custom languages that use a subset of TypeScript.

# How does this work

This is a VSCode extension that configures a language (`*.sts` files) and activates a [TS server plugin](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin) that enables TypeScript language service for the new file extension. `tsconfig.json` are virtual: they are generated on the fly based on `stsconfig.json` by redirecting filesystem calls.

# Features

- [x] Autocomplete and hover tips
- [x] Providing custom declarations
- [x] Go to defintion for `*.ts` and `*.sts`
- [x] Auto-import
- [x] Virtual `tsconfig.json`: custom settings are read from `stsconfig.json`

# Open problems

- https://github.com/agentcooper/vscode-sts/issues/1

# To run

```
npm install
npm run build

code .

# In VSCode press 'F5' (Use fn on Mac), new VSCode instance will open, open ./example directory with it
```

# Developing against local VSCode

```bash
# Follow https://github.com/microsoft/vscode/wiki/How-to-Contribute to build local VSCode
# Use `yarn watch` to build VSCode

# enable TSS_LOG (see https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29#logging)
export TSS_LOG="-level verbose -file ~/vscode-sts/tss.log"

# inside VSCode directory
./scripts/code.sh --extensionDevelopmentPath=$ABSOLUTE_PATH_TO_VSCODE_STS_DIRECTORY ~/vscode-sts/example
```

# Context

VSCode uses built-in [typescript-language-features](https://github.com/microsoft/vscode/tree/master/extensions/typescript-language-features) extension that spawns [TS server](https://github.com/microsoft/TypeScript/tree/master/src/server) (TypeScript Language Service). TS server supports [plugin system](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin). VSCode extension can [provide a plugin](https://code.visualstudio.com/api/references/contribution-points#contributes.typescriptServerPlugins) to a TS server.

TypeScript is not using LSP, however 2 third-party solutions exists:

- https://github.com/theia-ide/typescript-language-server (wraps TS server)
- https://github.com/sourcegraph/javascript-typescript-langserver

# Useful resources

## Language server plugins

- https://github.com/Quramy/typescript-eslint-language-service
- https://github.com/justjavac/typescript-deno-plugin
- https://github.com/mrmckeb/typescript-plugin-css-modules
- https://github.com/runem/lit-analyzer/tree/master/packages/ts-lit-plugin
- https://github.com/angular/vscode-ng-language-service
- https://github.com/Microsoft/typescript-tslint-plugin

## Docs

- https://code.visualstudio.com/api/references/contribution-points#contributes.typescriptServerPlugins
- https://github.com/microsoft/TypeScript/wiki/Getting-logs-from-TS-Server-in-VS-Code
- https://github.com/Microsoft/TypeScript/wiki/Debugging-Language-Service-in-VS-Code
