import { render } from '@onedot/core';
import { App } from './App';
import './styles/globals.css';

// Mount the application
const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Could not find app element');
}

render(App, appElement);
