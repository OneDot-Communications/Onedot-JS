# 🧭 Routing & Navigation - ONEDOT Framework

ONEDOT features a powerful file-based routing system that automatically generates routes from your file structure, supports dynamic parameters, nested layouts, and provides programmatic navigation capabilities.

## 📁 File-Based Routing

### Basic Route Structure

The routing system automatically maps files in your `pages/` directory to URL routes:

```
pages/
├── index.ts          → /              (Home page)
├── about.ts          → /about         (About page)
├── contact.ts        → /contact       (Contact page)
├── pricing.ts        → /pricing       (Pricing page)
└── terms.ts          → /terms         (Terms page)
```

### Nested Routes

Create nested routes using folders:

```
pages/
├── blog/
│   ├── index.ts      → /blog          (Blog home)
│   ├── authors.ts    → /blog/authors  (Authors page)
│   └── categories.ts → /blog/categories (Categories)
├── docs/
│   ├── index.ts      → /docs          (Docs home)
│   ├── guide.ts      → /docs/guide    (Guide page)
│   └── api.ts        → /docs/api      (API docs)
└── dashboard/
    ├── index.ts      → /dashboard     (Dashboard home)
    ├── settings.ts   → /dashboard/settings
    └── profile.ts    → /dashboard/profile
```

### Dynamic Routes

Use square brackets `[]` for dynamic route parameters:

```
pages/
├── user/
│   ├── [id].ts       → /user/123      (User profile)
│   └── [id]/
│       ├── edit.ts   → /user/123/edit (Edit user)
│       └── posts.ts  → /user/123/posts (User posts)
├── blog/
│   ├── [slug].ts     → /blog/my-post  (Blog post)
│   └── category/
│       └── [name].ts → /blog/category/tech
└── product/
    └── [...rest].ts  → /product/electronics/phone/iphone
                         (Catch-all route)
```

## 🎯 Route Parameters

### Single Parameters

```typescript
// pages/user/[id].ts
import { h, useRouter } from '@onedot/core';

export default function UserPage() {
  const router = useRouter();
  const { id } = router.params; // Extract user ID from URL
  
  return h('div', {},
    h('h1', {}, `User Profile: ${id}`),
    h('p', {}, `Loading user data for ID: ${id}`)
  );
}
```

### Multiple Parameters

```typescript
// pages/blog/category/[category]/[slug].ts
import { h, useRouter } from '@onedot/core';

export default function BlogPostPage() {
  const router = useRouter();
  const { category, slug } = router.params;
  
  return h('div', {},
    h('nav', {},
      h('a', { href: '/blog' }, 'Blog'),
      h('span', {}, ' > '),
      h('a', { href: `/blog/category/${category}` }, category),
      h('span', {}, ' > '),
      h('span', {}, slug)
    ),
    h('article', {},
      h('h1', {}, `Post: ${slug}`),
      h('p', {}, `Category: ${category}`)
    )
  );
}
```

### Catch-All Routes

```typescript
// pages/docs/[...path].ts
import { h, useRouter } from '@onedot/core';

export default function DocsPage() {
  const router = useRouter();
  const path = router.params.path; // Array of path segments
  
  return h('div', {},
    h('h1', {}, 'Documentation'),
    h('p', {}, `Path: /${path.join('/')}`),
    h('div', {}, 
      'Segments: ',
      path.map((segment, index) => 
        h('span', { key: index }, `${segment} `)
      )
    )
  );
}
```

## 🧩 Layouts and Nested Routing

### Layout Components

Create reusable layouts for different sections of your app:

```typescript
// src/components/layout/MainLayout.ts
import { h, Component } from '@onedot/core';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: any;
  title?: string;
}

export const MainLayout: Component<LayoutProps> = ({ 
  children, 
  title = 'ONEDOT App' 
}) => {
  return h('div', { className: 'main-layout' },
    h(Header, { title }),
    h('main', { className: 'content' }, children),
    h(Footer, {})
  );
};
```

### Using Layouts in Pages

```typescript
// pages/about.ts
import { h } from '@onedot/core';
import { MainLayout } from '../components/layout/MainLayout';

export default function AboutPage() {
  return h(MainLayout, { title: 'About Us' },
    h('div', { className: 'about-page' },
      h('h1', {}, 'About Our Company'),
      h('p', {}, 'We are building the future of web development...')
    )
  );
}
```

### Nested Layouts

