import { render } from '@onedotjs/renderer/web';
import { Store } from '@onedotjs/core';
import { AppModule } from './app.module';
import { CounterComponent } from './counter.component';

const injector = AppModule.createInjector();
const reducer = injector.get('REDUCER');
const store = new Store({ count: 0 }, reducer, injector);

const counter = new CounterComponent({});
(counter as any).injector = injector;

const rootElement = document.getElementById('root') as HTMLElement;
render(counter, rootElement);
