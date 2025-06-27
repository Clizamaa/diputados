/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.camara.cl',
        port: '',
        pathname: '/img.aspx',
      },
    ],
  },
};

export default nextConfig;