```typescript
// pages/dashboard/layout.ts
import { h, Component } from '@onedot/core';
import { MainLayout } from '../../components/layout/MainLayout';
import { DashboardSidebar } from '../../components/dashboard/Sidebar';

interface DashboardLayoutProps {
  children: any;
}

export const DashboardLayout: Component<DashboardLayoutProps> = ({ children }) => {
  return h(MainLayout, { title: 'Dashboard' },
    h('div', { className: 'dashboard-layout' },
      h(DashboardSidebar, {}),
      h('div', { className: 'dashboard-content' }, children)
    )
  );
};

// pages/dashboard/index.ts
import { h } from '@onedot/core';
import { DashboardLayout } from './layout';

export default function DashboardPage() {
  return h(DashboardLayout, {},
    h('h1', {}, 'Dashboard Home'),
    h('p', {}, 'Welcome to your dashboard!')
  );
}
```

## 🧭 Programmatic Navigation

### useRouter Hook

```typescript
import { h, useRouter, useState } from '@onedot/core';

export default function NavigationExample() {
  const router = useRouter();
  const [userId, setUserId] = useState('');

  const navigateToUser = () => {
    if (userId) {
      router.push(`/user/${userId}`);
    }
  };

  const goBack = () => {
    router.back();
  };

  return h('div', {},
    h('h2', {}, 'Navigation Example'),
    
    // Current route info
    h('p', {}, `Current path: ${router.pathname}`),
    h('p', {}, `Query params: ${JSON.stringify(router.query)}`),
    
    // Navigation controls
    h('input', {
      type: 'text',
      placeholder: 'Enter user ID',
      value: userId,
      onChange: (e) => setUserId(e.target.value)
    }),
    h('button', { onClick: navigateToUser }, 'Go to User'),
    h('button', { onClick: goBack }, 'Go Back'),
    
    // Link navigation
    h('nav', {},
      h('a', { href: '/' }, 'Home'),
      h('a', { href: '/about' }, 'About'),
      h('a', { href: '/contact' }, 'Contact')
    )
  );
}
```

### Router Methods

```typescript
import { useRouter } from '@onedot/core';

const router = useRouter();

// Navigate to a new route
router.push('/path');
router.push('/user/123');
router.push('/search?q=query&filter=active');

// Replace current route (no history entry)
router.replace('/login');

// Go back in history
router.back();

// Go forward in history
router.forward();

// Refresh current page
router.refresh();

// Get current route information
console.log(router.pathname);    // '/user/123'
console.log(router.params);      // { id: '123' }
console.log(router.query);       // { q: 'query', filter: 'active' }
console.log(router.hash);        // '#section'
```

## 🔗 Link Component

### Basic Links

```typescript
import { h, Link } from '@onedot/core';

export const Navigation = () => {
  return h('nav', {},
    h(Link, { href: '/' }, 'Home'),
    h(Link, { href: '/about' }, 'About'),
    h(Link, { href: '/contact' }, 'Contact'),
    h(Link, { href: '/blog' }, 'Blog')
  );
};
```

### Active Link Styling

```typescript
import { h, Link, useRouter, css } from '@onedot/core';

const navStyles = css({
  link: {
    padding: '8px 16px',
    textDecoration: 'none',
    color: '#6b7280',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  active: {
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    fontWeight: '600',
  }
});

export const NavLink = ({ href, children }) => {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return h(Link, {
    href,
    className: navStyles.link + (isActive ? ` ${navStyles.active}` : '')
  }, children);
};
```

### Prefetching

```typescript
// Prefetch routes for faster navigation
h(Link, { 
  href: '/dashboard', 
  prefetch: true 
}, 'Dashboard');

// Prefetch on hover
h(Link, { 
  href: '/blog/popular-post', 
  prefetch: 'hover' 
}, 'Popular Post');
```

## 🛡️ Route Guards

### Authentication Guard

```typescript
// src/components/guards/AuthGuard.ts
import { h, useRouter, useEffect } from '@onedot/core';
import { useAuth } from '../stores/authStore';

interface AuthGuardProps {
  children: any;
  redirectTo?: string;
}

export const AuthGuard = ({ children, redirectTo = '/login' }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return h('div', {}, 'Loading...');
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return children;
};
```

### Role-Based Guard

