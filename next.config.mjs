/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // sql.js ships a CommonJS module + WASM binary; load it from node_modules at runtime.
  serverExternalPackages: ['sql.js'],
};

export default nextConfig;
