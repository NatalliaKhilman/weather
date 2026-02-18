/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "stripe"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "openweathermap.org", pathname: "/img/wn/**" },
      { protocol: "https", hostname: "cdn.weatherapi.com", pathname: "/weather/**" },
    ],
  },
};

export default nextConfig;
