# 📚 Examples & Tutorials - ONEDOT Framework

This collection provides practical examples and step-by-step tutorials to help you master ONEDOT Framework development. From simple components to complex applications, these examples cover real-world scenarios.

## 🚀 Quick Start Examples

### Hello World

```typescript
// src/pages/index.ts
import { h } from '@onedot/core';

export default function HomePage() {
  return h('div', {},
    h('h1', {}, '🔥 Hello ONEDOT!'),
    h('p', {}, 'Welcome to the next-generation framework!')
  );
}
```

### Interactive Counter

```typescript
// src/components/Counter.ts
import { h, useState, Component } from '@onedot/core';

export const Counter: Component = () => {
  const [count, setCount] = useState(0);

  return h('div', { style: { textAlign: 'center', padding: '20px' } },
    h('h2', {}, `Count: ${count}`),
    h('button', { 
      onClick: () => setCount(count - 1) 
    }, '-'),
    h('button', { 
      onClick: () => setCount(count + 1) 
    }, '+'),
    h('button', { 
      onClick: () => setCount(0) 
    }, 'Reset')
  );
};
```

## 📝 Form Examples

### Contact Form with Validation

```typescript
// src/components/ContactForm.ts
import { h, useState, Component, css } from '@onedot/core';

const formStyles = css({
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  textarea: {
    minHeight: '100px',
    resize: 'vertical',
  },
  error: {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    '&:hover': {
      backgroundColor: '#2563eb',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  success: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #10b981',
    borderRadius: '6px',
    padding: '15px',
    color: '#065f46',
    textAlign: 'center',
  },
});

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export const ContactForm: Component = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData) => (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormData({ ...formData, [field]: target.value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted:', formData);
      setIsSubmitted(true);
    } catch (error) {
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return h('div', { className: formStyles.container },
      h('div', { className: formStyles.success },
        h('h3', {}, '✅ Message Sent!'),
        h('p', {}, 'Thank you for your message. We\'ll get back to you soon.'),
        h('button', { 
          className: formStyles.button,
          onClick: resetForm 
        }, 'Send Another Message')
      )
    );
  }

  return h('div', { className: formStyles.container },
    h('h2', {}, 'Contact Us'),
    h('form', { onSubmit: handleSubmit },
      h('div', { className: formStyles.formGroup },
        h('label', { className: formStyles.label }, 'Name'),
        h('input', {
          className: formStyles.input,
          type: 'text',
          value: formData.name,
          onChange: handleChange('name'),
          placeholder: 'Your full name',
        }),
        errors.name && h('div', { className: formStyles.error }, errors.name)
      ),

      h('div', { className: formStyles.formGroup },
        h('label', { className: formStyles.label }, 'Email'),
        h('input', {
          className: formStyles.input,
          type: 'email',
          value: formData.email,
          onChange: handleChange('email'),
          placeholder: 'your.email@example.com',
        }),
        errors.email && h('div', { className: formStyles.error }, errors.email)
      ),

      h('div', { className: formStyles.formGroup },
        h('label', { className: formStyles.label }, 'Subject'),
        h('input', {
          className: formStyles.input,
          type: 'text',
          value: formData.subject,
          onChange: handleChange('subject'),
          placeholder: 'What is this about?',
        }),
        errors.subject && h('div', { className: formStyles.error }, errors.subject)
      ),

      h('div', { className: formStyles.formGroup },
        h('label', { className: formStyles.label }, 'Message'),
        h('textarea', {
          className: `${formStyles.input} ${formStyles.textarea}`,
          value: formData.message,
          onChange: handleChange('message'),
          placeholder: 'Tell us more about your inquiry...',
        }),
        errors.message && h('div', { className: formStyles.error }, errors.message)
      ),

      h('button', {
        className: formStyles.button,
        type: 'submit',
        disabled: isSubmitting,
      }, isSubmitting ? 'Sending...' : 'Send Message')
    )
  );
};
```

## 🛒 E-commerce Examples

### Product Card Component

