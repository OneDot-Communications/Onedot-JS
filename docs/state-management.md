# 🚀 State Management - ONEDOT Framework

ONEDOT provides a powerful and intuitive state management system built on reactive programming principles. It features fine-grained reactivity, computed values, and global state management that scales from simple components to complex applications.

## 🧠 Core Concepts

### Signals - Reactive Primitives

Signals are the foundation of ONEDOT's reactivity system. They automatically track dependencies and update consumers when values change.

```typescript
import { signal, computed, effect } from '@onedot/core';

// Create a reactive signal
const count = signal(0);

// Read the value
console.log(count.value); // 0

// Update the value
count.value = 5;
console.log(count.value); // 5

// Signals are reactive - they notify dependents when changed
const doubled = computed(() => count.value * 2);
console.log(doubled.value); // 10

count.value = 10;
console.log(doubled.value); // 20 (automatically updated)
```

### Computed Values

Computed values derive their state from other signals and automatically update when dependencies change:

```typescript
import { signal, computed } from '@onedot/core';

const firstName = signal('John');
const lastName = signal('Doe');

// Computed value automatically updates when dependencies change
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe" (automatically updated)

// Complex computed values
const todos = signal([
  { id: 1, text: 'Learn ONEDOT', completed: false },
  { id: 2, text: 'Build an app', completed: true },
  { id: 3, text: 'Deploy to production', completed: false },
]);

const completedTodos = computed(() => 
  todos.value.filter(todo => todo.completed)
);

const totalTodos = computed(() => todos.value.length);
const completedCount = computed(() => completedTodos.value.length);
const remainingCount = computed(() => totalTodos.value - completedCount.value);
const completionPercentage = computed(() => 
  totalTodos.value > 0 ? (completedCount.value / totalTodos.value) * 100 : 0
);
```

### Effects - Side Effects

Effects run automatically when their dependencies change, perfect for side effects like DOM updates, API calls, or logging:

```typescript
import { signal, computed, effect } from '@onedot/core';

const user = signal({ name: 'John', email: 'john@example.com' });
const theme = signal('light');

// Effect runs when user changes
effect(() => {
  console.log('User updated:', user.value);
  // Update document title
  document.title = `${user.value.name} - My App`;
});

// Effect for theme changes
effect(() => {
  document.body.className = `theme-${theme.value}`;
});

// Effect with cleanup
effect(() => {
  const interval = setInterval(() => {
    console.log('Current user:', user.value.name);
  }, 5000);
  
  // Return cleanup function
  return () => clearInterval(interval);
});
```

## 🏪 Global State Management

### Creating Stores

Organize your application state into logical stores:

```typescript
// stores/userStore.ts
import { signal, computed } from '@onedot/core';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// Create signals for state
const authState = signal<AuthState>({
  user: null,
  token: null,
  isLoading: false,
});

// Computed values
const isAuthenticated = computed(() => 
  authState.value.user !== null && authState.value.token !== null
);

const userRoles = computed(() => 
  authState.value.user?.roles || []
);

const hasRole = (role: string) => computed(() => 
  userRoles.value.includes(role)
);

// Actions
export const userStore = {
  // State getters
  get state() { return authState.value; },
  get user() { return authState.value.user; },
  get isAuthenticated() { return isAuthenticated.value; },
  get isLoading() { return authState.value.isLoading; },
  
  // Computed getters
  get roles() { return userRoles.value; },
  hasRole,
  
  // Actions
  async login(email: string, password: string) {
    authState.value = { ...authState.value, isLoading: true };
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const { user, token } = await response.json();
      
      authState.value = {
        user,
        token,
        isLoading: false,
      };
      
      // Store token for persistence
      localStorage.setItem('auth_token', token);
      
    } catch (error) {
      authState.value = { ...authState.value, isLoading: false };
      throw error;
    }
  },
  
  logout() {
    authState.value = {
      user: null,
      token: null,
      isLoading: false,
    };
    localStorage.removeItem('auth_token');
  },
  
  updateUser(updates: Partial<User>) {
    if (authState.value.user) {
      authState.value = {
        ...authState.value,
        user: { ...authState.value.user, ...updates },
      };
    }
  },
  
  async refreshToken() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { user, token: newToken } = await response.json();
        authState.value = { user, token: newToken, isLoading: false };
        localStorage.setItem('auth_token', newToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
  },
};
```

### Shopping Cart Store Example

