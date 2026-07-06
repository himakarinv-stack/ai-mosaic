# Publish ai-mosaic to GitHub Packages

Package: `@himakarinv-stack/ai-mosaic`  
Registry: https://npm.pkg.github.com  
Package page: https://github.com/himakarinv-stack/ai-mosaic/pkgs/npm/ai-mosaic

## Publish locally

```powershell
cd D:\practise\mvp
$env:NODE_AUTH_TOKEN = .\.tools\bin\gh.exe auth token
npm run build
npm publish
```

Requires `gh auth login` as **himakarinv-stack** with `write:packages` scope.

## Publish via GitHub Release (CI)

1. Push a tag: `git tag v0.1.0 && git push origin v0.1.0`
2. Create a GitHub Release from that tag
3. Workflow `.github/workflows/publish.yml` publishes automatically

## Consumer install

Add to `~/.npmrc`:

```
@himakarinv-stack:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then:

```bash
npm install @himakarinv-stack/ai-mosaic
npx ai-mosaic-setup
```
