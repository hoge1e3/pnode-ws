import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import chokidar from "chokidar";
import fs, { realpathSync } from "fs";
import path from "path";

//---Config
const EXCLUDENAMES=[".gsync", ".git"];
const SERVER_ROOT=fs.realpathSync(".");
const peers=[
  {browser: "/idb/run", server: path.join(SERVER_ROOT, "idb/run") },
  {browser: "/idb/pnode-ws", server: SERVER_ROOT},
];
const WS_PORT = 8080;
const HTTP_PORT= 3000;
const PUBLIC = path.resolve(".");
//const IDB_ROOT = path.resolve("./idb");
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
  const fullPath = filePath;// path.join(IDB_ROOT, filePath);
  const stat = fs.statSync(fullPath);
  const mtime = stat.mtimeMs;
  const content = fileToDataURL(fullPath);// fs.readFileSync(fullPath, "utf8"); 
  return { mtime, content };
}

// 全ファイルを初期送信
/*function sendAllFiles(ws) {
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
}*/

function browserPathToServerPath(b){
  for(const p of peers){
    if (b.startsWith(p.browser)){
      return path.join(p.server, path.relative(p.browser, b));
    }
  }
  console.warn("Unmatched browserPath: ", b);
}
function serverPathToBrowserPath(s){
  const rs=fs.realpathSync(s);
  for(const p of peers){  
    if (rs.startsWith(p.server)) {
      return path.join(p.browser, path.relative(p.server, s)).replace(/\\/g,"/");
    }
  }
  console.warn("Unmatched serverPath: ", s);
}

function excludes(p) {
  while(true) {
    if (EXCLUDENAMES.includes(path.basename(p))) return true;
    const np=path.dirname(p);
    if (np==p) return false;
    p=np;
  }
}
// WebSocket 接続
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("client connected");

  // 初期ファイル送信
  //sendAllFiles(ws);

  ws.on("message", (msg) => {
    try {
      const { type, path: browserPath, info } = JSON.parse(msg.toString());
      if (excludes(browserPath)) return;
      const serverPath = browserPathToServerPath(browserPath);
      if (!serverPath || excludes(serverPath)) return;
      if (type === "update") {
        fs.mkdirSync(path.dirname(serverPath), { recursive: true });
        dataURLToFile(info.content, serverPath);
        fs.utimesSync(serverPath, new Date(), new Date(info.mtime));
      } else if (type === "delete") {
        if (fs.existsSync(serverPath)) {
          fs.unlinkSync(serverPath);
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
const watcher = chokidar.watch(SERVER_ROOT, { ignoreInitial: true, persistent: true });

watcher
  .on("add", (file) => notifyChange("file", file))
  .on("change", (file) => notifyChange("file", file))
  .on("unlink", (file) => notifyChange("delete", file));

function notifyChange(type, fullPath) {
  const serverPath = fullPath; //path.relative(SERVER_ROOT, fullPath).replace(/\\/g, "/");
  if (!serverPath||excludes(serverPath)) return;
  const browserPath = serverPathToBrowserPath(serverPath);
  if (!browserPath||excludes(browserPath)) return;
  if (type === "delete") {
    broadcast({ type: "delete", path: browserPath });
  } else {
    try {
      const info = readFileInfo(serverPath);
      broadcast({ type: "update", path: browserPath, info });
    } catch (e) {
      console.error("notify error", serverPath, e);
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
    throw new Error("Invalid dataURL format: ".dataURL.substring(0,50));
  }
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);
}
