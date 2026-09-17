/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  devIndicators: false,
  webpack: (config) => {
    // The wagmi `connectors` barrel re-exports Coinbase smart-account connectors
    // (@wagmi/connectors -> @base-org/account -> @coinbase/cdp-sdk), which import
    // optional @x402/* deps that npm does not install. We only use the `injected`
    // connector, so stub those modules out to keep the build self-contained.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core": false,
      "@x402/evm": false,
      "@x402/extensions": false,
      "@x402/svm": false,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;

