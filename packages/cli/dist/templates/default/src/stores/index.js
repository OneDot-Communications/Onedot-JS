import { signal, computed } from '@onedot/core';

// User store example
interface User {
  id: string | null;
  name: string;
  email: string;
  avatar?: string;
}

export const user = signal<User>({
  id: null,
  name: '',
  email: '',
});

export const isLoggedIn = computed(() => user.value.id !== null);

export const userDisplayName = computed(() => {
  const currentUser = user.value;
  return currentUser.name || currentUser.email || 'Guest';
});

// Theme store example
export type Theme = 'light' | 'dark' | 'auto';

export const theme = signal<Theme>('auto');

export const isDarkMode = computed(() => {
  if (theme.value === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return theme.value === 'dark';
});

// App settings store
interface AppSettings {
  sidebarOpen: boolean;
  notifications: boolean;
  language: string;
  debugMode: boolean;
}

export const appSettings = signal<AppSettings>({
  sidebarOpen: false,
  notifications: true,
  language: 'en',
  debugMode: false,
});

// Actions for user store
export const userActions = {
  login: (userData: Omit<User, 'id'> & { id: string }) => {
    user.value = userData;
    console.log('User logged in:', userData.name);
  },
  
  logout: () => {
    user.value = {
      id: null,
      name: '',
      email: '',
    };
    console.log('User logged out');
  },
  
  updateProfile: (updates: Partial<User>) => {
    user.value = { ...user.value, ...updates };
    console.log('Profile updated:', updates);
  },
};

// Actions for theme store
export const themeActions = {
  setTheme: (newTheme: Theme) => {
    theme.value = newTheme;
    console.log('Theme changed to:', newTheme);
  },
  
  toggleTheme: () => {
    const currentTheme = theme.value;
    if (currentTheme === 'light') {
      theme.value = 'dark';
    } else if (currentTheme === 'dark') {
      theme.value = 'light';
    } else {
      // If auto, toggle to opposite of current system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.value = systemPrefersDark ? 'light' : 'dark';
    }
    console.log('Theme toggled to:', theme.value);
  },
};

// Actions for app settings
export const settingsActions = {
  toggleSidebar: () => {
    appSettings.value = {
      ...appSettings.value,
      sidebarOpen: !appSettings.value.sidebarOpen,
    };
  },
  
  toggleNotifications: () => {
    appSettings.value = {
      ...appSettings.value,
      notifications: !appSettings.value.notifications,
    };
  },
  
  setLanguage: (language: string) => {
    appSettings.value = {
      ...appSettings.value,
      language,
    };
  },
  
  toggleDebugMode: () => {
    appSettings.value = {
      ...appSettings.value,
      debugMode: !appSettings.value.debugMode,
    };
  },
};
