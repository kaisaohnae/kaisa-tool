## SSG 정적 배포 (기본)

이 프로젝트는 Next.js `output: 'export'` 로 **서버 없이** `out/` 정적 파일만 배포합니다.

```bash
npm run build   # → out/
```

### 방법1. 수동 배포

```
npm run build
cd out
touch .nojekyll
echo 'tools.kaisa.co.kr' > CNAME
git init
git checkout -b main
git add -A
git commit -m 'deploy'
git remote add origin "https://github.com/kaisaohnae/kaisa-tool.git"
git push -u --force origin main
rm -rf .git
cd ..
```

### 방법2. GitHub Actions (현재 사용)

- `.github/workflows/deploy.yml` — `main` 푸시 시 `out/` → `gh-pages`
- 저장소 Settings → Actions → General → Workflow permissions: **Read and write**
- Settings → Pages → Source: **gh-pages** 브랜치

### 로컬에서 빌드 결과 확인

```bash
npm run build
npm run start   # out/ 정적 서빙 (포트 8888)
```
