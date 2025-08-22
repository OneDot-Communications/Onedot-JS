import { FunctionalComponent, ComponentProps } from './component';
import { VNode } from './vdom';

export function createFunctionalComponent(
  renderFn: (props: ComponentProps) => VNode
): FunctionalComponent {
  return renderFn;
}
