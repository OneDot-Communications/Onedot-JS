// ONEDOT Framework Playground Application
import { h, render, useState, useEffect } from '../../packages/core/src/index.js';
import { webHost } from '../../packages/runtime/src/webHost.js';
import { css } from '../../packages/style/src/index.js';
import { mark, withMeasure } from '../../packages/profiler/src/index.js';

// Performance monitoring
mark('app-start');

// Styled components with CSS-in-JS
const styles = {
  app: css({
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    lineHeight: '1.6'
  }),
  
  header: css({
    textAlign: 'center',
    marginBottom: '40px',
    '& h1': {
      color: '#2563eb',
      fontSize: '3rem',
      fontWeight: '700',
      margin: '0 0 10px 0'
    },
    '& p': {
      color: '#64748b',
      fontSize: '1.2rem',
      margin: '0'
    }
  }),
  
  section: css({
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  }),
  
  counter: css({
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    '& .count': {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1e40af'
    }
  }),
  
  button: css({
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#2563eb',
      transform: 'translateY(-1px)'
    },
    '&:active': {
      transform: 'translateY(0)'
    }
  }),
  
  todoList: css({
    '& input': {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '16px',
      marginBottom: '15px'
    },
    '& ul': {
      listStyle: 'none',
      padding: '0',
      margin: '0'
    },
    '& li': {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 0',
      borderBottom: '1px solid #e5e7eb'
    },
    '& .todo-text': {
      flex: '1'
    },
    '& .todo-done': {
      textDecoration: 'line-through',
      color: '#6b7280'
    }
  })
};

// Counter Component
function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => withMeasure('counter-increment', () => {
    setCount(count + 1);
  });
  
  const decrement = () => withMeasure('counter-decrement', () => {
    setCount(count - 1);
  });
  
  return h('div', { className: styles.counter }, 
    h('button', { className: styles.button, onClick: decrement }, '−'),
    h('span', { className: 'count' }, count),
    h('button', { className: styles.button, onClick: increment }, '+')
  );
}

// Todo Item Component
function TodoItem({ todo, onToggle, onRemove }: any) {
  return h('li', {},
    h('input', {
      type: 'checkbox',
      checked: todo.done,
      onChange: () => onToggle(todo.id)
    }),
    h('span', {
      className: `todo-text ${todo.done ? 'todo-done' : ''}`
    }, todo.text),
    h('button', {
      className: styles.button,
      onClick: () => onRemove(todo.id)
    }, 'Remove')
  );
}

// Todo List Component
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn ONEDOT Framework', done: false },
    { id: 2, text: 'Build amazing apps', done: false }
  ]);
  const [newTodo, setNewTodo] = useState('');
  
  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        done: false
      };
      setTodos([...todos, todo]);
      setNewTodo('');
    }
  };
  
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };
  
  const removeTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };
  
  return h('div', { className: styles.todoList },
    h('input', {
      type: 'text',
      placeholder: 'Add new todo...',
      value: newTodo,
      onInput: (e: any) => setNewTodo(e.target.value),
      onKeyPress: handleKeyPress
    }),
    h('button', { className: styles.button, onClick: addTodo }, 'Add Todo'),
    h('ul', {},
      ...todos.map(todo => 
        h(TodoItem, {
          key: todo.id,
          todo,
          onToggle: toggleTodo,
          onRemove: removeTodo
        })
      )
    )
  );
}

// Timer Component with useEffect
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  });
  
  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setSeconds(0);
    setIsRunning(false);
  };
  
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };
  
  return h('div', { className: styles.counter },
    h('div', { className: 'count' }, formatTime(seconds)),
    h('button', { className: styles.button, onClick: toggle }, 
      isRunning ? 'Pause' : 'Start'
    ),
    h('button', { className: styles.button, onClick: reset }, 'Reset')
  );
}

// Feature showcase component
function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState('counter');
  
  const tabs = [
    { id: 'counter', label: 'Counter', component: Counter },
    { id: 'todos', label: 'Todo List', component: TodoList },
    { id: 'timer', label: 'Timer', component: Timer }
  ];
  
  const activeComponent = tabs.find(tab => tab.id === activeTab)?.component || Counter;
  
  return h('div', {},
    h('div', { 
      style: 'display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;' 
    },
      ...tabs.map(tab =>
        h('button', {
          className: styles.button,
          style: activeTab === tab.id ? 'background-color: #1d4ed8;' : 'background-color: #9ca3af;',
          onClick: () => setActiveTab(tab.id)
        }, tab.label)
      )
    ),
    h(activeComponent, {})
  );
}

// Main App Component
function App() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    mark('app-mounted');
    setMounted(true);
    
    // Log framework info
    console.log('🚀 ONEDOT Framework Playground');
    console.log('Framework features:');
    console.log('✅ Reactive state management');
    console.log('✅ Component system with hooks');
    console.log('✅ CSS-in-JS styling');
    console.log('✅ Performance profiling');
    console.log('✅ Server-side rendering ready');
  });
  
  if (!mounted) {
    return h('div', { className: styles.app }, 
      h('div', {}, 'Loading ONEDOT Framework...')
    );
  }
  
  return h('div', { className: styles.app },
    h('header', { className: styles.header },
      h('h1', {}, '🔥 ONEDOT Framework'),
      h('p', {}, 'Next-generation reactive JavaScript framework')
    ),
    
    h('section', { className: styles.section },
      h('h2', {}, '🎮 Interactive Demo'),
      h('p', {}, 'Explore the framework features with these interactive examples:'),
      h(FeatureShowcase, {})
    ),
    
    h('section', { className: styles.section },
      h('h2', {}, '⚡ Performance'),
      h('p', {}, 'Built for speed with fine-grained reactivity and minimal overhead.'),
      h('p', {}, 'Check the browser console for performance markers.')
    ),
    
    h('section', { className: styles.section },
      h('h2', {}, '🛠️ Features'),
      h('ul', {},
        h('li', {}, '📦 Zero-config bundling'),
        h('li', {}, '🔄 Hot module replacement'),
        h('li', {}, '🎨 CSS-in-JS styling'),
        h('li', {}, '📊 Built-in profiling'),
        h('li', {}, '🌐 SSR/SSG support'),
        h('li', {}, '🔒 Secure sandbox execution'),
        h('li', {}, '📱 Edge runtime compatible')
      )
    ),
    
    h('footer', { 
      style: 'text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;' 
    },
      h('p', {}, '© 2024 ONEDOT Framework - Built for the modern web')
    )
  );
}

// Performance tracking
mark('app-ready');

// Mount the application
const appElement = document.getElementById('app');
if (appElement) {
  withMeasure('app-render', () => {
    render(h(App, {}), webHost as any, appElement);
  });
  mark('app-complete');
} else {
  console.error('❌ Could not find #app element');
}

// Development tools
if (typeof window !== 'undefined') {
  (window as any).__ONEDOT_PLAYGROUND__ = {
    version: '1.0.0',
    performance: {
      marks: () => performance.getEntriesByType('mark'),
      measures: () => performance.getEntriesByType('measure')
    },
    framework: {
      name: 'ONEDOT',
      components: ['Counter', 'TodoList', 'Timer', 'FeatureShowcase', 'App']
    }
  };
  
  console.log('🔧 Development tools available at window.__ONEDOT_PLAYGROUND__');
}
