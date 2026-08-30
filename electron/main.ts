import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  net,
  dialog,
  nativeImage,
} from "electron";
import * as path from "path";
import { fileURLToPath } from "node:url";
import fs from "fs";
import Database from "better-sqlite3";
import * as crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
let db: Database.Database;

// 初始化真实的 SQLite 数据库与表结构
function initDatabase() {
  const dataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "app.db");
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'available',
      password TEXT DEFAULT '',
      cooldownLeft INTEGER DEFAULT 0,
      cooldownTotal INTEGER DEFAULT 180,
      note TEXT,
      twofaSecret TEXT,
      twofaType TEXT DEFAULT 'totp'
    );
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emailId INTEGER,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      startDate TEXT,
      endDate TEXT,
      daysLeft INTEGER DEFAULT 14,
      totalDays INTEGER DEFAULT 14,
      url TEXT
    );
  `);

  try {
    db.prepare("SELECT password FROM emails LIMIT 1").get();
  } catch (e) {
    db.exec('ALTER TABLE emails ADD COLUMN password TEXT DEFAULT ""');
  }
  try {
    db.prepare("SELECT twofaSecret FROM emails LIMIT 1").get();
  } catch (e) {
    db.exec("ALTER TABLE emails ADD COLUMN twofaSecret TEXT");
  }
  try {
    db.prepare("SELECT twofaType FROM emails LIMIT 1").get();
  } catch (e) {
    db.exec("ALTER TABLE emails ADD COLUMN twofaType TEXT DEFAULT 'totp'");
  }
}

function registerIpcHandlers() {
  const ONESEC_DOMAINS = [
    "1secmail.com",
    "1secmail.org",
    "1secmail.net",
    "vjuu.com",
    "erine.email",
  ];
  const GUERRILLA_DOMAINS = [
    "sharklasers.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "grr.la",
  ];

  const fetchOptions: RequestInit = {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  };

  // 1. 数据库 CRUD
  ipcMain.handle("db-get-emails", () =>
    db.prepare("SELECT * FROM emails").all(),
  );

  ipcMain.handle("db-add-email", (_, address: string) => {
    const stmt = db.prepare("INSERT INTO emails (address) VALUES (?)");
    return stmt.run(address);
  });

  ipcMain.handle("db-update-password", (_, id: number, password: string) => {
    const stmt = db.prepare("UPDATE emails SET password = ? WHERE id = ?");
    return stmt.run(password, id);
  });

  ipcMain.handle("db-delete-email", (_, id: number) => {
    const stmt = db.prepare("DELETE FROM emails WHERE id = ?");
    return stmt.run(id);
  });

  ipcMain.handle("db-update-2fa", (_, id: number, secret: string | null) => {
    const stmt = db.prepare("UPDATE emails SET twofaSecret = ? WHERE id = ?");
    return stmt.run(secret, id);
  });

  ipcMain.handle("clear-all-database", () => {
    try {
      // 必须使用 db.exec 执行，不能用 db.run
      db.exec(`
        DELETE FROM emails;
        DELETE FROM assets;
        DELETE FROM sqlite_sequence WHERE name IN ('emails', 'assets');
        VACUUM;
      `);
      return { ok: true };
    } catch (err: any) {
      console.error("[主进程] 清空数据库失败:", err);
      return { ok: false, error: err.message };
    }
  });

  // ================= 新增：资产表 CRUD 接口 =================
  ipcMain.handle("db-get-assets", () =>
    db.prepare("SELECT * FROM assets").all(),
  );

  ipcMain.handle("db-upsert-asset", (_, asset) => {
    const existing = db
      .prepare("SELECT id FROM assets WHERE emailId = ? AND name = ?")
      .get(asset.emailId, asset.name) as any;
    if (existing) {
      const stmt = db.prepare(
        "UPDATE assets SET status = ?, startDate = ?, endDate = ?, daysLeft = ?, totalDays = ? WHERE id = ?",
      );
      stmt.run(
        asset.status,
        asset.startDate,
        asset.endDate,
        asset.daysLeft,
        asset.totalDays,
        existing.id,
      );
      return existing.id;
    } else {
      const stmt = db.prepare(
        "INSERT INTO assets (emailId, name, category, status, startDate, endDate, daysLeft, totalDays, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      const info = stmt.run(
        asset.emailId,
        asset.name,
        asset.category,
        asset.status,
        asset.startDate,
        asset.endDate,
        asset.daysLeft,
        asset.totalDays,
        asset.url,
      );
      return info.lastInsertRowid;
    }
  });
  // =========================================================

  ipcMain.handle("generate-totp", (_, secret: string) => {
    if (!secret) return null;
    try {
      const cleanSecret = secret.replace(/\s+/g, "").toUpperCase();

      const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let bits = "";
      for (let i = 0; i < cleanSecret.length; i++) {
        const val = base32chars.indexOf(cleanSecret.charAt(i));
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, "0");
      }
      const keyBytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        keyBytes.push(parseInt(bits.substring(i, i + 8), 2));
      }
      const key = Buffer.from(keyBytes);

      const epoch = Math.floor(Date.now() / 1000);
      const time = Buffer.alloc(8);
      time.writeUInt32BE(Math.floor(epoch / 30), 4);

      const hmac = crypto.createHmac("sha1", key);
      hmac.update(time);
      const result = hmac.digest();

      const offset = result[result.length - 1] & 0x0f;
      const code =
        (((result[offset] & 0x7f) << 24) |
          ((result[offset + 1] & 0xff) << 16) |
          ((result[offset + 2] & 0xff) << 8) |
          (result[offset + 3] & 0xff)) %
        1000000;

      const seconds = 30 - (epoch % 30);
      return { code: code.toString().padStart(6, "0"), seconds };
    } catch (error) {
      console.error("2FA 生成失败:", error);
      return null;
    }
  });

  ipcMain.handle("ping-api", async (_, emailAddress: string) => {
    if (!emailAddress || !emailAddress.includes("@")) return false;
    const [login, domain] = emailAddress.split("@");
    try {
      if (GUERRILLA_DOMAINS.includes(domain)) {
        const authRes = await net.fetch(
          `https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${login}&domain=${domain}`,
          fetchOptions,
        );
        if (!authRes.ok) return false;
        const data = await authRes.json();
        return !!data.sid_token;
      }
      if (ONESEC_DOMAINS.includes(domain)) {
        const res = await net.fetch(
          `https://www.1secmail.com/api/v1/?action=getDomainList`,
          fetchOptions,
        );
        return res.ok || res.status === 200;
      }
      return false;
    } catch (error: any) {
      return false;
    }
  });

  const getAppRoot = () =>
    app.isPackaged ? path.dirname(app.getPath("exe")) : app.getAppPath();

  ipcMain.handle("get-default-backup-path", () => {
    return path.join(getAppRoot(), "Back-upData", "EmailData.db");
  });

  ipcMain.handle("select-backup-path", async (_, currentPath) => {
    const defaultDir = path.dirname(currentPath);
    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      title: "选择备份保存路径",
      defaultPath: defaultDir,
      filters: [{ name: "数据库文件", extensions: ["db"] }],
    });
    return filePath || null;
  });

  ipcMain.handle("execute-backup", async (_, targetPath) => {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const sourcePath = path.join(app.getPath("userData"), "data", "app.db");
      if (!fs.existsSync(sourcePath))
        return { success: false, error: "当前数据库文件不存在" };
      fs.copyFileSync(sourcePath, targetPath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("execute-restore", async (_, defaultPath) => {
    const defaultDir = path.dirname(defaultPath);
    const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
      title: "选择备份文件进行恢复",
      defaultPath: defaultDir,
      properties: ["openFile"],
      filters: [{ name: "数据库文件", extensions: ["db"] }],
    });

    if (!filePaths || filePaths.length === 0) return { canceled: true };

    try {
      const sourcePath = path.join(app.getPath("userData"), "data", "app.db");
      if (db) db.close();
      fs.copyFileSync(filePaths[0], sourcePath);
      db = new Database(sourcePath);
      return { success: true };
    } catch (err: any) {
      try {
        db = new Database(path.join(app.getPath("userData"), "data", "app.db"));
      } catch (e) {}
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("fetch-mails", async (_, emailAddress: string) => {
    if (!emailAddress || !emailAddress.includes("@"))
      throw new Error("Invalid email");
    const [login, domain] = emailAddress.split("@");

    try {
      if (ONESEC_DOMAINS.includes(domain)) {
        const listRes = await net.fetch(
          `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`,
          fetchOptions,
        );
        if (!listRes.ok) throw new Error(`HTTP Error: ${listRes.status}`);

        const messages = await listRes.json();
        if (!messages || messages.length === 0) return [];

        return await Promise.all(
          messages.map(async (msg: any) => {
            const detailRes = await net.fetch(
              `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${msg.id}`,
              fetchOptions,
            );
            const detail = await detailRes.json();
            return {
              id: detail.id,
              from: detail.from,
              subject: detail.subject,
              body: detail.htmlBody || detail.textBody || "(无正文)",
              time: detail.date,
              unread: true,
              verified: detail.from
                .toLowerCase()
                .includes("digitalcombatsimulator"),
            };
          }),
        );
      }

      if (GUERRILLA_DOMAINS.includes(domain)) {
        const authRes = await net.fetch(
          `https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${login}&domain=${domain}`,
          fetchOptions,
        );
        const authData = await authRes.json();
        const sid = authData.sid_token;

        const listRes = await net.fetch(
          `https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=${sid}`,
          fetchOptions,
        );
        const listData = await listRes.json();

        const validMails = listData.list || [];
        if (validMails.length === 0) return [];

        return await Promise.all(
          validMails.map(async (msg: any) => {
            const detailRes = await net.fetch(
              `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${msg.mail_id}&sid_token=${sid}`,
              fetchOptions,
            );
            const detail = await detailRes.json();
            return {
              id: detail.mail_id,
              from: detail.mail_from,
              subject: detail.mail_subject,
              body: detail.mail_body,
              time: detail.mail_date,
              unread: true,
              verified: detail.mail_from
                .toLowerCase()
                .includes("digitalcombatsimulator"),
            };
          }),
        );
      }
    } catch (error: any) {
      throw error;
    }
    return [];
  });

  ipcMain.handle("open-url", (_, url: string) => {
    shell.openExternal(url);
  });
}

function createWindow() {
  // 定义图标路径（确保在 new BrowserWindow 之前声明）
  const iconPath = path.join(
    app.isPackaged ? path.dirname(app.getPath("exe")) : process.cwd(),
    "ico",
    "DCS-FlDO.ico",
  );

  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1100,
    frame: false,
    transparent: true,
    icon: iconPath, // 任务栏与窗口图标
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.setIcon(icon);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  // 设置 Windows 应用标识，确保任务栏独立显示指定图标
  app.setAppUserModelId("com.dcs.trialmanager");

  initDatabase();
  registerIpcHandlers();
  createWindow();

  ipcMain.on("window-min", () => mainWindow?.minimize());
  ipcMain.on("window-max", () => {
    if (mainWindow?.isMaximized()) mainWindow.restore();
    else mainWindow?.maximize();
  });
  ipcMain.on("window-close", () => mainWindow?.close());
  ipcMain.on("window-pin", (event, isPinned) =>
    mainWindow?.setAlwaysOnTop(isPinned),
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
