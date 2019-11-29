Work in progress VSCode extension for a DSL based on TypeScript. See https://github.com/microsoft/vscode/issues/85788.

# To run

```
npm install
npm run build

code .

# In VSCode press 'F5', new VSCode instance will open, open ./example directory with it
```

# Developing against local VSCode

```bash
# Follow https://github.com/microsoft/vscode/wiki/How-to-Contribute to build local VSCode
# Use `yarn watch` to build VSCode

./scripts/code.sh --extensionDevelopmentPath=$ABSOLUTE_PATH_TO_VSCODE_STS_DIRECTORY
```
