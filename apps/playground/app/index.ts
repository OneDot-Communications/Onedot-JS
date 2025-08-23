/**
 * ONEDOT-JS Playground Application
 * Demonstrates framework capabilities
 */
import {
  BaseComponent,
  bootstrap,
  Component,
  Container,
  Injectable,
  ReactiveState,
  Router
} from '../../../packages/core/src';

// Example Service
@Injectable()
export class ApiService {
  private baseUrl = 'https://api.example.com';

  async fetchData(endpoint: string): Promise<any> {
    console.log(`Fetching data from ${this.baseUrl}/${endpoint}`);

    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36),
          timestamp: new Date().toISOString(),
          data: `Mock data from ${endpoint}`
        });
      }, 1000);
    });
  }
}

// Example Component
@Component({
  selector: 'app-hello',
  template: `
    <div class="hello-component">
      <h1>{{title}}</h1>
      <p>{{message}}</p>
      <button onclick="{{updateCounter}}">Count: {{counter}}</button>
    </div>
  `,
  styles: [`
    .hello-component {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      background: #f9f9f9;
    }
  `]
})
export class HelloComponent extends BaseComponent {
  private counter = new ReactiveState(0);
  private title = 'Hello ONEDOT-JS!';
  private message = 'Welcome to the next-generation TypeScript framework';

  constructor(private apiService: ApiService) {
    super();
    this.loadData();
  }

  render(): string {
    return `
      <div class="hello-component">
        <h1>${this.title}</h1>
        <p>${this.message}</p>
        <button onclick="this.updateCounter()">Count: ${this.counter.get()}</button>
        <div id="data-display"></div>
      </div>
    `;
  }

  private updateCounter(): void {
    this.counter.set(this.counter.get() + 1);
    console.log(`Counter updated to: ${this.counter.get()}`);
  }

  private async loadData(): Promise<void> {
    try {
      const data = await this.apiService.fetchData('users');
      console.log('Loaded data:', data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }
}

// Example App Component
@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent extends BaseComponent {
  render(): string {
    return `
      <div class="app">
        <header>
          <nav>
            <a href="/" onclick="router.navigate('/')">Home</a>
            <a href="/about" onclick="router.navigate('/about')">About</a>
            <a href="/contact" onclick="router.navigate('/contact')">Contact</a>
          </nav>
        </header>
        <main>
          <div id="router-outlet">
            <!-- Router content will be rendered here -->
          </div>
        </main>
      </div>
    `;
  }
}

// Application Bootstrap
async function main(): Promise<void> {
  console.log('Starting ONEDOT-JS Playground Application');

  // Initialize framework
  bootstrap();

  // Setup Dependency Injection
  const container = Container.getInstance();
  container.register({
    token: ApiService,
    useClass: ApiService,
    scope: 'singleton' as any
  });

  // Setup Routing
  const router = Router.getInstance();
  router.register([
    { path: '/', component: 'HelloComponent' },
    { path: '/about', component: 'AboutComponent' },
    { path: '/contact', component: 'ContactComponent' }
  ]);

  // Create and render main app
  const app = new AppComponent();
  const appContainer = document.getElementById('app');

  if (appContainer) {
    appContainer.innerHTML = app.render();
    console.log('Application rendered successfully');
  } else {
    console.error('App container not found');
  }

  // Start router
  router.onRouteChange((context) => {
    console.log('Route changed:', context.path);
    // Update router outlet with appropriate component
    updateRouterOutlet(context.path);
  });

  // Performance monitoring
  const { Profiler } = await import('../../../packages/profiler/src');
  const profiler = Profiler.getInstance();
  profiler.enable();

  // Measure app initialization
  profiler.measure('app-init', () => {
    console.log('App initialization measured');
  });

  console.log('ONEDOT-JS Playground is ready!');
}

function updateRouterOutlet(path: string): void {
  const outlet = document.getElementById('router-outlet');
  if (!outlet) return;

  switch (path) {
    case '/':
      const apiService = Container.getInstance().get(ApiService);
      const hello = new HelloComponent(apiService);
      outlet.innerHTML = hello.render();
      break;
    case '/about':
      outlet.innerHTML = '<h2>About ONEDOT-JS</h2><p>A powerful TypeScript framework</p>';
      break;
    case '/contact':
      outlet.innerHTML = '<h2>Contact</h2><p>Get in touch with us</p>';
      break;
    default:
      outlet.innerHTML = '<h2>404 - Page Not Found</h2>';
  }
}

// Start the application
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', main);
} else {
  // Node.js environment
  main().catch(console.error);
}

export { main };
