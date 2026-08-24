# kaisa-tool

브라우저에서만 동작하는 이미지·PDF 유틸리티입니다. 파일은 서버로 전송되지 않습니다.

**배포 방식: SSG 정적 export** (`out/` → GitHub Pages)

## 시작

```bash
npm install
npm run dev
```

http://localhost:8888

## 빌드 / 배포

```bash
npm run build   # 정적 파일 → out/
npm run start   # out/ 로컬 확인
```

`main` 브랜치 푸시 시 Actions가 `out/`을 GitHub Pages(`gh-pages`)로 배포합니다.  
자세한 내용: [docs/README_BUILD.md](docs/README_BUILD.md)

## Path

### 이미지

- `/image/` — 목록
- `/image/compress/` — 용량 줄이기
- `/image/resize/` — 사이즈 변경
- `/image/jpg-to-png/`
- `/image/png-to-jpg/`
- `/image/webp-to-jpg/`

### PDF

- `/pdf/` — 목록
- `/pdf/compress/`
- `/pdf/merge/`
- `/pdf/split/`
- `/pdf/jpg-to-pdf/`
- `/pdf/pdf-to-jpg/`
