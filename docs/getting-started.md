# 🚀 Getting Started - ONEDOT Framework

Welcome to ONEDOT! This guide will help you create your first ONEDOT application and understand the core concepts. You'll be building modern, reactive web applications in minutes.

## 📋 Prerequisites

Before getting started, make sure you have:

- **Node.js** 18.0.0 or later
- **npm** 7.0.0 or later (or **yarn** 1.22.0+, **pnpm** 6.0.0+)
- A modern code editor (VS Code recommended)

### Check Your Environment

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check npm version
npm --version
# Should output 7.0.0 or higher
```

## ⚡ Quick Start

### 1. Install the CLI

```bash
# Install ONEDOT CLI globally
npm install -g @onedot/cli

# Verify installation
onedot --version
```

### 2. Create Your First App

```bash
# Create a new project with default template
onedot create my-first-app

# Navigate to the project
cd my-first-app

# Install dependencies (if not already done)
npm install
```

The `onedot create` command automatically sets up a complete project structure similar to Vite, but optimized for ONEDOT Framework:

### 3. Start Development Server

```bash
# Start the development server
npm run dev

# Or using the CLI directly
onedot dev
```

Your app will be available at `http://localhost:3000` 🎉

## 🏗️ Generated Project Structure

When you run `onedot create my-first-app`, you'll get a complete, production-ready project structure:

```
my-first-app/
│   .gitignore                 # Git ignore rules
│   eslint.config.js           # ESLint configuration
│   index.html                 # Main HTML entry point
│   package.json               # Dependencies and scripts
│   README.md                  # Project documentation
│   tsconfig.app.json          # TypeScript app configuration
│   tsconfig.json              # TypeScript base configuration
│   tsconfig.node.json         # TypeScript Node.js configuration
│   onedot.config.ts           # ONEDOT framework configuration
│
├───public/                    # Static assets
│       onedot.svg             # ONEDOT framework logo
│       favicon.ico            # App favicon
│
└───src/                       # Source code
    │   App.css                # Main app styles
    │   App.tsx                # Main app component
    │   index.css              # Global styles
    │   main.tsx               # Application entry point
    │   onedot-env.d.ts        # ONEDOT type definitions
    │
    ├───assets/                # Static assets for bundling
    │       onedot-logo.svg    # ONEDOT logo asset
    │
    ├───components/            # Reusable components
    │   └───ui/                # UI component library
    │           Button.tsx     # Example button component
    │           Card.tsx       # Example card component
    │
    ├───pages/                 # File-based routing pages
    │       index.tsx          # Home page (/)
    │       about.tsx          # About page (/about)
    │
    ├───stores/                # State management
    │       appStore.ts        # Global app store
    │
    └───utils/                 # Utility functions
            helpers.ts         # Common helper functions
```

### 📦 Ready-to-Use Template Features

The generated template includes:

✅ **Modern Development Setup**
- TypeScript configuration with strict mode
- ESLint with ONEDOT-specific rules
- Hot Module Replacement (HMR) ready
- VS Code settings for optimal development

✅ **Production-Ready Configuration**
- Optimized build configuration
- Tree-shaking and code splitting
- Source maps for debugging
- Environment variable support

✅ **Example Components**
- Styled Button and Card components
- Navigation and layout examples
- Form handling demonstrations
- State management patterns

✅ **Best Practices Built-in**
- Proper TypeScript types
- Component organization
- File naming conventions
- Import/export patterns

Your new ONEDOT project will have this structure:

```
my-first-app/
├── 📁 src/                    # Source code
│   ├── 📁 pages/              # File-based routing
│   │   ├── index.ts           # Home page (/)
│   │   └── about.ts           # About page (/about)
│   ├── 📁 components/         # Reusable components
│   │   └── 📁 ui/             # UI components
│   │       └── Button.ts      # Example button component
│   ├── 📁 styles/             # Global styles
│   │   └── globals.ts         # Global CSS-in-JS styles
│   └── app.ts                 # Main app component
│
├── 📁 public/                 # Static assets
│   ├── favicon.ico            # App favicon
│   └── logo.svg               # App logo
│
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── onedot.config.js           # ONEDOT configuration
└── README.md                  # Project documentation
```

### 🎯 Generated Template Content

The template includes working examples right out of the box:

