import { ComponentType, ComponentProps } from './component';
export class VNode {
  constructor(
    public type: string | ComponentType,
    public props: ComponentProps,
    public children: VNode[]
  ) {}

  isComponent(): boolean {
    return typeof this.type === 'function';
  }
}

export function createElement(
  type: string | ComponentType,
  props: ComponentProps = {},
  ...children: (VNode | string)[]
): VNode {
  const normalizedChildren = children.map(child => 
    typeof child === 'string' ? new VNode('#text', {}, [child as any]) : child
  );

  return new VNode(type, { ...props, children: normalizedChildren }, normalizedChildren);
}