```typescript
// src/components/ProductCard.ts
import { h, Component, css } from '@onedot/core';

const cardStyles = css({
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1f2937',
  },
  description: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  price: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#059669',
    marginBottom: '16px',
  },
  button: {
    width: '100%',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2563eb',
    },
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
});

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isOnSale?: boolean;
  originalPrice?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: Component<ProductCardProps> = ({ 
  product, 
  onAddToCart 
}) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return h('div', { className: cardStyles.card, style: { position: 'relative' } },
    product.isOnSale && h('div', { className: cardStyles.badge }, 'SALE'),
    
    h('img', {
      className: cardStyles.image,
      src: product.image,
      alt: product.name,
    }),
    
    h('div', { className: cardStyles.content },
      h('h3', { className: cardStyles.title }, product.name),
      h('p', { className: cardStyles.description }, product.description),
      
      h('div', { className: cardStyles.price },
        product.isOnSale && product.originalPrice && h('span', {
          style: { 
            textDecoration: 'line-through', 
            color: '#9ca3af',
            marginRight: '8px',
            fontSize: '16px',
          }
        }, formatPrice(product.originalPrice)),
        formatPrice(product.price)
      ),
      
      h('button', {
        className: cardStyles.button,
        onClick: () => onAddToCart(product),
      }, 'Add to Cart')
    )
  );
};
```

### Shopping Cart Component

```typescript
// src/components/ShoppingCart.ts
import { h, Component, css } from '@onedot/core';
import { cartStore } from '../stores/cartStore';

const cartStyles = css({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  cart: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '400px',
    backgroundColor: 'white',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '40px 20px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  itemImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginRight: '12px',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    marginBottom: '4px',
  },
  itemPrice: {
    color: '#059669',
    fontWeight: '600',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  quantityButton: {
    width: '24px',
    height: '24px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: '20px',
    textAlign: 'center',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '18px',
    fontWeight: '600',
  },
  checkoutButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
});

export const ShoppingCart: Component = () => {
  if (!cartStore.isOpen) {
    return null;
  }

  const handleCheckout = () => {
    alert(`Proceeding to checkout with ${cartStore.totalItems} items!`);
    cartStore.closeCart();
  };

  return h('div', {},
    h('div', { 
      className: cartStyles.overlay,
      onClick: () => cartStore.closeCart()
    }),
    
    h('div', { className: cartStyles.cart },
      h('div', { className: cartStyles.header },
        h('h2', { className: cartStyles.title }, 
          `Cart (${cartStore.totalItems})`
        ),
        h('button', {
          className: cartStyles.closeButton,
          onClick: () => cartStore.closeCart(),
        }, '×')
      ),
      
      h('div', { className: cartStyles.content },
        cartStore.isEmpty ? (
          h('div', { className: cartStyles.empty },
            h('p', {}, 'Your cart is empty'),
            h('p', {}, 'Add some products to get started!')
          )
        ) : (
          cartStore.items.map(item =>
            h('div', { key: item.id, className: cartStyles.item },
              h('img', {
                className: cartStyles.itemImage,
                src: item.image || '/placeholder.jpg',
                alt: item.name,
              }),
              h('div', { className: cartStyles.itemDetails },
                h('div', { className: cartStyles.itemName }, item.name),
                h('div', { className: cartStyles.itemPrice }, 
                  `$${item.price.toFixed(2)}`
                ),
                h('div', { className: cartStyles.quantityControls },
                  h('button', {
                    className: cartStyles.quantityButton,
                    onClick: () => cartStore.updateQuantity(item.id, item.quantity - 1),
                  }, '−'),
                  h('span', { className: cartStyles.quantity }, item.quantity),
                  h('button', {
                    className: cartStyles.quantityButton,
                    onClick: () => cartStore.updateQuantity(item.id, item.quantity + 1),
                  }, '+'),
                  h('button', {
                    className: cartStyles.quantityButton,
                    onClick: () => cartStore.removeItem(item.id),
                    style: { marginLeft: '8px', color: '#ef4444' },
                  }, '🗑')
                )
              )
            )
          )
        )
      ),
      
      !cartStore.isEmpty && h('div', { className: cartStyles.footer },
        h('div', { className: cartStyles.total },
          h('span', {}, 'Total:'),
          h('span', {}, `$${cartStore.total.toFixed(2)}`)
        ),
        h('button', {
          className: cartStyles.checkoutButton,
          onClick: handleCheckout,
        }, 'Proceed to Checkout')
      )
    )
  );
};
```

