Work in progress VSCode extension for a DSL based on TypeScript. See https://github.com/microsoft/vscode/issues/85788.

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

# inside VSCode directory
./scripts/code.sh --extensionDevelopmentPath=$ABSOLUTE_PATH_TO_VSCODE_STS_DIRECTORY ~/vscode-sts/example
```

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
