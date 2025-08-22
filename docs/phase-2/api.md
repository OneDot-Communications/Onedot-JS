# API Reference: Native & Universal

## UniversalComponent
- `createView(config, platform)`
- `createText(config, platform)`
- `createImage(config, platform)`
- `createTextInput(config, platform)`
- `createButton(config, platform)`
- `createScrollView(config, platform)`
- `updateView(view, props, platform)`
- ...and more

## NativeModuleRegistry
- `register(module)`
- `get(name)`

## Profiler
- `mark(label)`
- `measure(label, startLabel)`

## Scheduler
- `schedule(callback, delay)`

## MemoryManager
- `getMemoryUsage()`

## TestRunner
- `addTest(test)`
- `runAll()`

## Assertions
- `assertEqual(actual, expected, message)`
- `assertTrue(value, message)`
