# 🧩 Component System - ONEDOT Framework

ONEDOT's component system is designed for building scalable, maintainable, and performant user interfaces. It combines functional components with hooks, providing a modern development experience with TypeScript-first design.

## 🎯 Component Fundamentals

### Basic Component Structure

```typescript
import { h, Component } from '@onedot/core';

// Define component props interface
interface WelcomeProps {
  name: string;
  age?: number;
}

// Create a functional component
export const Welcome: Component<WelcomeProps> = ({ name, age }) => {
  return h('div', {},
    h('h1', {}, `Hello, ${name}!`),
    age && h('p', {}, `You are ${age} years old.`)
  );
};

// Usage
const app = h(Welcome, { name: 'John', age: 25 });
```

### JSX-like Syntax with `h` Function

The `h` function is ONEDOT's way of creating virtual DOM elements:

```typescript
// Basic element
h('div', { className: 'container' }, 'Hello World')

// Element with props and children
h('button', { 
  className: 'btn btn-primary',
  onClick: handleClick,
  disabled: false 
}, 'Click Me')

// Component with props
h(MyComponent, { 
  title: 'Hello',
  items: [1, 2, 3] 
})

// Nested elements
h('div', { className: 'card' },
  h('h2', {}, 'Card Title'),
  h('p', {}, 'Card content goes here'),
  h('button', { onClick: handleAction }, 'Action')
)
```

## 🪝 Hooks System

### useState Hook

Manage local component state with reactivity:

```typescript
import { h, useState, Component } from '@onedot/core';

export const Counter: Component = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Ready to count!');

  const increment = () => {
    setCount(count + 1);
    setMessage(`Count is now ${count + 1}`);
  };

  const decrement = () => {
    setCount(count - 1);
    setMessage(`Count is now ${count - 1}`);
  };

  const reset = () => {
    setCount(0);
    setMessage('Counter reset!');
  };

  return h('div', { className: 'counter' },
    h('h2', {}, message),
    h('div', { className: 'count-display' }, count),
    h('div', { className: 'controls' },
      h('button', { onClick: decrement }, '-'),
      h('button', { onClick: reset }, 'Reset'),
      h('button', { onClick: increment }, '+')
    )
  );
};
```

### useEffect Hook

Handle side effects and lifecycle events:

```typescript
import { h, useState, useEffect, Component } from '@onedot/core';

export const UserProfile: Component<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect runs when component mounts or userId changes
  useEffect(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Dependencies array

  // Cleanup effect
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic update check');
    }, 30000);

    // Cleanup function
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return h('div', { className: 'loading' }, 'Loading user...');
  }

  if (error) {
    return h('div', { className: 'error' }, `Error: ${error}`);
  }

  return h('div', { className: 'user-profile' },
    h('h2', {}, user.name),
    h('p', {}, user.email),
    h('img', { src: user.avatar, alt: user.name })
  );
};
```

### useComputed Hook

Create derived state that automatically updates:

```typescript
import { h, useState, useComputed, Component } from '@onedot/core';

export const ShoppingCart: Component = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Laptop', price: 999, quantity: 1 },
    { id: 2, name: 'Mouse', price: 29, quantity: 2 },
  ]);

  // Computed values automatically update when dependencies change
  const totalItems = useComputed(() => 
    items.reduce((sum, item) => sum + item.quantity, 0)
  );

  const totalPrice = useComputed(() => 
    items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  const averagePrice = useComputed(() => 
    totalItems > 0 ? totalPrice / totalItems : 0
  );

  const updateQuantity = (id: number, quantity: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  return h('div', { className: 'shopping-cart' },
    h('h2', {}, 'Shopping Cart'),
    
    h('div', { className: 'cart-items' },
      items.map(item =>
        h('div', { key: item.id, className: 'cart-item' },
          h('span', {}, item.name),
          h('span', {}, `$${item.price}`),
          h('input', {
            type: 'number',
            value: item.quantity,
            onChange: (e) => updateQuantity(item.id, parseInt(e.target.value))
          })
        )
      )
    ),
    
    h('div', { className: 'cart-summary' },
      h('p', {}, `Total Items: ${totalItems}`),
      h('p', {}, `Total Price: $${totalPrice.toFixed(2)}`),
      h('p', {}, `Average Price: $${averagePrice.toFixed(2)}`)
    )
  );
};
```

