import { VNode } from './vdom';
export interface ComponentProps {
  children?: VNode[];
  [key: string]: any;
}

export interface Component {
  render(): VNode;
  componentDidMount?(): void;
  componentDidUpdate?(prevProps: ComponentProps): void;
  componentWillUnmount?(): void;
}

export interface FunctionalComponent {
  (props: ComponentProps): VNode;
}

export type ComponentType = Component | FunctionalComponent;
