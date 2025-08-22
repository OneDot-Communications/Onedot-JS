# 🏗️ Project Structure - ONEDOT Framework

This guide explains the recommended project structure for ONEDOT applications, including file organization, naming conventions, and best practices.

## 📁 Standard Project Structure

### Basic Application Structure

```
my-onedot-app/
├── 📁 src/                    # Source code
│   ├── 📁 pages/              # File-based routing
│   │   ├── index.ts           # Home page (/)
│   │   ├── about.ts           # About page (/about)
│   │   ├── contact.ts         # Contact page (/contact)
│   │   └── 📁 blog/           # Blog section
│   │       ├── index.ts       # Blog home (/blog)
│   │       ├── [slug].ts      # Dynamic blog post (/blog/[slug])
│   │       └── 📁 category/   # Blog categories
│   │           └── [name].ts  # Category pages (/blog/category/[name])
│   │
│   ├── 📁 components/         # Reusable components
│   │   ├── 📁 ui/             # Basic UI components
│   │   │   ├── Button.ts      # Button component
│   │   │   ├── Card.ts        # Card component
│   │   │   ├── Modal.ts       # Modal component
│   │   │   └── index.ts       # Component exports
│   │   │
│   │   ├── 📁 layout/         # Layout components
│   │   │   ├── Header.ts      # App header
│   │   │   ├── Footer.ts      # App footer
│   │   │   ├── Sidebar.ts     # Sidebar component
│   │   │   └── Layout.ts      # Main layout wrapper
│   │   │
│   │   └── 📁 forms/          # Form components
│   │       ├── ContactForm.ts # Contact form
│   │       ├── LoginForm.ts   # Login form
│   │       └── SearchBox.ts   # Search component
│   │
│   ├── 📁 stores/             # State management
│   │   ├── userStore.ts       # User state
│   │   ├── cartStore.ts       # Shopping cart state
│   │   ├── appStore.ts        # Global app state
│   │   └── index.ts           # Store exports
│   │
│   ├── 📁 services/           # API and external services
│   │   ├── api.ts             # API client
│   │   ├── auth.ts            # Authentication service
│   │   ├── storage.ts         # Local storage utilities
│   │   └── analytics.ts       # Analytics service
│   │
│   ├── 📁 utils/              # Utility functions
│   │   ├── date.ts            # Date utilities
│   │   ├── format.ts          # Formatting functions
│   │   ├── validation.ts      # Validation helpers
│   │   └── constants.ts       # App constants
│   │
│   ├── 📁 styles/             # Global styles and themes
│   │   ├── globals.ts         # Global CSS-in-JS styles
│   │   ├── theme.ts           # Theme configuration
│   │   ├── variables.ts       # CSS variables
│   │   └── reset.ts           # CSS reset/normalize
│   │
│   ├── 📁 types/              # TypeScript type definitions
│   │   ├── api.ts             # API response types
│   │   ├── components.ts      # Component prop types
│   │   ├── stores.ts          # Store types
│   │   └── global.d.ts        # Global type declarations
│   │
│   ├── app.ts                 # Main application component
│   ├── main.ts                # Application entry point
│   └── router.ts              # Router configuration
│
├── 📁 public/                 # Static assets
│   ├── favicon.ico            # App favicon
│   ├── logo.svg               # App logo
│   ├── manifest.json          # PWA manifest
│   └── 📁 images/             # Static images
│       ├── hero.jpg           # Hero image
│       └── icons/             # Icon assets
│
├── 📁 tests/                  # Test files
│   ├── 📁 components/         # Component tests
│   ├── 📁 pages/              # Page tests
│   ├── 📁 utils/              # Utility tests
│   ├── setup.ts              # Test setup
│   └── helpers.ts             # Test helpers
│
├── 📁 docs/                   # Project documentation
│   ├── api.md                 # API documentation
│   ├── deployment.md          # Deployment guide
│   └── development.md         # Development guide
│
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── onedot.config.js           # ONEDOT configuration
├── .env                       # Environment variables
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
└── README.md                  # Project README
```

## 📄 File Naming Conventions