### useRef Hook

Access DOM elements directly:

```typescript
import { h, useRef, useEffect, Component } from '@onedot/core';

export const FocusInput: Component = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  return h('div', {},
    h('input', { 
      ref: inputRef,
      type: 'text',
      placeholder: 'Type something...'
    }),
    h('button', { onClick: clearInput }, 'Clear')
  );
};
```

### Custom Hooks

Create reusable logic with custom hooks:

```typescript
// Custom hook for local storage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [value, setStoredValue] as const;
}

// Custom hook for API data fetching
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error };
}

// Using custom hooks in components
export const UserList: Component = () => {
  const [selectedUser, setSelectedUser] = useLocalStorage('selectedUser', null);
  const { data: users, loading, error } = useApi('/api/users');

  if (loading) return h('div', {}, 'Loading users...');
  if (error) return h('div', {}, `Error: ${error}`);

  return h('div', { className: 'user-list' },
    h('h2', {}, 'Users'),
    users?.map(user =>
      h('div', { 
        key: user.id,
        className: selectedUser?.id === user.id ? 'selected' : '',
        onClick: () => setSelectedUser(user)
      }, user.name)
    ),
    selectedUser && h('div', { className: 'selected-info' },
      h('h3', {}, 'Selected User:'),
      h('p', {}, selectedUser.name)
    )
  );
};
```

## 🎨 Styled Components

### CSS-in-JS Integration

```typescript
import { h, Component, css } from '@onedot/core';

const cardStyles = css({
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    margin: '10px 0',
    transition: 'all 0.2s ease',
    
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-1px)',
    },
  },
  
  header: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  
  content: {
    color: '#6b7280',
    lineHeight: '1.6',
  },
  
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    justifyContent: 'flex-end',
  },
});

interface CardProps {
  title: string;
  children: any;
  actions?: any[];
}

export const Card: Component<CardProps> = ({ title, children, actions }) => {
  return h('div', { className: cardStyles.container },
    h('div', { className: cardStyles.header },
      h('h3', { className: cardStyles.title }, title)
    ),
    h('div', { className: cardStyles.content }, children),
    actions && h('div', { className: cardStyles.actions }, ...actions)
  );
};
```

### Dynamic Styling

```typescript
import { h, Component, css } from '@onedot/core';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: any;
}

const buttonStyles = css({
  base: {
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    '&:focus': {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
    },
    
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const Button: Component<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  onClick,
  children 
}) => {
  const variantStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      '&:hover:not(:disabled)': {
        backgroundColor: '#2563eb',
      },
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      '&:hover:not(:disabled)': {
        backgroundColor: '#e5e7eb',
      },
    },
    danger: {
      backgroundColor: '#ef4444',
      color: 'white',
      '&:hover:not(:disabled)': {
        backgroundColor: '#dc2626',
      },
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '14px' },
    md: { padding: '8px 16px', fontSize: '16px' },
    lg: { padding: '12px 20px', fontSize: '18px' },
  };

  const dynamicStyles = css({
    ...variantStyles[variant],
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
  });

  return h('button', {
    className: `${buttonStyles.base} ${dynamicStyles}`,
    disabled,
    onClick: disabled ? undefined : onClick,
  }, children);
};
```

## 🔄 Component Lifecycle

### Mounting and Unmounting

```typescript
import { h, useEffect, useState, Component } from '@onedot/core';

export const Timer: Component = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    console.log('Timer component mounted');
    
    // Cleanup function called when component unmounts
    return () => {
      console.log('Timer component unmounted');
    };
  }, []); // Empty dependency array = runs once on mount

  useEffect(() => {
    let interval: number | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    }
    
    // Cleanup interval when effect re-runs or component unmounts
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]); // Runs when isRunning changes

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setSeconds(0);
    setIsRunning(false);
  };

  return h('div', { className: 'timer' },
    h('h2', {}, `Timer: ${seconds}s`),
    h('button', { onClick: toggle }, isRunning ? 'Pause' : 'Start'),
    h('button', { onClick: reset }, 'Reset')
  );
};
```

## 📝 Form Components

### Controlled Components