```typescript
// stores/cartStore.ts
import { signal, computed } from '@onedot/core';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  discountCode?: string;
  shippingCost: number;
}

const cartState = signal<CartState>({
  items: [],
  isOpen: false,
  shippingCost: 0,
});

// Computed values
const totalItems = computed(() => 
  cartState.value.items.reduce((sum, item) => sum + item.quantity, 0)
);

const subtotal = computed(() => 
  cartState.value.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
);

const total = computed(() => subtotal.value + cartState.value.shippingCost);

const isEmpty = computed(() => cartState.value.items.length === 0);

export const cartStore = {
  // State getters
  get state() { return cartState.value; },
  get items() { return cartState.value.items; },
  get isOpen() { return cartState.value.isOpen; },
  
  // Computed getters
  get totalItems() { return totalItems.value; },
  get subtotal() { return subtotal.value; },
  get total() { return total.value; },
  get isEmpty() { return isEmpty.value; },
  
  // Actions
  addItem(product: Omit<CartItem, 'quantity'>, quantity = 1) {
    const existingItem = cartState.value.items.find(item => item.id === product.id);
    
    if (existingItem) {
      this.updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      cartState.value = {
        ...cartState.value,
        items: [...cartState.value.items, { ...product, quantity }],
      };
    }
  },
  
  removeItem(id: string) {
    cartState.value = {
      ...cartState.value,
      items: cartState.value.items.filter(item => item.id !== id),
    };
  },
  
  updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }
    
    cartState.value = {
      ...cartState.value,
      items: cartState.value.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      ),
    };
  },
  
  clearCart() {
    cartState.value = {
      ...cartState.value,
      items: [],
    };
  },
  
  toggleCart() {
    cartState.value = {
      ...cartState.value,
      isOpen: !cartState.value.isOpen,
    };
  },
  
  openCart() {
    cartState.value = { ...cartState.value, isOpen: true };
  },
  
  closeCart() {
    cartState.value = { ...cartState.value, isOpen: false };
  },
  
  applyDiscountCode(code: string) {
    cartState.value = { ...cartState.value, discountCode: code };
  },
  
  setShippingCost(cost: number) {
    cartState.value = { ...cartState.value, shippingCost: cost };
  },
};
```

## 🔗 Using State in Components

### With Hooks

```typescript
import { h, Component } from '@onedot/core';
import { useStore } from '@onedot/core';
import { userStore } from '../stores/userStore';
import { cartStore } from '../stores/cartStore';

export const Header: Component = () => {
  // Use stores in components
  const user = useStore(() => userStore.user);
  const isAuthenticated = useStore(() => userStore.isAuthenticated);
  const cartTotal = useStore(() => cartStore.totalItems);

  const handleLogin = async () => {
    try {
      await userStore.login('user@example.com', 'password');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleLogout = () => {
    userStore.logout();
  };

  return h('header', { className: 'app-header' },
    h('div', { className: 'header-content' },
      h('h1', {}, 'My Store'),
      
      h('nav', { className: 'header-nav' },
        h('button', { 
          onClick: () => cartStore.toggleCart() 
        }, `Cart (${cartTotal})`),
        
        isAuthenticated ? (
          h('div', { className: 'user-menu' },
            h('span', {}, `Welcome, ${user?.name}`),
            h('button', { onClick: handleLogout }, 'Logout')
          )
        ) : (
          h('button', { onClick: handleLogin }, 'Login')
        )
      )
    )
  );
};
```

### Reactive Effects in Components

```typescript
import { h, Component, useEffect } from '@onedot/core';
import { userStore } from '../stores/userStore';

export const UserProfile: Component = () => {
  // React to store changes
  useEffect(() => {
    if (userStore.isAuthenticated) {
      userStore.refreshToken();
    }
  }, [userStore.isAuthenticated]);

  // Update document title when user changes
  useEffect(() => {
    document.title = userStore.user 
      ? `${userStore.user.name} - Profile` 
      : 'My App';
  }, [userStore.user]);

  if (!userStore.isAuthenticated) {
    return h('div', {}, 'Please log in to view your profile');
  }

  return h('div', { className: 'user-profile' },
    h('h2', {}, 'User Profile'),
    h('img', { 
      src: userStore.user?.avatar || '/default-avatar.png',
      alt: userStore.user?.name 
    }),
    h('p', {}, `Name: ${userStore.user?.name}`),
    h('p', {}, `Email: ${userStore.user?.email}`),
    h('p', {}, `Roles: ${userStore.roles.join(', ')}`),
    
    h('button', { 
      onClick: () => userStore.updateUser({ name: 'Updated Name' })
    }, 'Update Name')
  );
};
```

## 📡 Async State Management

### Loading States and Error Handling

