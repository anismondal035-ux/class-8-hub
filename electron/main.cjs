const { app, BrowserWindow, shell, Menu, dialog } = require("electron");
const path = require("path");

// Load the live website so daily content + AI keep working.
// Use the stable published URL (immutable, won't break if project is renamed).
const SITE_URL = process.env.CLASS8B_URL || "https://class8-b.lovable.app";
const FALLBACK_URL = "https://project--b28d15c0-fced-4892-b232-d14db21db165.lovable.app";

function splashHtml(message) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <html><head><meta charset="utf-8"><title>Class 8 B</title>
    <style>
      html,body{margin:0;height:100%;background:#0b0b14;color:#ede9fe;font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}
      .logo{font-size:42px;font-weight:800;background:linear-gradient(135deg,#a855f7,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.02em}
      .sub{margin-top:8px;color:#a1a1aa;font-size:14px}
      .spin{margin-top:24px;width:36px;height:36px;border-radius:50%;border:3px solid #27272a;border-top-color:#a855f7;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      .msg{margin-top:16px;color:#e4e4e7;font-size:13px;max-width:420px;padding:0 24px}
      button{margin-top:16px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white;border:0;padding:10px 20px;border-radius:10px;font-weight:600;cursor:pointer}
    </style></head><body>
      <div class="logo">Class 8 B</div>
      <div class="sub">Delhi Public Secondary School</div>
      <div class="spin"></div>
      <div class="msg">${message}</div>
    </body></html>
  `)}`;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "Class 8 B",
    backgroundColor: "#0b0b14",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Splash first so the user never sees a black window.
  win.loadURL(splashHtml("Loading Class 8 B…"));

  const tryLoad = async (url, attempt = 1) => {
    try {
      await win.loadURL(url);
    } catch (err) {
      if (attempt < 3) {
        setTimeout(() => tryLoad(url, attempt + 1), 1500);
      } else if (url !== FALLBACK_URL) {
        tryLoad(FALLBACK_URL);
      } else {
        win.loadURL(splashHtml(
          "Couldn't reach the Class 8 B website. Check your internet connection and try again."
        ));
      }
    }
  };

  // Give the splash a moment, then load the real site.
  setTimeout(() => tryLoad(SITE_URL), 300);

  win.webContents.on("did-fail-load", (_e, code, desc, validatedURL) => {
    // -3 (ABORTED) fires on normal in-page navigation; ignore.
    if (code === -3) return;
    win.loadURL(splashHtml(
      `Failed to load (${desc}). Retrying…<br><br><button onclick="location.href='${SITE_URL}'">Retry now</button>`
    ));
    setTimeout(() => tryLoad(SITE_URL), 3000);
  });

  win.webContents.on("render-process-gone", (_e, details) => {
    dialog.showErrorBox("Class 8 B", `The app crashed (${details.reason}). Reopening…`);
    win.reload();
  });

  // Open external links in the user's default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const target = new URL(SITE_URL);
      if (u.host !== target.host) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    } catch { /* fall through */ }
    return { action: "allow" };
  });
}

Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