```typescript
import { h, useState, Component } from '@onedot/core';

interface FormData {
  name: string;
  email: string;
  age: number;
  subscribe: boolean;
}

export const UserForm: Component = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    age: 0,
    subscribe: false,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (field: keyof FormData) => (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked :
                  target.type === 'number' ? parseInt(target.value) :
                  target.value;

    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Age must be between 1 and 120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    
    if (validate()) {
      console.log('Form submitted:', formData);
      // Handle form submission
    }
  };

  return h('form', { onSubmit: handleSubmit, className: 'user-form' },
    h('h2', {}, 'User Registration'),
    
    // Name field
    h('div', { className: 'form-group' },
      h('label', { htmlFor: 'name' }, 'Name'),
      h('input', {
        id: 'name',
        type: 'text',
        value: formData.name,
        onChange: handleChange('name'),
        className: errors.name ? 'error' : '',
      }),
      errors.name && h('span', { className: 'error-message' }, errors.name)
    ),
    
    // Email field
    h('div', { className: 'form-group' },
      h('label', { htmlFor: 'email' }, 'Email'),
      h('input', {
        id: 'email',
        type: 'email',
        value: formData.email,
        onChange: handleChange('email'),
        className: errors.email ? 'error' : '',
      }),
      errors.email && h('span', { className: 'error-message' }, errors.email)
    ),
    
    // Age field
    h('div', { className: 'form-group' },
      h('label', { htmlFor: 'age' }, 'Age'),
      h('input', {
        id: 'age',
        type: 'number',
        value: formData.age,
        onChange: handleChange('age'),
        className: errors.age ? 'error' : '',
      }),
      errors.age && h('span', { className: 'error-message' }, errors.age)
    ),
    
    // Checkbox
    h('div', { className: 'form-group' },
      h('label', {},
        h('input', {
          type: 'checkbox',
          checked: formData.subscribe,
          onChange: handleChange('subscribe'),
        }),
        ' Subscribe to newsletter'
      )
    ),
    
    h('button', { type: 'submit' }, 'Register')
  );
};
```

## 🔧 Advanced Component Patterns

### Higher-Order Components

```typescript
import { h, Component, useState, useEffect } from '@onedot/core';

// HOC for adding loading state
function withLoading<P extends object>(
  WrappedComponent: Component<P>,
  loadingMessage = 'Loading...'
) {
  return function LoadingComponent(props: P & { isLoading?: boolean }) {
    const { isLoading, ...restProps } = props;
    
    if (isLoading) {
      return h('div', { className: 'loading' }, loadingMessage);
    }
    
    return h(WrappedComponent, restProps as P);
  };
}

// HOC for error boundaries
function withErrorBoundary<P extends object>(
  WrappedComponent: Component<P>
) {
  return function ErrorBoundaryComponent(props: P) {
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        setHasError(true);
        setError(new Error(event.message));
      };

      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
      };
    }, []);

    if (hasError) {
      return h('div', { className: 'error-boundary' },
        h('h2', {}, 'Something went wrong'),
        h('p', {}, error?.message || 'An unexpected error occurred'),
        h('button', { 
          onClick: () => {
            setHasError(false);
            setError(null);
          }
        }, 'Try Again')
      );
    }

    return h(WrappedComponent, props);
  };
}

// Usage
const MyComponent = withErrorBoundary(
  withLoading(({ data }: { data: any[] }) => {
    return h('div', {},
      h('h2', {}, 'Data List'),
      h('ul', {},
        data.map(item =>
          h('li', { key: item.id }, item.name)
        )
      )
    );
  })
);
```

### Render Props Pattern

```typescript
import { h, useState, Component } from '@onedot/core';

interface MousePositionProps {
  children: (position: { x: number; y: number }) => any;
}

const MouseTracker: Component<MousePositionProps> = ({ children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return children(position);
};

// Usage
const App = () => {
  return h('div', {},
    h(MouseTracker, {},
      ({ x, y }) => h('div', {},
        h('h2', {}, 'Mouse Tracker'),
        h('p', {}, `Mouse position: (${x}, ${y})`)
      )
    )
  );
};
```

This component system provides a solid foundation for building complex, interactive user interfaces while maintaining clean, readable, and maintainable code.
