/** @type {import('next').NextConfig} */
const nextConfig = {
  // `soap` is a Node.js-only dependency. Keeping it external prevents Next
  // from resolving its browser-only `debug` implementation during SSR.
  serverExternalPackages: ['soap'],
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
