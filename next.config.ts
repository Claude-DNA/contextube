import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg uses Node built-ins; keep it out of the bundle.
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      {
        // The read API and discovery files are public and open to any origin.
        source: "/(api/v1/.*|llms.txt|openapi.json|.well-known/.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
