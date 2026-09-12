/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.PORTFOLIO_STANDALONE === '1' ? { output: 'standalone' } : {}),
  // Separate preview output keeps the last production preview intact while iterating.
  distDir: process.env.PORTFOLIO_DIST_DIR || '.next',
  pageExtensions: ['page.jsx'],
  experimental: {
    // optimizeCss: true,
    // nextScriptWorkers: true,
  },
  // uncomment the following snippet if using styled components
  // compiler: {
  //   styledComponents: true,
  // },
  reactStrictMode: false, // Recommended for the `pages` directory, default in `app`.

  // Portfolio media is already exported as web-friendly WebP assets. Serving
  // it directly avoids request-time Sharp work and memory spikes on the 2 GiB
  // production server.
  images: { unoptimized: true },
  webpack(config, { isServer }) {
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   '@': path.resolve(__dirname),
    //   '@src/': path.resolve(__dirname, 'src'),
    //   '@app/': path.resolve(__dirname, 'app'),
    // };
    if (!isServer) {
      // We're in the browser build, so we can safely exclude the sharp module
      config.externals.push('sharp');
    }
    // shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    });

    return config;
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
  redirects: async () => [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
    {
      source: '/404',
      destination: '/',
      permanent: true,
    },
  ],
};

module.exports = nextConfig;
