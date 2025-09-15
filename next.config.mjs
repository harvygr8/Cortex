/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@xenova/transformers': false,
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['faiss-node'],
  }
};

export default nextConfig;