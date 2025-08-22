import { UniversalComponent } from '../../packages/renderer/src/universal-component';
import { AndroidRenderer } from '../../packages/renderer/src/native/android';
import { DesktopRenderer } from '../../packages/renderer/src/native/desktop';

let count = 0;

function render(platform: any) {
  const rootConfig = { id: 'root', style: { width: 300, height: 200, backgroundColor: '#f0f0f0' } };
  const counterView = UniversalComponent.createView(rootConfig, platform);
  const textConfig = { id: 'counterText', text: `Count: ${count}`, font: { size: 24 }, color: '#333' };
  const textView = UniversalComponent.createText(textConfig, platform);
  const buttonConfig = { id: 'incBtn', text: 'Increment', style: { width: 100, height: 40, backgroundColor: '#007bff', color: '#fff' }, onClick: () => { count++; rerender(platform); } };
  const buttonView = UniversalComponent.createButton(buttonConfig, platform);
  UniversalComponent.addView(counterView, textView, platform);
  UniversalComponent.addView(counterView, buttonView, platform);
  return counterView;
}

function rerender(platform: any) {
  // In a real app, this would update the view tree
  render(platform);
}

export function runAndroidCounterApp() {
  render(AndroidRenderer.getPlatform());
}

export function runDesktopCounterApp() {
  render(DesktopRenderer.getPlatform());
}
