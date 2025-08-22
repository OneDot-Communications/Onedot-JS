import { h, Component } from '@onedot/core';
import { Router } from '@onedot/runtime';
import './App.css';

export const App: Component = () => {
  return h('div', { className: 'app' },
    h('header', { className: 'app-header' },
      h('img', { 
        src: '/onedot.svg', 
        className: 'logo', 
        alt: 'ONEDOT' 
      }),
      h('h1', {}, 'Welcome to ONEDOT'),
      h('p', { className: 'subtitle' }, 
        'A modern reactive framework for building web applications'
      )
    ),
    h('main', { className: 'app-main' },
      h(Router, {}) // File-based routing automatically configured
    )
  );
};
