import express from "express";
import { createServer } from "http";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { scramjetPath } from "@mercuryworkshop/scramjet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { bareMuxPath } from "@mercuryworkshop/bare-mux";
import { BareServer } from "bare-server-node";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bare = new BareServer("/bare/");
const app = express();
const PORT = process.env.PORT || 8080;

// Serve proxy engine static files
app.use("/uv/", express.static(uvPath));
app.use("/scramjet/", express.static(scramjetPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(bareMuxPath));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/uv-proxy", (req, res) => res.sendFile(path.join(__dirname, "public", "uv.html")));
app.get("/scramjet-proxy", (req, res) => res.sendFile(path.join(__dirname, "public", "scramjet.html")));

// Fallback
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// HTTP server (handles both express and bare)
const server = createServer();
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  else app(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
  else socket.destroy();
});

server.listen(PORT, () => console.log(`SwiftProxy UV running on port ${PORT}`));
