# Publish ai-mosaic

Run these steps from `D:\practise\mvp` after authenticating.

## 1. GitHub (one-time auth)

```powershell
.\.tools\bin\gh.exe auth login
```

Choose: GitHub.com → HTTPS → Login with a browser → authorize **himakarinv-stack** account.

## 2. Create repo and push

```powershell
.\.tools\bin\gh.exe repo create himakarinv-stack/ai-mosaic --public --source=. --remote=origin --push --description "MCP server for Angular architecture, code quality, and version-aware review"
```

If the repo already exists:

```powershell
git push -u origin main
```

## 3. npm (one-time auth)

```powershell
npm login
```

Use the npm account tied to **himakarinv@gmail.com**.

## 4. Publish to npm

```powershell
npm run build
npm publish --access public
```

## Verify

- GitHub: https://github.com/himakarinv-stack/ai-mosaic
- npm: https://www.npmjs.com/package/ai-mosaic

```powershell
npx ai-mosaic-setup --help
```
