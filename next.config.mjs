/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "openweathermap.org", pathname: "/img/wn/**" },
      { protocol: "https", hostname: "cdn.weatherapi.com", pathname: "/weather/**" },
    ],
  },
};

export default nextConfig;
