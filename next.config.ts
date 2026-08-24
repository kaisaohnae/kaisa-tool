import type {NextConfig} from 'next';

/** SSG 정적 배포 전용 — `npm run build` 결과가 `out/`에 생성됩니다. */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