```typescript
// src/components/guards/RoleGuard.ts
import { h, useRouter } from '@onedot/core';
import { useAuth } from '../stores/authStore';

interface RoleGuardProps {
  children: any;
  roles: string[];
  fallback?: any;
}

export const RoleGuard = ({ children, roles, fallback }) => {
  const { user } = useAuth();
  
  const hasRequiredRole = user?.roles?.some(role => 
    roles.includes(role)
  );

  if (!hasRequiredRole) {
    return fallback || h('div', {}, 
      h('h2', {}, 'Access Denied'),
      h('p', {}, 'You do not have permission to view this page.')
    );
  }

  return children;
};
```

### Using Guards in Pages

```typescript
// pages/dashboard/admin.ts
import { h } from '@onedot/core';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { RoleGuard } from '../../components/guards/RoleGuard';
import { DashboardLayout } from './layout';

export default function AdminPage() {
  return h(AuthGuard, {},
    h(RoleGuard, { roles: ['admin', 'superuser'] },
      h(DashboardLayout, {},
        h('h1', {}, 'Admin Dashboard'),
        h('p', {}, 'Admin-only content here...')
      )
    )
  );
}
```

## 🔄 Route Loading States

### Page-Level Loading

```typescript
// pages/blog/[slug].ts
import { h, useState, useEffect, useRouter } from '@onedot/core';

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${slug}`);
      
      if (!response.ok) {
        throw new Error('Post not found');
      }
      
      const postData = await response.json();
      setPost(postData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return h('div', { className: 'loading' },
      h('div', { className: 'spinner' }),
      h('p', {}, 'Loading post...')
    );
  }

  if (error) {
    return h('div', { className: 'error' },
      h('h2', {}, 'Error'),
      h('p', {}, error),
      h('button', { 
        onClick: () => router.back() 
      }, 'Go Back')
    );
  }

  return h('article', {},
    h('h1', {}, post.title),
    h('p', { className: 'meta' }, 
      `Published on ${new Date(post.date).toLocaleDateString()}`
    ),
    h('div', { 
      className: 'content',
      innerHTML: post.content 
    })
  );
}
```

## 🌐 API Routes

### Creating API Endpoints

```typescript
// pages/api/users.ts
import { EdgeRequest, EdgeResponse } from '@onedot/runtime';

export async function GET(request: EdgeRequest): Promise<EdgeResponse> {
  try {
    // Simulate database query
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: EdgeRequest): Promise<EdgeResponse> {
  try {
    const userData = await request.json();
    
    // Validate user data
    if (!userData.name || !userData.email) {
      return new Response(JSON.stringify({ 
        error: 'Name and email are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user logic here
    const newUser = {
      id: Date.now(),
      ...userData
    };

    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Dynamic API Routes

```typescript
// pages/api/user/[id].ts
import { EdgeRequest, EdgeResponse } from '@onedot/runtime';

export async function GET(request: EdgeRequest): Promise<EdgeResponse> {
  const { id } = request.params;
  
  try {
    // Fetch user by ID
    const user = await getUserById(id);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: EdgeRequest): Promise<EdgeResponse> {
  const { id } = request.params;
  const updates = await request.json();
  
  try {
    const updatedUser = await updateUser(id, updates);
    
    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: EdgeRequest): Promise<EdgeResponse> {
  const { id } = request.params;
  
  try {
    await deleteUser(id);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## 🔍 Query Parameters and Hash

### Reading Query Parameters

```typescript
import { h, useRouter } from '@onedot/core';

export default function SearchPage() {
  const router = useRouter();
  const { q, category, sort } = router.query;

  return h('div', {},
    h('h1', {}, 'Search Results'),
    h('p', {}, `Query: ${q || 'No query'}`),
    h('p', {}, `Category: ${category || 'All'}`),
    h('p', {}, `Sort: ${sort || 'Relevance'}`)
  );
}

// URL: /search?q=javascript&category=tutorials&sort=date
// router.query = { q: 'javascript', category: 'tutorials', sort: 'date' }
```

### Updating Query Parameters

```typescript
import { h, useRouter, useState } from '@onedot/core';

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(router.query.q || '');

  const handleSearch = () => {
    const newQuery = { ...router.query, q: searchTerm };
    const queryString = new URLSearchParams(newQuery).toString();
    router.push(`/search?${queryString}`);
  };

  return h('div', {},
    h('input', {
      type: 'text',
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      placeholder: 'Search...'
    }),
    h('button', { onClick: handleSearch }, 'Search')
  );
}
```

This comprehensive routing system gives you the flexibility to build complex navigation patterns while keeping the developer experience simple and intuitive.