## 📱 Dashboard Examples

### Analytics Dashboard

```typescript
// src/components/Dashboard.ts
import { h, useState, useEffect, Component, css } from '@onedot/core';

const dashboardStyles = css({
  container: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '8px',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
  },
  cardChange: {
    fontSize: '14px',
    marginTop: '8px',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  },
});

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeText: string;
}

export const Dashboard: Component = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMetrics([
      {
        title: 'Total Revenue',
        value: '$24,567',
        change: 12.5,
        changeText: 'vs last month',
      },
      {
        title: 'Active Users',
        value: '1,234',
        change: -2.1,
        changeText: 'vs last week',
      },
      {
        title: 'Conversion Rate',
        value: '3.2%',
        change: 0.8,
        changeText: 'vs last month',
      },
      {
        title: 'Total Orders',
        value: 892,
        change: 15.3,
        changeText: 'vs last month',
      },
    ]);
    
    setLoading(false);
  }, []);

  if (loading) {
    return h('div', { className: dashboardStyles.container },
      h('div', {}, 'Loading dashboard...')
    );
  }

  return h('div', { className: dashboardStyles.container },
    h('div', { className: dashboardStyles.header },
      h('h1', { className: dashboardStyles.title }, 'Analytics Dashboard'),
      h('p', { className: dashboardStyles.subtitle }, 
        'Track your business performance and metrics'
      )
    ),
    
    h('div', { className: dashboardStyles.grid },
      metrics.map((metric, index) =>
        h('div', { key: index, className: dashboardStyles.card },
          h('div', { className: dashboardStyles.cardTitle }, metric.title),
          h('div', { className: dashboardStyles.cardValue }, metric.value),
          h('div', { 
            className: `${dashboardStyles.cardChange} ${
              metric.change >= 0 ? dashboardStyles.positive : dashboardStyles.negative
            }`
          }, 
            `${metric.change >= 0 ? '+' : ''}${metric.change}% ${metric.changeText}`
          )
        )
      )
    ),
    
    h('div', { className: dashboardStyles.card },
      h('h3', {}, 'Recent Activity'),
      h('p', {}, 'Chart and activity feed would go here...')
    )
  );
};
```

## 🔍 Search Examples

### Search with Filters