```typescript
// stores/postsStore.ts
import { signal, computed } from '@onedot/core';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
}

const postsState = signal<PostsState>({
  posts: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
});

// Computed values
const hasNextPage = computed(() => 
  postsState.value.currentPage < postsState.value.totalPages
);

const hasPrevPage = computed(() => 
  postsState.value.currentPage > 1
);

export const postsStore = {
  // State getters
  get state() { return postsState.value; },
  get posts() { return postsState.value.posts; },
  get loading() { return postsState.value.loading; },
  get error() { return postsState.value.error; },
  get currentPage() { return postsState.value.currentPage; },
  
  // Computed getters
  get hasNextPage() { return hasNextPage.value; },
  get hasPrevPage() { return hasPrevPage.value; },
  
  // Actions
  async fetchPosts(page = 1) {
    postsState.value = { 
      ...postsState.value, 
      loading: true, 
      error: null 
    };
    
    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      postsState.value = {
        posts: data.posts,
        loading: false,
        error: null,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
      };
    } catch (error) {
      postsState.value = {
        ...postsState.value,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      };
    }
  },
  
  async createPost(postData: Omit<Post, 'id' | 'createdAt'>) {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const newPost = await response.json();
      
      postsState.value = {
        ...postsState.value,
        posts: [newPost, ...postsState.value.posts],
      };
      
      return newPost;
    } catch (error) {
      postsState.value = {
        ...postsState.value,
        error: error instanceof Error ? error.message : 'Failed to create post',
      };
      throw error;
    }
  },
  
  async deletePost(id: string) {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      postsState.value = {
        ...postsState.value,
        posts: postsState.value.posts.filter(post => post.id !== id),
      };
    } catch (error) {
      postsState.value = {
        ...postsState.value,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      };
      throw error;
    }
  },
  
  clearError() {
    postsState.value = { ...postsState.value, error: null };
  },
  
  nextPage() {
    if (this.hasNextPage) {
      this.fetchPosts(this.currentPage + 1);
    }
  },
  
  prevPage() {
    if (this.hasPrevPage) {
      this.fetchPosts(this.currentPage - 1);
    }
  },
};
```

## 🔄 State Persistence

### Local Storage Integration

```typescript
// utils/persistence.ts
export function createPersistedSignal<T>(key: string, initialValue: T) {
  // Load initial value from localStorage
  const stored = localStorage.getItem(key);
  let parsedValue = initialValue;
  
  try {
    if (stored !== null) {
      parsedValue = JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to parse stored value for ${key}:`, error);
  }
  
  const signal = signal(parsedValue);
  
  // Save to localStorage whenever the signal changes
  effect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(signal.value));
    } catch (error) {
      console.warn(`Failed to persist ${key}:`, error);
    }
  });
  
  return signal;
}

// Usage in stores
const userPreferences = createPersistedSignal('userPreferences', {
  theme: 'light',
  language: 'en',
  notifications: true,
});

export const preferencesStore = {
  get theme() { return userPreferences.value.theme; },
  get language() { return userPreferences.value.language; },
  get notifications() { return userPreferences.value.notifications; },
  
  setTheme(theme: string) {
    userPreferences.value = { ...userPreferences.value, theme };
  },
  
  setLanguage(language: string) {
    userPreferences.value = { ...userPreferences.value, language };
  },
  
  toggleNotifications() {
    userPreferences.value = {
      ...userPreferences.value,
      notifications: !userPreferences.value.notifications,
    };
  },
};
```

## 🧪 Testing State

### Unit Testing Stores

```typescript
// stores/__tests__/cartStore.test.ts
import { describe, it, expect, beforeEach } from '@onedot/test';
import { cartStore } from '../cartStore';

describe('CartStore', () => {
  beforeEach(() => {
    cartStore.clearCart();
  });

  it('should start with empty cart', () => {
    expect(cartStore.isEmpty).toBe(true);
    expect(cartStore.totalItems).toBe(0);
    expect(cartStore.total).toBe(0);
  });

  it('should add items to cart', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 10.99,
    };

    cartStore.addItem(product, 2);

    expect(cartStore.items).toHaveLength(1);
    expect(cartStore.items[0].quantity).toBe(2);
    expect(cartStore.totalItems).toBe(2);
    expect(cartStore.subtotal).toBe(21.98);
  });

  it('should update quantity of existing items', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 10.99,
    };

    cartStore.addItem(product, 1);
    cartStore.addItem(product, 2);

    expect(cartStore.items).toHaveLength(1);
    expect(cartStore.items[0].quantity).toBe(3);
  });

  it('should remove items from cart', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 10.99,
    };

    cartStore.addItem(product, 2);
    cartStore.removeItem('1');

    expect(cartStore.isEmpty).toBe(true);
  });
});
```

This comprehensive state management system provides everything you need to build scalable, maintainable applications with predictable state updates and excellent developer experience.