**📱 Main App Component** (`src/App.tsx`)
```typescript
import { h, Component } from '@onedot/core';
import { Router } from '@onedot/router';
import './App.css';

export const App: Component = () => {
  return h('div', { className: 'app' },
    h('header', { className: 'app-header' },
      h('img', { src: '/onedot.svg', className: 'logo', alt: 'ONEDOT' }),
      h('h1', {}, 'Welcome to ONEDOT')
    ),
    h(Router, {}) // File-based routing automatically configured
  );
};
```

**🏠 Home Page** (`src/pages/index.tsx`) 
```typescript
import { h, useState } from '@onedot/core';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function HomePage() {
  const [count, setCount] = useState(0);

  return h('div', { className: 'home-page' },
    h('h2', {}, 'Interactive Demo'),
    
    h(Card, {},
      h('h3', {}, `Count: ${count}`),
      h('div', { className: 'button-group' },
        h(Button, { 
          variant: 'secondary',
          onClick: () => setCount(count - 1)
        }, 'Decrease'),
        h(Button, { 
          onClick: () => setCount(count + 1)
        }, 'Increase'),
        h(Button, { 
          variant: 'outline',
          onClick: () => setCount(0)
        }, 'Reset')
      )
    ),
    
    h('section', { className: 'features' },
      h('h3', {}, 'Framework Features'),
      h('div', { className: 'feature-grid' },
        h(Card, {},
          h('h4', {}, '⚡ Reactive'),
          h('p', {}, 'Fine-grained reactivity with signals')
        ),
        h(Card, {},
          h('h4', {}, '🧭 Routed'),
          h('p', {}, 'File-based routing system')
        ),
        h(Card, {},
          h('h4', {}, '🎨 Styled'),
          h('p', {}, 'CSS-in-JS with theming')
        )
      )
    )
  );
}
```

**🧩 UI Components** (`src/components/ui/Button.tsx`)
```typescript
import { h, Component, css } from '@onedot/core';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: any;
}

const buttonStyles = css({
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variants: {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      '&:hover': { backgroundColor: '#2563eb' },
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
      '&:hover': { backgroundColor: '#4b5563' },
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
      '&:hover': { backgroundColor: '#eff6ff' },
    },
  },
});

export const Button: Component<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children 
}) => {
  return h('button', {
    className: buttonStyles({ variant, size }),
    disabled,
    onClick: disabled ? undefined : onClick,
  }, children);
};
```

**🎨 Styling** (`src/App.css`)
```css
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Inter', system-ui, sans-serif;
}

.app-header {
  text-align: center;
  padding: 2rem;
}

.logo {
  height: 4rem;
  margin-bottom: 1rem;
}

.home-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.features {
  margin-top: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
```

```typescript
// src/components/ui/Button.ts
import { h, Component, css } from '@onedot/core';

// Define component props with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: any;
}

// Create styled component using CSS-in-JS
const buttonStyles = css({
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    fontSize: '14px',
  },
  
  variants: {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2563eb',
      },
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      '&:hover': {
        backgroundColor: '#e5e7eb',
      },
    },
  },
  
  sizes: {
    sm: { padding: '4px 8px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 20px', fontSize: '16px' },
  },
  
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

// Define the component
export const Button: Component<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick,
  children 
}) => {
  return h('button', {
    className: buttonStyles({ variant, size, disabled }),
    disabled,
    onClick: disabled ? undefined : onClick,
  }, children);
};
```

## 📄 Your First Page

Now let's update the home page. Open `src/pages/index.ts`:

```typescript
// src/pages/index.ts
import { h, useState, useEffect } from '@onedot/core';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  // Reactive state using signals
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Welcome to ONEDOT!');

  // Effect hook for side effects
  useEffect(() => {
    document.title = `Count: ${count} - ONEDOT App`;
  }, [count]);

  // Event handlers
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => {
    setCount(0);
    setMessage('Counter reset!');
  };

  return h('div', { 
    style: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }
  },
    // Header
    h('header', {},
      h('h1', { 
        style: { 
          fontSize: '3rem', 
          marginBottom: '8px',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }
      }, '🔥 ONEDOT Framework'),
      h('p', { 
        style: { 
          fontSize: '1.2rem', 
          color: '#6b7280',
          marginBottom: '40px',
        }
      }, message)
    ),

    // Counter Section
    h('section', { 
      style: { 
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '40px',
        marginBottom: '40px',
      }
    },
      h('h2', { 
        style: { marginBottom: '20px' }
      }, 'Interactive Counter'),
      
      h('div', { 
        style: { 
          fontSize: '4rem', 
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '30px',
        }
      }, count),
      
      h('div', { 
        style: { 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          flexWrap: 'wrap',
        }
      },
        h(Button, { 
          variant: 'secondary', 
          onClick: decrement 
        }, '−'),
        
        h(Button, { 
          variant: 'primary', 
          onClick: increment 
        }, '+'),
        
        h(Button, { 
          variant: 'secondary', 
          onClick: reset 
        }, 'Reset')
      )
    ),

    // Features Section
    h('section', {},
      h('h2', { 
        style: { marginBottom: '30px' }
      }, '✨ Framework Features'),
      
      h('div', { 
        style: { 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          textAlign: 'left',
        }
      },
        h('div', { 
          style: { 
            padding: '20px', 
            backgroundColor: '#ecfdf5',
            borderRadius: '8px',
          }
        },
          h('h3', { style: { marginBottom: '8px' } }, '⚡ Reactive'),
          h('p', { style: { color: '#6b7280' } }, 
            'Fine-grained reactivity with signals and computed values'
          )
        ),
        
        h('div', { 
          style: { 
            padding: '20px', 
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
          }
        },
          h('h3', { style: { marginBottom: '8px' } }, '🎨 Styled'),
          h('p', { style: { color: '#6b7280' } }, 
            'CSS-in-JS with theming and responsive design'
          )
        ),
        
        h('div', { 
          style: { 
            padding: '20px', 
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
          }
        },
          h('h3', { style: { marginBottom: '8px' } }, '🧭 Routed'),
          h('p', { style: { color: '#6b7280' } }, 
            'File-based routing with dynamic parameters'
          )
        )
      )
    ),

    // Footer
    h('footer', { 
      style: { 
        marginTop: '60px', 
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb',
        color: '#6b7280',
      }
    },
      h('p', {}, 'Built with ❤️ using ONEDOT Framework'),
      h('p', { style: { marginTop: '10px' } },
        'Edit ', 
        h('code', { 
          style: { 
            backgroundColor: '#f3f4f6',
            padding: '2px 6px',
            borderRadius: '4px',
          }
        }, 'src/pages/index.ts'),
        ' to get started!'
      )
    )
  );
}
```

## 🧭 Adding a New Page

Let's add an about page. Create `src/pages/about.ts`:

```typescript
// src/pages/about.ts
import { h } from '@onedot/core';
import { Button } from '../components/ui/Button';

export default function AboutPage() {
  const goHome = () => {
    window.location.href = '/';
  };

  return h('div', { 
    style: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
    }
  },
    h('h1', { 
      style: { 
        fontSize: '2.5rem', 
        marginBottom: '20px',
        textAlign: 'center',
      }
    }, 'About ONEDOT'),
    
    h('p', { 
      style: { 
        fontSize: '1.1rem', 
        lineHeight: '1.6',
        marginBottom: '20px',
      }
    }, 
      'ONEDOT is a next-generation reactive JavaScript framework designed for modern web development. ' +
      'It combines the best parts of popular frameworks with innovative approaches to reactivity, ' +
      'routing, and styling.'
    ),
    
    h('h2', { 
      style: { marginTop: '30px', marginBottom: '15px' }
    }, 'Key Features:'),
    
    h('ul', { 
      style: { 
        lineHeight: '1.8',
        marginBottom: '30px',
      }
    },
      h('li', {}, 'Fine-grained reactivity system'),
      h('li', {}, 'File-based routing'),
      h('li', {}, 'CSS-in-JS styling'),
      h('li', {}, 'TypeScript-first development'),
      h('li', {}, 'Zero-config setup'),
      h('li', {}, 'Server-side rendering support')
    ),
    
    h('div', { style: { textAlign: 'center' } },
      h(Button, { onClick: goHome }, '← Back to Home')
    )
  );
}
```

Now you can navigate to `http://localhost:3000/about` to see your new page!

## 📦 Using NPM Packages

You can use any npm package with ONEDOT. Let's add a popular utility library:

```bash
# Install a utility library
npm install date-fns

# Install type definitions (if using TypeScript)
npm install @types/date-fns --save-dev
```

Then use it in your components:

```typescript
// src/pages/index.ts
import { h, useState } from '@onedot/core';
import { format } from 'date-fns';

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const updateTime = () => {
    setCurrentTime(new Date());
  };

  return h('div', {},
    h('h1', {}, 'Current Time'),
    h('p', {}, format(currentTime, 'PPpp')),
    h('button', { onClick: updateTime }, 'Update Time')
  );
}
```

## 🎨 Styling Your App

ONEDOT includes a powerful CSS-in-JS system. Let's create some global styles:

```typescript
// src/styles/globals.ts
import { createGlobalStyles } from '@onedot/style';

export const globalStyles = createGlobalStyles({
  '*': {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  
  'html, body': {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1.6,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  
  'h1, h2, h3, h4, h5, h6': {
    fontWeight: 600,
    lineHeight: 1.2,
  },
  
  'a': {
    color: '#3b82f6',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  
  'button': {
    fontFamily: 'inherit',
  },
});
```

Apply global styles in your main app file:

```typescript
// src/app.ts
import { h, render } from '@onedot/core';
import { Router } from '@onedot/router';
import { globalStyles } from './styles/globals';

// Apply global styles
globalStyles();

// Set up your app
function App() {
  return h(Router, {});
}

// Mount the app
const appElement = document.getElementById('app');
if (appElement) {
  render(h(App), appElement);
}
```

## 🧪 Adding Interactivity

Let's create a more interactive component with form handling:

```typescript
// src/components/ContactForm.ts
import { h, useState, Component } from '@onedot/core';
import { Button } from './ui/Button';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export const ContactForm: Component = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: keyof FormData) => (event: Event) => {
    const target = event.target as HTMLInputElement;
    setFormData({
      ...formData,
      [field]: target.value,
    });
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return h('div', { 
      style: { 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#ecfdf5',
        borderRadius: '8px',
      }
    },
      h('h2', {}, '✅ Thank you!'),
      h('p', {}, 'Your message has been sent successfully.'),
      h(Button, { 
        onClick: () => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', message: '' });
        }
      }, 'Send Another Message')
    );
  }

  return h('form', { 
    onSubmit: handleSubmit,
    style: { 
      maxWidth: '400px', 
      margin: '0 auto',
      padding: '20px',
    }
  },
    h('h2', { 
      style: { marginBottom: '20px', textAlign: 'center' }
    }, 'Contact Us'),
    
    h('div', { style: { marginBottom: '15px' } },
      h('label', { 
        style: { 
          display: 'block', 
          marginBottom: '5px',
          fontWeight: '500',
        }
      }, 'Name'),
      h('input', {
        type: 'text',
        value: formData.name,
        onChange: handleInputChange('name'),
        required: true,
        style: {
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
        },
      })
    ),
    
    h('div', { style: { marginBottom: '15px' } },
      h('label', { 
        style: { 
          display: 'block', 
          marginBottom: '5px',
          fontWeight: '500',
        }
      }, 'Email'),
      h('input', {
        type: 'email',
        value: formData.email,
        onChange: handleInputChange('email'),
        required: true,
        style: {
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
        },
      })
    ),
    
    h('div', { style: { marginBottom: '20px' } },
      h('label', { 
        style: { 
          display: 'block', 
          marginBottom: '5px',
          fontWeight: '500',
        }
      }, 'Message'),
      h('textarea', {
        value: formData.message,
        onChange: handleInputChange('message'),
        required: true,
        rows: 4,
        style: {
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
          resize: 'vertical',
        },
      })
    ),
    
    h(Button, {
      type: 'submit',
      disabled: isSubmitting,
      style: { width: '100%' },
    }, isSubmitting ? 'Sending...' : 'Send Message')
  );
};
```

## 🚀 Building for Production

When you're ready to deploy your app:

```bash
# Build for production
npm run build

# Preview the production build
npm run preview

# Start production server
npm run start
```

The build command will:
- Bundle and optimize your code
- Generate static assets
- Create a production-ready `dist/` folder

## 📚 Next Steps

Congratulations! You've created your first ONEDOT application. Here's what to explore next:

### 📖 Learn More
- [Project Structure Guide](./project-structure.md) - Organize your code effectively
- [Routing & Navigation](./routing.md) - Build multi-page applications
- [Component System](./components.md) - Create reusable components
- [State Management](./state-management.md) - Manage application state

### 🛠️ Development Tools
- [CLI Commands](./cli-commands.md) - Master the development workflow
- [Testing](./testing.md) - Write reliable tests
- [Performance](./performance.md) - Optimize your application

### 🚀 Advanced Features
- [Server-Side Rendering](./ssr.md) - Improve SEO and performance
- [Edge Runtime](./edge-runtime.md) - Deploy to edge functions
- [Plugin Development](./plugins.md) - Extend the framework

## 🤝 Getting Help

- **Documentation**: Browse the full documentation
- **Examples**: Check out example projects
- **Community**: Join our community discussions
- **Issues**: Report bugs or request features

Happy coding with ONEDOT! 🔥
