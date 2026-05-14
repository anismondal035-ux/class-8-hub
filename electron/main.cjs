const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

// Live site URL — desktop app loads the same website so AI + daily content keep working.
const SITE_URL = process.env.CLASS8B_URL || "https://project--b28d15c0-fced-4892-b232-d14db21db165.lovable.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "Class 8 B",
    backgroundColor: "#0b0b14",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(SITE_URL);

  // Open external links in the user's default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(SITE_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
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
