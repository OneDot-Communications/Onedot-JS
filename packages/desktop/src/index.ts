import { app, BrowserWindow, crashReporter, globalShortcut, ipcMain, Menu, powerMonitor, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { LinuxPlatform } from './linux';
import { MacOSPlatform } from './macos';
import { NativePlatform } from './native';
import { WindowsPlatform } from './windows';

export interface DesktopAppOptions {
  entryPoint: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  center?: boolean;
  title?: string;
  icon?: string;
  frame?: boolean;
  transparent?: boolean;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  focusable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  fullscreenable?: boolean;
  kiosk?: boolean;
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover';
  webPreferences?: Electron.WebPreferences;
  show?: boolean;
  backgroundColor?: string;
  enableLargerThanScreen?: boolean;
  hasShadow?: boolean;
  thickFrame?: boolean;
  vibrancy?: 'appearance-based' | 'light' | 'dark' | 'titlebar' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'medium-light' | 'ultra-dark';
  visualEffectState?: 'followWindow' | 'active' | 'inactive';
  autoHideMenuBar?: boolean;
  paintWhenInitiallyHidden?: boolean;
  acceptFirstMouse?: boolean;
  titleBarOverlay?: Electron.TitleBarOverlay;
  opacity?: number;
  useContentSize?: boolean;
  enableRemoteModule?: boolean;
  contextIsolation?: boolean;
  nodeIntegration?: boolean;
  sandbox?: boolean;
  preload?: string;
  protocol?: string;
  devTools?: boolean;
  menu?: Electron.MenuItemConstructorOptions[] | null;
  tray?: {
    icon: string;
    tooltip?: string;
    menu?: Electron.MenuItemConstructorOptions[];
  };
  globalShortcuts?: {
    accelerator: string;
    callback: () => void;
  }[];
  crashReporter?: {
    companyName: string;
    submitURL: string;
    productName?: string;
    uploadToServer?: boolean;
    compress?: boolean;
    extra?: Record<string, string>;
  };
}

export class DesktopApp {
  private mainWindow: Electron.BrowserWindow | null = null;
  private options: DesktopAppOptions;
  private platform: LinuxPlatform | MacOSPlatform | WindowsPlatform | NativePlatform;
  private isQuitting = false;
  private tray: Electron.Tray | null = null;

  constructor(options: DesktopAppOptions) {
    this.options = {
      width: 800,
      height: 600,
      center: true,
      title: 'ONEDOT App',
      frame: true,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      focusable: true,
      alwaysOnTop: false,
      fullscreen: false,
      fullscreenable: true,
      kiosk: false,
      titleBarStyle: 'default',
      show: true,
      backgroundColor: '#ffffff',
      enableLargerThanScreen: false,
      hasShadow: true,
      thickFrame: true,
      autoHideMenuBar: false,
      paintWhenInitiallyHidden: true,
      acceptFirstMouse: false,
      useContentSize: false,
      enableRemoteModule: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: true,
      menu: null,
      ...options
    };

    // Initialize platform-specific implementation
    this.initializePlatform();

    // Set up app event handlers
    this.setupAppHandlers();

    // Set up IPC handlers
    this.setupIPCHandlers();
  }

  private initializePlatform(): void {
    switch (process.platform) {
      case 'linux':
        this.platform = new LinuxPlatform();
        break;
      case 'darwin':
        this.platform = new MacOSPlatform();
        break;
      case 'win32':
        this.platform = new WindowsPlatform();
        break;
      default:
        this.platform = new NativePlatform();
    }
  }

  private setupAppHandlers(): void {
    // Handle before-quit
    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    // Handle window-all-closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin' || this.isQuitting) {
        app.quit();
      }
    });

    // Handle activate (macOS)
    app.on('activate', () => {
      if (this.mainWindow === null) {
        this.createWindow();
      }
    });

    // Handle will-quit
    app.on('will-quit', () => {
      // Unregister all shortcuts
      globalShortcut.unregisterAll();
    });

    // Set up crash reporter if options provided
    if (this.options.crashReporter) {
      crashReporter.start(this.options.crashReporter);
    }

    // Set up power monitor
    powerMonitor.on('shutdown', () => {
      app.quit();
    });

    // Set up protocol if provided
    if (this.options.protocol) {
      app.setAsDefaultProtocolClient(this.options.protocol);
    }
  }

  private setupIPCHandlers(): void {
    // Handle app info request
    ipcMain.handle('get-app-info', () => {
      return {
        name: app.getName(),
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch
      };
    });

    // Handle window state changes
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('close-window', () => {
      this.mainWindow?.close();
    });

    // Handle file operations
    ipcMain.handle('read-file', async (_, filePath: string) => {
      try {
        return fs.promises.readFile(filePath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read file: ${error}`);
      }
    });

    ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
      try {
        return fs.promises.writeFile(filePath, content, 'utf8');
      } catch (error) {
        throw new Error(`Failed to write file: ${error}`);
      }
    });

    // Handle dialog operations
    ipcMain.handle('show-open-dialog', async (_, options: Electron.OpenDialogOptions) => {
      const { dialog } = require('electron');
      return dialog.showOpenDialog(this.mainWindow!, options);
    });

    ipcMain.handle('show-save-dialog', async (_, options: Electron.SaveDialogOptions) => {
      const { dialog } = require('electron');
      return dialog.showSaveDialog(this.mainWindow!, options);
    });

    ipcMain.handle('show-message-box', async (_, options: Electron.MessageBoxOptions) => {
      const { dialog } = require('electron');
      return dialog.showMessageBox(this.mainWindow!, options);
    });

    // Handle system information
    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        versions: process.versions,
        cwd: process.cwd(),
        env: process.env,
        resourcesPath: process.resourcesPath
      };
    });

    // Handle screen information
    ipcMain.handle('get-screen-info', () => {
      const primaryDisplay = screen.getPrimaryDisplay();
      const allDisplays = screen.getAllDisplays();

      return {
        primary: primaryDisplay,
        all: allDisplays,
        cursorScreenPoint: screen.getCursorScreenPoint()
      };
    });
  }

  public createWindow(): Electron.BrowserWindow {
    // Create browser window
    this.mainWindow = new BrowserWindow({
      width: this.options.width,
      height: this.options.height,
      minWidth: this.options.minWidth,
      minHeight: this.options.minHeight,
      maxWidth: this.options.maxWidth,
      maxHeight: this.options.maxHeight,
      center: this.options.center,
      title: this.options.title,
      icon: this.options.icon,
      frame: this.options.frame,
      transparent: this.options.transparent,
      resizable: this.options.resizable,
      movable: this.options.movable,
      minimizable: this.options.minimizable,
      maximizable: this.options.maximizable,
      closable: this.options.closable,
      focusable: this.options.focusable,
      alwaysOnTop: this.options.alwaysOnTop,
      fullscreen: this.options.fullscreen,
      fullscreenable: this.options.fullscreenable,
      kiosk: this.options.kiosk,
      titleBarStyle: this.options.titleBarStyle,
      webPreferences: {
        ...this.options.webPreferences,
        preload: path.join(__dirname, 'preload.js'),
        sandbox: this.options.sandbox,
        contextIsolation: this.options.contextIsolation,
        nodeIntegration: this.options.nodeIntegration,
        enableRemoteModule: this.options.enableRemoteModule
      },
      show: this.options.show,
      backgroundColor: this.options.backgroundColor,
      enableLargerThanScreen: this.options.enableLargerThanScreen,
      hasShadow: this.options.hasShadow,
      thickFrame: this.options.thickFrame,
      vibrancy: this.options.vibrancy,
      visualEffectState: this.options.visualEffectState,
      autoHideMenuBar: this.options.autoHideMenuBar,
      paintWhenInitiallyHidden: this.options.paintWhenInitiallyHidden,
      acceptFirstMouse: this.options.acceptFirstMouse,
      titleBarOverlay: this.options.titleBarOverlay,
      opacity: this.options.opacity,
      useContentSize: this.options.useContentSize
    });

    // Load the entry point
    if (this.options.entryPoint.startsWith('http://') || this.options.entryPoint.startsWith('https://')) {
      this.mainWindow.loadURL(this.options.entryPoint);
    } else {
      this.mainWindow.loadFile(this.options.entryPoint);
    }

    // Set up menu if provided
    if (this.options.menu !== undefined) {
      const menu = Menu.buildFromTemplate(this.options.menu);
      Menu.setApplicationMenu(menu);
    }

    // Set up tray if provided
    if (this.options.tray) {
      this.setupTray();
    }

    // Set up global shortcuts if provided
    if (this.options.globalShortcuts) {
      this.setupGlobalShortcuts();
    }

    // Open DevTools if enabled
    if (this.options.devTools) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Apply platform-specific configurations
    this.platform.configureWindow(this.mainWindow);

    return this.mainWindow;
  }

  private setupTray(): void {
    if (!this.options.tray) return;

    const { Tray, Menu } = require('electron');
    this.tray = new Tray(this.options.tray.icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          this.mainWindow?.show();
        }
      },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    if (this.options.tray.menu) {
      const customMenu = Menu.buildFromTemplate(this.options.tray.menu);
      this.tray.setContextMenu(customMenu);
    } else {
      this.tray.setContextMenu(contextMenu);
    }

    if (this.options.tray.tooltip) {
      this.tray.setToolTip(this.options.tray.tooltip);
    }

    this.tray.on('click', () => {
      this.mainWindow?.isVisible() ? this.mainWindow.hide() : this.mainWindow?.show();
    });
  }

  private setupGlobalShortcuts(): void {
    if (!this.options.globalShortcuts) return;

    this.options.globalShortcuts.forEach(shortcut => {
      globalShortcut.register(shortcut.accelerator, shortcut.callback);
    });
  }

  public start(): void {
    app.whenReady().then(() => {
      this.createWindow();

      // Apply platform-specific startup configurations
      this.platform.onAppReady();
    });
  }

  public getWindow(): Electron.BrowserWindow | null {
    return this.mainWindow;
  }

  public quit(): void {
    this.isQuitting = true;
    app.quit();
  }

  public restart(): void {
    app.relaunch();
    app.exit(0);
  }

  public focus(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  }

  public hide(): void {
    this.mainWindow?.hide();
  }

  public show(): void {
    this.mainWindow?.show();
  }

  public minimize(): void {
    this.mainWindow?.minimize();
  }

  public maximize(): void {
    this.mainWindow?.maximize();
  }

  public unmaximize(): void {
    this.mainWindow?.unmaximize();
  }

  public fullscreen(): void {
    this.mainWindow?.setFullScreen(true);
  }

  public exitFullscreen(): void {
    this.mainWindow?.setFullScreen(false);
  }

  public setTitle(title: string): void {
    this.mainWindow?.setTitle(title);
  }

  public setIcon(icon: string): void {
    this.mainWindow?.setIcon(icon);
  }

  public setSize(width: number, height: boolean): void {
    this.mainWindow?.setSize(width, height);
  }

  public getPosition(): [number, number] | undefined {
    return this.mainWindow?.getPosition();
  }

  public setPosition(x: number, y: number): void {
    this.mainWindow?.setPosition(x, y);
  }

  public center(): void {
    this.mainWindow?.center();
  }

  public flashFrame(flag: boolean): void {
    this.mainWindow?.flashFrame(flag);
  }

  public setProgressBar(progress: number): void {
    this.mainWindow?.setProgressBar(progress);
  }

  public setBadgeCount(count: number): void {
    if (process.platform === 'darwin') {
      app.setBadgeCount(count);
    }
  }

  public setThemedIcon(icon: string): void {
    if (process.platform === 'darwin') {
      app.dock.setIcon(icon);
    }
  }

  public bounce(): void {
    if (process.platform === 'darwin') {
      app.dock.bounce();
    }
  }

  public cancelBounce(): void {
    if (process.platform === 'darwin') {
      app.dock.cancelBounce();
    }
  }

  public setUserActivity(type: string, userInfo: Record<string, any>): void {
    if (process.platform === 'darwin') {
      app.setAboutPanelOptions({ type, ...userInfo });
    }
  }

  public invalidateUserActivity(): void {
    if (process.platform === 'darwin') {
      app.setAboutPanelOptions({ type: undefined });
    }
  }
}

// Factory function to create a desktop app
export function createDesktopApp(options: DesktopAppOptions): DesktopApp {
  return new DesktopApp(options);
}

// Platform-specific implementations
export { LinuxPlatform } from './linux';
export { MacOSPlatform } from './macos';
export { NativePlatform } from './native';
export { WindowsPlatform } from './windows';

