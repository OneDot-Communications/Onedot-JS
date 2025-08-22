import { h } from '@onedot/core';
import { Card } from '../components/ui/Card';

export default function AboutPage() {
  return h('div', { className: 'about-page' },
    h('section', { className: 'hero' },
      h('h1', {}, '📖 About This App'),
      h('p', {}, 'Built with the power of ONEDOT Framework')
    ),

    h('section', { className: 'content' },
      h(Card, {},
        h('h2', {}, '🎯 What is ONEDOT?'),
        h('p', {}, 
          'ONEDOT is a modern, reactive web framework that provides ',
          'a declarative approach to building user interfaces. It combines ',
          'the best parts of reactive programming with a simple, intuitive API.'
        )
      ),

      h(Card, {},
        h('h2', {}, '🚀 Key Benefits'),
        h('ul', {},
          h('li', {}, '⚡ Lightning-fast reactivity with fine-grained updates'),
          h('li', {}, '🧭 File-based routing for intuitive navigation'),
          h('li', {}, '🎨 Powerful CSS-in-JS with theming support'),
          h('li', {}, '📱 Full TypeScript support out of the box'),
          h('li', {}, '🔧 Zero-config development experience'),
          h('li', {}, '🧪 Built-in testing utilities and patterns')
        )
      ),

      h(Card, {},
        h('h2', {}, '🛠️ Technology Stack'),
        h('div', { className: 'tech-stack' },
          h('div', { className: 'tech-item' },
            h('strong', {}, 'Frontend: '),
            h('span', {}, 'ONEDOT Framework')
          ),
          h('div', { className: 'tech-item' },
            h('strong', {}, 'Language: '),
            h('span', {}, 'TypeScript')
          ),
          h('div', { className: 'tech-item' },
            h('strong', {}, 'Styling: '),
            h('span', {}, 'CSS-in-JS with @onedot/style')
          ),
          h('div', { className: 'tech-item' },
            h('strong', {}, 'Bundler: '),
            h('span', {}, '@onedot/bundler')
          ),
          h('div', { className: 'tech-item' },
            h('strong', {}, 'Testing: '),
            h('span', {}, '@onedot/tester')
          )
        )
      ),

      h(Card, {},
        h('h2', {}, '📚 Learn More'),
        h('p', {}, 'Ready to dive deeper? Check out these resources:'),
        h('ul', {},
          h('li', {}, 
            h('a', { 
              href: 'https://onedotjs.dev/docs',
              target: '_blank',
              rel: 'noopener noreferrer'
            }, '📖 Official Documentation')
          ),
          h('li', {}, 
            h('a', { 
              href: 'https://github.com/onedotjs/onedot',
              target: '_blank',
              rel: 'noopener noreferrer'
            }, '💻 GitHub Repository')
          ),
          h('li', {}, 
            h('a', { 
              href: 'https://onedotjs.dev/examples',
              target: '_blank',
              rel: 'noopener noreferrer'
            }, '🎯 Examples & Tutorials')
          )
        )
      )
    )
  );
}
