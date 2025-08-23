import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class LinuxPlatform {
	private appMenu: Electron.Menu | null = null;
	private trayIcon: string | null = null;

	public configureWindow(window: BrowserWindow): void {
		// Linux-specific window configurations
		window.setRepresentedFilename(path.resolve(__dirname, '../../'));
		window.setDocumentEdited(false);

		// Set window icon if available
		const iconPath = path.join(__dirname, 'assets', 'icon.png');
		if (fs.existsSync(iconPath)) {
			window.setIcon(iconPath);
		}
	}

	public onAppReady(): void {
		// Linux-specific app ready configurations
		this.setupLinuxSpecifics();
	}

	private setupLinuxSpecifics(): void {
		// Set up Linux-specific features
		try {
			// Attempt to set the app icon in the dock
			const iconPath = path.join(__dirname, 'assets', 'icon.png');
			if (fs.existsSync(iconPath)) {
				// This would require additional native modules for Linux
			}
		} catch (error) {
			console.error('Failed to set up Linux-specific features:', error);
		}
	}

	public setTrayIcon(iconPath: string): void {
		this.trayIcon = iconPath;
	}

	public getTrayIcon(): string | null {
		return this.trayIcon;
	}

	public setAppMenu(menu: Electron.Menu): void {
		this.appMenu = menu;
	}

	public getAppMenu(): Electron.Menu | null {
		return this.appMenu;
	}

	public showNotification(title: string, body: string): void {
		// Linux notification implementation
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
		// Linux doesn't have a native badge count API
		console.log(`Badge count set to: ${count}`);
	}

	public setProgressBar(progress: number): void {
		// Linux doesn't have a native progress bar API
		console.log(`Progress set to: ${progress}`);
	}

	public setUserActivity(type: string, userInfo: Record<string, any>): void {
		// Linux doesn't have a native user activity API
		console.log(`User activity set: ${type}`, userInfo);
	}

	public invalidateUserActivity(): void {
		// Linux doesn't have a native user activity API
		console.log('User activity invalidated');
	}
}
