import { app, BrowserWindow, Menu } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class MacOSPlatform {
	private dockMenu: Electron.Menu | null = null;
	private touchBar: Electron.TouchBar | null = null;
	private userActivity: any = null;

	public configureWindow(window: BrowserWindow): void {
		// macOS-specific window configurations
		window.setRepresentedFilename(path.resolve(__dirname, '../../'));
		window.setDocumentEdited(false);

		// Set window vibrancy if supported
		if (BrowserWindow.isVibrancySupported()) {
			window.setVibrancy('dark');
		}

		// Set window title bar style
		window.setTitleBarStyle('hiddenInset');

		// Set window icon if available
		const iconPath = path.join(__dirname, 'assets', 'icon.icns');
		if (fs.existsSync(iconPath)) {
			window.setIcon(iconPath);
		}
	}

	public onAppReady(): void {
		// macOS-specific app ready configurations
		this.setupMacOSSpecifics();
	}

	private setupMacOSSpecifics(): void {
		// Set up dock menu
		this.setupDockMenu();

		// Set up touch bar if available
		if (process.platform === 'darwin' && typeof TouchBar !== 'undefined') {
			this.setupTouchBar();
		}

		// Set up app activation policy
		app.setActivationPolicy('regular');

		// Set up app about panel
		app.setAboutPanelOptions({
			applicationName: app.getName(),
			applicationVersion: app.getVersion(),
			copyright: 'Copyright © 2023 ONEDOT-JS Team',
			credits: 'ONEDOT-JS Framework',
			version: app.getVersion()
		});
	}

	private setupDockMenu(): void {
		const dockMenuTemplate: Electron.MenuItemConstructorOptions[] = [
			{
				label: 'New Window',
				click() {
					// Create a new window
				}
			},
			{
				label: 'Preferences...',
				click() {
					// Open preferences
				}
			}
		];

		this.dockMenu = Menu.buildFromTemplate(dockMenuTemplate);
		app.dock.setMenu(this.dockMenu);
	}

	private setupTouchBar(): void {
		try {
			const { TouchBar, TouchBarButton, TouchBarLabel } = require('electron');

			const button = new TouchBarButton({
				label: 'Click me',
				backgroundColor: '#7851A9',
				click: () => {
					console.log('TouchBar button clicked');
				}
			});

			const label = new TouchBarLabel({
				label: 'ONEDOT-JS',
				textColor: '#ffffff'
			});

			this.touchBar = new TouchBar({
				items: [label, button]
			});
		} catch (error) {
			console.error('Failed to set up TouchBar:', error);
		}
	}

	public setDockMenu(menu: Electron.Menu): void {
		this.dockMenu = menu;
		app.dock.setMenu(menu);
	}

	public getDockMenu(): Electron.Menu | null {
		return this.dockMenu;
	}

	public setTouchBar(touchBar: Electron.TouchBar): void {
		this.touchBar = touchBar;
	}

	public getTouchBar(): Electron.TouchBar | null {
		return this.touchBar;
	}

	public showNotification(title: string, body: string): void {
		// macOS notification implementation
		try {
			const { Notification } = require('electron');
			new Notification({ title, body }).show();
		} catch (error) {
			console.error('Failed to show notification:', error);
		}
	}

	public registerGlobalShortcut(accelerator: string, callback: () => void): boolean {
		try {
			const { globalShortcut } = require('electron');
			return globalShortcut.register(accelerator, callback);
		} catch (error) {
			console.error('Failed to register global shortcut:', error);
			return false;
		}
	}

	public unregisterGlobalShortcut(accelerator: string): void {
		try {
			const { globalShortcut } = require('electron');
			globalShortcut.unregister(accelerator);
		} catch (error) {
			console.error('Failed to unregister global shortcut:', error);
		}
	}

	public setBadgeCount(count: number): void {
		app.setBadgeCount(count);
	}

	public setProgressBar(progress: number): void {
		// macOS doesn't have a native progress bar API for the app icon
		console.log(`Progress set to: ${progress}`);
	}

	public bounce(): void {
		app.dock.bounce();
	}

	public cancelBounce(): void {
		app.dock.cancelBounce();
	}

	public setUserActivity(type: string, userInfo: Record<string, any>): void {
		this.userActivity = { type, userInfo };
		app.setAboutPanelOptions({ type, ...userInfo });
	}

	public invalidateUserActivity(): void {
		this.userActivity = null;
		app.setAboutPanelOptions({ type: undefined });
	}

	public setThemedIcon(icon: string): void {
		app.dock.setIcon(icon);
	}
}
