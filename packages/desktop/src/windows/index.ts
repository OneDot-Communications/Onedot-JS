import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class WindowsPlatform {
	private jumpList: Electron.JumpListCategory[] = [];
	private taskbar: Electron.Taskbar | null = null;
	private thumbBarButtons: Electron.ThumbBarButton[] = [];

	public configureWindow(window: BrowserWindow): void {
		// Windows-specific window configurations
		window.setRepresentedFilename(path.resolve(__dirname, '../../'));
		window.setDocumentEdited(false);

		// Set window icon if available
		const iconPath = path.join(__dirname, 'assets', 'icon.ico');
		if (fs.existsSync(iconPath)) {
			window.setIcon(iconPath);
		}

		// Set up taskbar
		this.setupTaskbar(window);

		// Set up jump list
		this.setupJumpList();
	}

	public onAppReady(): void {
		// Windows-specific app ready configurations
		this.setupWindowsSpecifics();
	}

	private setupWindowsSpecifics(): void {
		// Set up Windows-specific features
		try {
			// Set app user model ID
			app.setAppUserModelId(app.getName());

			// Set up taskbar
			this.taskbar = app.getTaskbar();
		} catch (error) {
			console.error('Failed to set up Windows-specific features:', error);
		}
	}

	private setupTaskbar(window: BrowserWindow): void {
		try {
			if (this.taskbar) {
				// Set overlay icon
				const overlayIconPath = path.join(__dirname, 'assets', 'overlay.ico');
				if (fs.existsSync(overlayIconPath)) {
					this.taskbar.setOverlayIcon(overlayIconPath, 'Status');
				}

				// Set progress bar
				this.taskbar.setProgress(0);
			}
		} catch (error) {
			console.error('Failed to set up taskbar:', error);
		}
	}

	private setupJumpList(): void {
		try {
			this.jumpList = [
				{
					name: 'Recent',
					type: 'recent'
				},
				{
					name: 'Tasks',
					type: 'tasks',
					items: [
						{
							type: 'task',
							title: 'New Window',
							description: 'Create a new window',
							program: process.execPath,
							args: '--new-window',
							iconPath: process.execPath,
							iconIndex: 0
						},
						{
							type: 'task',
							title: 'Preferences',
							description: 'Open application preferences',
							program: process.execPath,
							args: '--preferences',
							iconPath: process.execPath,
							iconIndex: 0
						}
					]
				}
			];

			app.setJumpList(this.jumpList);
		} catch (error) {
			console.error('Failed to set up jump list:', error);
		}
	}

	public setJumpList(jumpList: Electron.JumpListCategory[]): void {
		this.jumpList = jumpList;
		app.setJumpList(jumpList);
	}

	public getJumpList(): Electron.JumpListCategory[] {
		return this.jumpList;
	}

	public setThumbBarButtons(window: BrowserWindow, buttons: Electron.ThumbBarButton[]): void {
		this.thumbBarButtons = buttons;
		window.setThumbarButtons(buttons);
	}

	public getThumbBarButtons(): Electron.ThumbBarButton[] {
		return this.thumbBarButtons;
	}

	public showNotification(title: string, body: string): void {
		// Windows notification implementation
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
		// Windows doesn't have a native badge count API
		console.log(`Badge count set to: ${count}`);
	}

	public setProgressBar(progress: number): void {
		if (this.taskbar) {
			this.taskbar.setProgress(progress);
		}
	}

	public setUserActivity(type: string, userInfo: Record<string, any>): void {
		// Windows doesn't have a native user activity API
		console.log(`User activity set: ${type}`, userInfo);
	}

	public invalidateUserActivity(): void {
		// Windows doesn't have a native user activity API
		console.log('User activity invalidated');
	}

	public setOverlayIcon(iconPath: string, description: string): void {
		if (this.taskbar) {
			this.taskbar.setOverlayIcon(iconPath, description);
		}
	}

	public flashFrame(flag: boolean): void {
		if (this.taskbar) {
			this.taskbar.highlightIcon(flag);
		}
	}
}
