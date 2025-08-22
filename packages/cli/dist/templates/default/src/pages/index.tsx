import { h, useState } from '@onedot/core';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function HomePage() {
  const [count, setCount] = useState(0);

  return h('div', { className: 'home-page' },
    h('section', { className: 'hero' },
      h('h2', {}, '🚀 Welcome to Your ONEDOT App'),
      h('p', {}, 'Start building amazing web applications with reactive components!')
    ),
    
    h('section', { className: 'demo' },
      h('h3', {}, '🎮 Interactive Demo'),
      h(Card, {},
        h('div', { className: 'counter-demo' },
          h('h4', {}, `Count: ${count}`),
          h('div', { className: 'button-group' },
            h(Button, { 
              variant: 'secondary',
              onClick: () => setCount(count - 1)
            }, '➖ Decrease'),
            h(Button, { 
              onClick: () => setCount(count + 1)
            }, '➕ Increase'),
            h(Button, { 
              variant: 'outline',
              onClick: () => setCount(0)
            }, '🔄 Reset')
          )
        )
      )
    ),
    
    h('section', { className: 'features' },
      h('h3', {}, '✨ Framework Features'),
      h('div', { className: 'feature-grid' },
        h(Card, {},
          h('div', { className: 'feature-icon' }, '⚡'),
          h('h4', {}, 'Reactive'),
          h('p', {}, 'Fine-grained reactivity with signals and computed values')
        ),
        h(Card, {},
          h('div', { className: 'feature-icon' }, '🧭'),
          h('h4', {}, 'File-based Routing'),
          h('p', {}, 'Automatic route generation from your file structure')
        ),
        h(Card, {},
          h('div', { className: 'feature-icon' }, '🎨'),
          h('h4', {}, 'CSS-in-JS'),
          h('p', {}, 'Type-safe styling with powerful theming support')
        ),
        h(Card, {},
          h('div', { className: 'feature-icon' }, '🔥'),
          h('h4', {}, 'Hot Reload'),
          h('p', {}, 'Instant updates during development with HMR')
        ),
        h(Card, {},
          h('div', { className: 'feature-icon' }, '📱'),
          h('h4', {}, 'TypeScript'),
          h('p', {}, 'Full type safety and excellent developer experience')
        ),
        h(Card, {},
          h('div', { className: 'feature-icon' }, '🧪'),
          h('h4', {}, 'Testing Ready'),
          h('p', {}, 'Built-in testing utilities and best practices')
        )
      )
    ),

    h('section', { className: 'next-steps' },
      h('h3', {}, '🛠️ Next Steps'),
      h('div', { className: 'steps-grid' },
        h(Card, {},
          h('h4', {}, '1. Explore the Code'),
          h('p', {}, 'Check out the components in '),
          h('code', {}, 'src/components/'),
          h('p', {}, ' to see how they work.')
        ),
        h(Card, {},
          h('h4', {}, '2. Add New Pages'),
          h('p', {}, 'Create new '),
          h('code', {}, '.tsx'),
          h('p', {}, ' files in '),
          h('code', {}, 'src/pages/'),
          h('p', {}, ' for automatic routing.')
        ),
        h(Card, {},
          h('h4', {}, '3. Customize Styles'),
          h('p', {}, 'Edit '),
          h('code', {}, 'src/styles/'),
          h('p', {}, ' to customize the look and feel.')
        )
      )
    )
  );
}