```typescript
// src/components/SearchPage.ts
import { h, useState, useEffect, Component, css } from '@onedot/core';

const searchStyles = css({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
  },
  searchButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filter: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '20px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  resultCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  noResults: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '40px',
  },
});

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Getting Started with ONEDOT',
    description: 'Learn the basics of building apps with ONEDOT Framework',
    category: 'Tutorial',
    tags: ['beginner', 'setup', 'guide'],
  },
  {
    id: '2',
    title: 'Advanced State Management',
    description: 'Master complex state patterns in ONEDOT applications',
    category: 'Tutorial',
    tags: ['advanced', 'state', 'reactive'],
  },
  {
    id: '3',
    title: 'Component Best Practices',
    description: 'Tips and tricks for building reusable components',
    category: 'Guide',
    tags: ['components', 'best-practices', 'design'],
  },
  {
    id: '4',
    title: 'Testing Your ONEDOT App',
    description: 'Comprehensive guide to testing strategies',
    category: 'Guide',
    tags: ['testing', 'quality', 'automation'],
  },
];

const categories = ['All', 'Tutorial', 'Guide', 'Reference'];

export const SearchPage: Component = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = mockResults;
    
    // Filter by query
    if (query.trim()) {
      filtered = filtered.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(result => result.category === selectedCategory);
    }
    
    setResults(filtered);
    setLoading(false);
  };

  useEffect(() => {
    performSearch();
  }, [selectedCategory]);

  const handleSearch = (event: Event) => {
    event.preventDefault();
    performSearch();
  };

  return h('div', { className: searchStyles.container },
    h('form', { className: searchStyles.searchBar, onSubmit: handleSearch },
      h('input', {
        className: searchStyles.searchInput,
        type: 'text',
        placeholder: 'Search documentation...',
        value: query,
        onChange: (e) => setQuery((e.target as HTMLInputElement).value),
      }),
      h('button', { 
        className: searchStyles.searchButton,
        type: 'submit' 
      }, 'Search')
    ),
    
    h('div', { className: searchStyles.filters },
      categories.map(category =>
        h('button', {
          key: category,
          className: `${searchStyles.filter} ${
            selectedCategory === category ? searchStyles.activeFilter : ''
          }`,
          onClick: () => setSelectedCategory(category),
        }, category)
      )
    ),
    
    loading ? (
      h('div', {}, 'Searching...')
    ) : results.length > 0 ? (
      h('div', { className: searchStyles.results },
        results.map(result =>
          h('div', { key: result.id, className: searchStyles.resultCard },
            h('h3', {}, result.title),
            h('p', { style: { color: '#6b7280', marginBottom: '8px' } }, 
              result.description
            ),
            h('div', { style: { fontSize: '12px', color: '#9ca3af' } },
              `Category: ${result.category} | Tags: ${result.tags.join(', ')}`
            )
          )
        )
      )
    ) : (
      h('div', { className: searchStyles.noResults },
        h('p', {}, 'No results found'),
        h('p', {}, 'Try adjusting your search terms or filters')
      )
    )
  );
};
```

## 🎨 Animation Examples

### Animated List

```typescript
// src/components/AnimatedList.ts
import { h, useState, Component, css } from '@onedot/core';

const listStyles = css({
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px',
  },
  addForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    animation: 'slideIn 0.3s ease-out',
    transform: 'translateX(0)',
    opacity: 1,
    transition: 'all 0.3s ease',
  },
  removing: {
    transform: 'translateX(100%)',
    opacity: 0,
  },
  removeButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  '@keyframes slideIn': {
    from: {
      transform: 'translateX(-100%)',
      opacity: 0,
    },
    to: {
      transform: 'translateX(0)',
      opacity: 1,
    },
  },
});

interface ListItem {
  id: string;
  text: string;
  isRemoving?: boolean;
}

export const AnimatedList: Component = () => {
  const [items, setItems] = useState<ListItem[]>([
    { id: '1', text: 'Welcome to ONEDOT!' },
    { id: '2', text: 'Add some items below' },
  ]);
  const [newItemText, setNewItemText] = useState('');

  const addItem = (event: Event) => {
    event.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ListItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
    };

    setItems([...items, newItem]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    // Mark item as removing
    setItems(items.map(item => 
      item.id === id ? { ...item, isRemoving: true } : item
    ));

    // Remove after animation
    setTimeout(() => {
      setItems(items.filter(item => item.id !== id));
    }, 300);
  };

  return h('div', { className: listStyles.container },
    h('h2', {}, 'Animated Todo List'),
    
    h('form', { className: listStyles.addForm, onSubmit: addItem },
      h('input', {
        className: listStyles.input,
        type: 'text',
        placeholder: 'Add new item...',
        value: newItemText,
        onChange: (e) => setNewItemText((e.target as HTMLInputElement).value),
      }),
      h('button', { 
        className: listStyles.addButton,
        type: 'submit' 
      }, 'Add')
    ),
    
    h('ul', { className: listStyles.list },
      items.map(item =>
        h('li', {
          key: item.id,
          className: `${listStyles.item} ${item.isRemoving ? listStyles.removing : ''}`,
        },
          h('span', {}, item.text),
          h('button', {
            className: listStyles.removeButton,
            onClick: () => removeItem(item.id),
          }, 'Remove')
        )
      )
    )
  );
};
```

These examples demonstrate practical, real-world usage patterns of the ONEDOT Framework. Each example includes styling, interactivity, and follows best practices for maintainable code.
