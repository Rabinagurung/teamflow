import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
        protocol: "https",
      },
      {
        hostname: "*.googleusercontent.com", // * : whitelisting all sub domains: lh3 , lh4, lh5 , lh6
        protocol: "https",
      },
      {
        hostname: "avatar.vercel.sh",
        protocol: "https",
      },
      {
        hostname: "6707zuuhmq.ufs.sh",
        protocol: "https",
      },
    ],
  },
}

export default nextConfig
