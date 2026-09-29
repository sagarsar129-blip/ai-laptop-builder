import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = require('path').dirname(__filename);

/**
 * Next.js config for AI Laptop Builder Dashboard
 */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_PROJECT_ROOT: process.env.PROJECT_ROOT || './demo-project',
    NEXT_PUBLIC_BUILDER_API: process.env.BUILDER_API || 'http://localhost:3000',
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true' ? 'true' : 'false',
  },
};

export default nextConfig;