### Component Files
```typescript
// Use PascalCase for component files
Button.ts          ✅ Correct
Card.ts            ✅ Correct
UserProfile.ts     ✅ Correct

button.ts          ❌ Avoid
userprofile.ts     ❌ Avoid
user_profile.ts    ❌ Avoid
```

### Page Files
```typescript
// Use kebab-case or camelCase for page files
index.ts           ✅ Correct (home page)
about.ts           ✅ Correct
contact-us.ts      ✅ Correct
user-profile.ts    ✅ Correct

// Dynamic routes use square brackets
[id].ts            ✅ Correct (dynamic parameter)
[slug].ts          ✅ Correct (blog post slug)
[...rest].ts       ✅ Correct (catch-all route)
```

### Utility Files
```typescript
// Use camelCase for utility files
dateUtils.ts       ✅ Correct
apiHelpers.ts      ✅ Correct
stringUtils.ts     ✅ Correct

date_utils.ts      ❌ Avoid
api-helpers.ts     ❌ Avoid
```

## 🗂️ Folder Organization Patterns

### Feature-Based Structure (Recommended for larger apps)

```
src/
├── 📁 features/
│   ├── 📁 auth/               # Authentication feature
│   │   ├── 📁 components/     # Auth-specific components
│   │   │   ├── LoginForm.ts
│   │   │   ├── SignupForm.ts
│   │   │   └── AuthGuard.ts
│   │   ├── 📁 pages/          # Auth pages
│   │   │   ├── login.ts
│   │   │   ├── signup.ts
│   │   │   └── reset-password.ts
│   │   ├── 📁 stores/         # Auth state
│   │   │   └── authStore.ts
│   │   ├── 📁 services/       # Auth services
│   │   │   └── authApi.ts
│   │   ├── 📁 types/          # Auth types
│   │   │   └── auth.types.ts
│   │   └── index.ts           # Feature exports
│   │
│   ├── 📁 blog/               # Blog feature
│   │   ├── 📁 components/
│   │   │   ├── PostCard.ts
│   │   │   ├── PostList.ts
│   │   │   └── CommentSection.ts
│   │   ├── 📁 pages/
│   │   │   ├── index.ts
│   │   │   ├── [slug].ts
│   │   │   └── create.ts
│   │   ├── 📁 stores/
│   │   │   └── blogStore.ts
│   │   └── index.ts
│   │
│   └── 📁 dashboard/          # Dashboard feature
│       ├── 📁 components/
│       ├── 📁 pages/
│       ├── 📁 stores/
│       └── index.ts
│
├── 📁 shared/                 # Shared across features
│   ├── 📁 components/         # Shared components
│   ├── 📁 utils/              # Shared utilities
│   ├── 📁 types/              # Shared types
│   └── 📁 services/           # Shared services
```

## 🚏 File-Based Routing System

ONEDOT uses a file-based routing system similar to Next.js. The file structure in the `pages/` directory automatically generates routes.

### Basic Routes

```
pages/
├── index.ts          → /
├── about.ts          → /about
├── contact.ts        → /contact
└── pricing.ts        → /pricing
```

### Nested Routes

```
pages/
├── blog/
│   ├── index.ts      → /blog
│   ├── categories.ts → /blog/categories
│   └── authors.ts    → /blog/authors
└── dashboard/
    ├── index.ts      → /dashboard
    ├── settings.ts   → /dashboard/settings
    └── profile.ts    → /dashboard/profile
```

### Dynamic Routes

```
pages/
├── user/
│   ├── [id].ts       → /user/123, /user/456
│   └── profile/
│       └── [id].ts   → /user/profile/123
├── blog/
│   ├── [slug].ts     → /blog/my-first-post
│   └── category/
│       └── [name].ts → /blog/category/technology
└── shop/
    └── [...rest].ts  → /shop/electronics/phones/iphone
                         (catch-all route)
```

### API Routes

```
pages/
└── api/
    ├── users.ts      → /api/users
    ├── auth/
    │   ├── login.ts  → /api/auth/login
    │   └── logout.ts → /api/auth/logout
    └── blog/
        ├── [id].ts   → /api/blog/123
        └── search.ts → /api/blog/search
```

