import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";

//---Config
const EXCLUDES=["run/.gsync/objects", "run/.git"];
const WS_PORT = 8080;
const HTTP_PORT= 3000;
const PUBLIC = path.resolve(".");
const IDB_ROOT = path.resolve("./idb");
//-----
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ port: WS_PORT });
// 静的ファイル提供 (client.html など)
app.use(express.static(PUBLIC));
server.listen(HTTP_PORT, () => {
  console.log(`Server running at http://localhost:${HTTP_PORT}/pnode-bootkit`);
});

// 接続中のクライアント
const clients = new Set();

// ファイルを読み込んで {mtime, content} に変換
function readFileInfo(filePath) {
  const fullPath = path.join(IDB_ROOT, filePath);
  const stat = fs.statSync(fullPath);
  const mtime = stat.mtimeMs;
  const content = fileToDataURL(fullPath);// fs.readFileSync(fullPath, "utf8"); 
  return { mtime, content };
}

// 全ファイルを初期送信
function sendAllFiles(ws) {
  const initData=[];
  function walk(dir, base = "") {
    const rel=path.relative(IDB_ROOT, dir).replace(/\\/g,"/");
    console.log("Walk",rel);
    if (EXCLUDES.includes( rel )) {
      return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = path.join(base, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relPath);
      } else {
        try {
          const info = readFileInfo(relPath);
          initData.push({path: relPath, info});
          //ws.send(JSON.stringify({ type: "update", path: relPath, info }));
        } catch (e) {
          console.error("read error", relPath, e);
        }
      }
    }
  }
  walk(IDB_ROOT);
  ws.send(JSON.stringify({ type: "init", files: initData}));
}

// WebSocket 接続
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("client connected");

  // 初期ファイル送信
  sendAllFiles(ws);

  ws.on("message", (msg) => {
    try {
      const { type, path: relPath, info } = JSON.parse(msg.toString());
      const fullPath = path.join(IDB_ROOT, relPath);

      if (type === "update") {
        if (EXCLUDES.some(e=>relPath.startsWith(e))) return;
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        dataURLToFile(info.content, fullPath);
        fs.utimesSync(fullPath, new Date(), new Date(info.mtime));
      } else if (type === "delete") {
        if (EXCLUDES.some(e=>relPath.startsWith(e))) return;
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (e) {
      console.error("message error", e);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("client disconnected");
  });
});

// ファイル変更監視 (再帰的)
const watcher = chokidar.watch(IDB_ROOT, { ignoreInitial: true, persistent: true });

watcher
  .on("add", (file) => notifyChange("file", file))
  .on("change", (file) => notifyChange("file", file))
  .on("unlink", (file) => notifyChange("delete", file));

function notifyChange(type, fullPath) {
  const relPath = path.relative(IDB_ROOT, fullPath).replace(/\\/g, "/");
  if (type === "delete") {
    broadcast({ type: "delete", path: relPath });
  } else {
    try {
      const info = readFileInfo(relPath);
      broadcast({ type: "update", path: relPath, info });
    } catch (e) {
      console.error("notify error", relPath, e);
    }
  }
}

function broadcast(msg) {
  const str = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(str);
    }
  }
}

export function fileToDataURL(filePath, mimeType = "application/octet-stream") {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
export function dataURLToFile(dataURL, filePath) {
  const match = dataURL.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid dataURL format");
  }
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);
}
