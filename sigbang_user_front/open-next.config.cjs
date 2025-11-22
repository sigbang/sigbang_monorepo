// OpenNext Cloudflare configuration (CommonJS)
// Ref: https://opennext.js.org/cloudflare
module.exports = {
  // Output directory consumed by wrangler.toml
  outDir: ".open-next",
  // Default (Node-compatible wrapper) for server routes
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
  // Externalize any accidental Node core imports at the edge
  edgeExternals: ["node:crypto"],
  // Middleware runs on edge wrapper
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
};


