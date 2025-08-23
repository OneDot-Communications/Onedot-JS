/**
 * Basic ONEDOT-JS Application Template
 *
 * This template provides a simple starting point for building applications
 * with the ONEDOT-JS framework.
 */

import { Component } from '@onedot/core';
import { createRoot } from '@onedot/web';

// Import styles
import './styles/index.css';

// Define a simple component
const HelloWorld: Component = () => {
  return (
    <div className="container">
      <h1>Hello, ONEDOT-JS!</h1>
      <p>Welcome to your new application built with the ONEDOT-JS framework.</p>
      <button onClick={() => alert('Button clicked!')}>
        Click me
      </button>
    </div>
  );
};

// Create and render the application
const root = createRoot(document.getElementById('root')!);
root.render(<HelloWorld />);

// Export for testing
export { HelloWorld };

// Enable hot module replacement
if (module.hot) {
  module.hot.accept();
}