## 📝 Component Structure

### Basic Component Template

```typescript
// src/components/ui/Button.ts
import { h, Component, css } from '@onedot/core';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: any;
}

const buttonStyles = css({
  base: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  variants: {
    primary: { background: '#3b82f6', color: 'white' },
    secondary: { background: '#6b7280', color: 'white' },
    danger: { background: '#ef4444', color: 'white' },
  },
  sizes: {
    sm: { padding: '4px 8px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
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
    onClick,
  }, children);
};
```

### Page Component Template

```typescript
// src/pages/about.ts
import { h, Component, useState, useEffect } from '@onedot/core';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

interface AboutData {
  title: string;
  description: string;
  team: Array<{
    name: string;
    role: string;
    avatar: string;
  }>;
}

export default function AboutPage() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    try {
      const response = await fetch('/api/about');
      const aboutData = await response.json();
      setData(aboutData);
    } catch (error) {
      console.error('Failed to load about data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return h(Layout, {},
      h('div', { className: 'loading' }, 'Loading...')
    );
  }

  return h(Layout, {},
    h('div', { className: 'about-page' },
      h('h1', {}, data?.title || 'About Us'),
      h('p', {}, data?.description),
      h('div', { className: 'team-grid' },
        data?.team.map(member =>
          h(Card, { key: member.name },
            h('img', { src: member.avatar, alt: member.name }),
            h('h3', {}, member.name),
            h('p', {}, member.role)
          )
        )
      )
    )
  );
}
```

## 🔧 Configuration Files

### Package.json Scripts

```json
{
  "name": "my-onedot-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "onedot dev",
    "build": "onedot build",
    "start": "onedot start",
    "test": "onedot test",
    "lint": "onedot lint",
    "type-check": "tsc --noEmit",
    "preview": "onedot preview"
  },
  "dependencies": {
    "onedot-js": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

### ONEDOT Configuration

```javascript
// onedot.config.js
export default {
  // Development server configuration
  server: {
    port: 3000,
    host: 'localhost',
    https: false,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    target: 'es2020',
  },

  // Router configuration
  router: {
    basePath: '/',
    trailingSlash: false,
    caseSensitive: false,
  },

  // Style configuration
  css: {
    modules: true,
    preprocessor: 'none', // 'sass', 'less', 'stylus'
  },

  // Plugin configuration
  plugins: [
    // Add custom plugins here
  ],

  // Environment variables
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": [
    "src",
    "pages",
    "components",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    ".onedot"
  ]
}
```

## 📱 Best Practices

### ✅ Do's

1. **Use consistent naming conventions** across your project
2. **Group related functionality** together in folders
3. **Keep components small** and focused on a single responsibility
4. **Use TypeScript** for better developer experience
5. **Write descriptive component and function names**
6. **Organize imports** (external libraries first, then internal modules)
7. **Use path aliases** (@/) for cleaner imports
8. **Keep the public folder** for static assets only

### ❌ Don'ts

1. **Don't mix different naming conventions** in the same project
2. **Don't create deeply nested folder structures** (max 3-4 levels)
3. **Don't put business logic** in components
4. **Don't use relative imports** for distant files (use path aliases)
5. **Don't put large components** in page files
6. **Don't ignore TypeScript errors**
7. **Don't commit** environment files with secrets

## 🔍 File Import Examples

```typescript
// ✅ Good - Using path aliases
import { Button } from '@/components/ui/Button';
import { userStore } from '@/stores/userStore';
import { formatDate } from '@/utils/date';

// ❌ Avoid - Relative imports for distant files
import { Button } from '../../../components/ui/Button';
import { userStore } from '../../stores/userStore';

// ✅ Good - Organizing imports
// External libraries first
import React from 'react';
import axios from 'axios';

// Internal modules
import { Component } from '@onedot/core';
import { Button } from '@/components/ui/Button';
import { userStore } from '@/stores/userStore';

// Types
import type { User } from '@/types/user';
```

This structure provides a solid foundation for ONEDOT applications of any size, from simple websites to complex applications. Choose the pattern that best fits your project's needs and scale.
