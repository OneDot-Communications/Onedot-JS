/**
 * Advanced ONEDOT-JS Application Template
 *
 * This template provides a starting point for building advanced applications
 * with the ONEDOT-JS framework, including routing, state management,
 * and performance optimization.
 */

import { Component } from '@onedot/core';
import { createRoot } from '@onedot/web';
import { BrowserRouter, Routes, Route } from '@onedot/web/router';
import { PerformanceManager } from '@onedot/performance';
import { PluginSystem } from '@onedot/plugins';
import { create } from 'zustand';

// Import components
import { App } from './components/App';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';

// Import styles
import './styles/index.css';

// Define types
interface AppState {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  theme: 'light' | 'dark';
  isLoading: boolean;
}

// Create Zustand store
const useAppStore = create<AppState>((set) => ({
  user: null,
  theme: 'light',
  isLoading: false,
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  setLoading: (isLoading) => set({ isLoading })
}));

// Performance monitoring
const performanceManager = PerformanceManager.getInstance();
performanceManager.setEnabled(true);

// Plugin system
const pluginSystem = PluginSystem.getInstance();

// Register plugins
pluginSystem.loadExamplePlugins();

// Custom performance plugin
const customPlugin = {
  name: 'customPlugin',
  version: '1.0.0',
  description: 'Custom performance plugin',
  hooks: {
    'beforeRender': (context) => {
      console.log('Before render hook:', context);
    },
    'afterRender': (context) => {
      console.log('After render hook:', context);
    }
  }
};

pluginSystem.registerPlugin(customPlugin);

// Main application component
const AdvancedApp: Component = () => {
  const { theme, setTheme } = useAppStore();

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`app ${theme}`}>
      <BrowserRouter>
        <App onThemeToggle={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

// Create and render the application
const root = createRoot(document.getElementById('root')!);
root.render(<AdvancedApp />);

// Export for testing
export { AdvancedApp, useAppStore };

// Enable hot module replacement
if (module.hot) {
  module.hot.accept();
}
