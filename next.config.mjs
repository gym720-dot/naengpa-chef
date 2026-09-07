/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.CAPACITOR_BUILD === 'true' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
