import * as chalk from 'chalk';
import * as ora from 'ora';
import { MigrationManager, MigrationOptions, MigrationResult } from '../common';

export interface ReactMigrationOptions extends MigrationOptions {
  framework: 'react';
  transformHooks?: boolean;
  transformContext?: boolean;
  transformRedux?: boolean;
  transformRouter?: boolean;
  transformStyledComponents?: boolean;
  transformMaterialUI?: boolean;
  transformAntDesign?: boolean;
  transformNextJS?: boolean;
  transformGatsby?: boolean;
  transformCreateReactApp?: boolean;
}

export class ReactMigrator {
  private manager: MigrationManager;

  constructor(manager: MigrationManager) {
    this.manager = manager;
  }

  public async migrate(options: ReactMigrationOptions): Promise<MigrationResult> {
    console.log(chalk.blue('Starting React to ONEDOT-JS migration...'));

    const startTime = Date.now();
    const spinner = ora('Initializing migration...').start();

    try {
      // Load config if provided
      if (options.configPath) {
        await this.manager.loadConfig(options.configPath);
      }

      // Load custom transforms if provided
      if (options.customTransforms && options.customTransforms.length > 0) {
        await this.manager.loadCustomTransforms(options.customTransforms);
      }

      // Initialize project
      await this.manager.initializeProject(options.sourcePath);

      // Register React-specific transforms
      this.registerReactTransforms();

      spinner.succeed('Migration initialized');

      // Execute transforms
      const result = await this.manager.executeTransforms(options);

      // Generate migration summary
      this.generateSummary(result, options);

      return result;
    } catch (error) {
      spinner.fail(`Migration failed: ${error}`);

      return {
        success: false,
        message: `Migration failed: ${error}`,
        files: {
          processed: 0,
          transformed: 0,
          failed: 0,
          skipped: 0
        },
        errors: [error.message],
        warnings: [],
        duration: Date.now() - startTime
      };
    }
  }

  private registerReactTransforms(): void {
    // Register React-specific transforms
    this.manager.registerTransform('react-components', this.transformReactComponents.bind(this));
    this.manager.registerTransform('react-hooks', this.transformReactHooks.bind(this));
    this.manager.registerTransform('react-context', this.transformReactContext.bind(this));
    this.manager.registerTransform('react-redux', this.transformReactRedux.bind(this));
    this.manager.registerTransform('react-router', this.transformReactRouter.bind(this));
    this.manager.registerTransform('styled-components', this.transformStyledComponents.bind(this));
    this.manager.registerTransform('material-ui', this.transformMaterialUI.bind(this));
    this.manager.registerTransform('ant-design', this.transformAntDesign.bind(this));
    this.manager.registerTransform('next-js', this.transformNextJS.bind(this));
    this.manager.registerTransform('gatsby', this.transformGatsby.bind(this));
    this.manager.registerTransform('create-react-app', this.transformCreateReactApp.bind(this));
  }

  private async transformReactComponents(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find React components
      const functionComponents = sourceFile.getFunctions().filter((fn: any) => {
        return fn.getName() && fn.getName()[0] === fn.getName()[0].toUpperCase();
      });

      const classComponents = sourceFile.getClasses().filter((cls: any) => {
        const decorators = cls.getDecorators();
        return decorators.some((decorator: any) => decorator.getName() === 'Component');
      });

      // Transform function components
      for (const component of functionComponents) {
        await this.transformFunctionComponent(component);
        result.transformed = true;
      }

      // Transform class components
      for (const component of classComponents) {
        await this.transformClassComponent(component);
        result.transformed = true;
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformFunctionComponent(component: any): Promise<void> {
    // Get component name
    const componentName = component.getName();

    // Get component parameters
    const parameters = component.getParameters();

    // Transform props parameter
    if (parameters.length > 0) {
      const propsParameter = parameters[0];
      const propsName = propsParameter.getName();

      // Add props type annotation if not present
      if (!propsParameter.getTypeNode()) {
        propsParameter.setType('any');
      }

      // Transform destructured props
      if (propsParameter.getKindName() === 'ObjectBindingPattern') {
        const bindings = propsParameter.getBindings();

        for (const binding of bindings) {
          const bindingName = binding.getName();

          // Add binding type annotation if not present
          if (!binding.getTypeNode()) {
            binding.setType('any');
          }
        }
      }
    }

    // Get component body
    const body = component.getBody();

    // Transform JSX in component body
    if (body && body.getKindName() === 'Block') {
      const jsxElements = body.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        await this.transformJsxElement(jsxElement);
      }
    }

    // Transform return statement
    const returnStatement = component.getDescendantsOfKind('ReturnStatement')[0];

    if (returnStatement) {
      const expression = returnStatement.getExpression();

      if (expression && expression.getKindName() === 'JsxElement') {
        await this.transformJsxElement(expression);
      }
    }

    // Add ONEDOT-JS component decorator
    component.addDecorator({
      name: 'Component',
      arguments: []
    });
  }

  private async transformClassComponent(component: any): Promise<void> {
    // Get component name
    const componentName = component.getName();

    // Remove React import
    const importDeclarations = component.getSourceFile().getImportDeclarations();

    for (const importDeclaration of importDeclarations) {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

      if (moduleSpecifier === 'react') {
        const namedImports = importDeclaration.getNamedImports();

        for (const namedImport of namedImports) {
          const importName = namedImport.getName();

          if (importName === 'Component') {
            namedImport.remove();
          }
        }

        // Remove import declaration if no named imports left
        if (importDeclaration.getNamedImports().length === 0) {
          importDeclaration.remove();
        }
      }
    }

    // Remove Component decorator if present
    const decorators = component.getDecorators();

    for (const decorator of decorators) {
      if (decorator.getName() === 'Component') {
        decorator.remove();
      }
    }

    // Add ONEDOT-JS component decorator
    component.addDecorator({
      name: 'Component',
      arguments: []
    });

    // Transform component methods
    await this.transformComponentMethods(component);

    // Transform JSX in render method
    const renderMethod = component.getMethod('render');

    if (renderMethod) {
      const body = renderMethod.getBody();

      if (body) {
        const jsxElements = body.getDescendantsOfKind('JsxElement');

        for (const jsxElement of jsxElements) {
          await this.transformJsxElement(jsxElement);
        }
      }
    }
  }

  private async transformComponentMethods(component: any): Promise<void> {
    // Get component methods
    const methods = component.getMethods();

    for (const method of methods) {
      const methodName = method.getName();

      // Transform lifecycle methods
      switch (methodName) {
        case 'componentDidMount':
          method.rename('onMounted');
          break;
        case 'componentDidUpdate':
          method.rename('onUpdated');
          break;
        case 'componentWillUnmount':
          method.rename('onUnmounted');
          break;
        case 'componentDidCatch':
          method.rename('onError');
          break;
        case 'shouldComponentUpdate':
          method.rename('shouldUpdate');
          break;
        case 'getDerivedStateFromProps':
          method.rename('getDerivedStateFromProps');
          break;
        case 'getSnapshotBeforeUpdate':
          method.rename('getSnapshotBeforeUpdate');
          break;
      }

      // Transform event handlers
      if (methodName.startsWith('handle')) {
        // Add event handler decorator
        method.addDecorator({
          name: 'On',
          arguments: [`'${methodName.replace('handle', '').toLowerCase()}'`]
        });
      }
    }
  }

  private async transformJsxElement(jsxElement: any): Promise<void> {
    // Get JSX element name
    const openingElement = jsxElement.getOpeningElement();
    const tagName = openingElement.getTagName();

    // Transform React elements to ONEDOT-JS elements
    if (tagName === 'Fragment') {
      openingElement.setTagName('Fragment');
    } else if (tagName.includes('.')) {
      // Transform component names
      openingElement.setTagName(tagName);
    }

    // Transform attributes
    const attributes = openingElement.getAttributes();

    for (const attribute of attributes) {
      if (attribute.getKindName() === 'JsxAttribute') {
        const attributeName = attribute.getName();

        // Transform event handlers
        if (attributeName.startsWith('on')) {
          // Transform React event handlers to ONEDOT-JS event handlers
          const newAttributeName = attributeName.replace('on', '@');
          attribute.setName(newAttributeName);
        }

        // Transform class attribute
        if (attributeName === 'className') {
          attribute.setName('class');
        }

        // Transform htmlFor attribute
        if (attributeName === 'htmlFor') {
          attribute.setName('for');
        }

        // Transform style attribute
        if (attributeName === 'style') {
          const initializer = attribute.getInitializer();

          if (initializer && initializer.getKindName() === 'JsxExpression') {
            const expression = initializer.getExpression();

            if (expression && expression.getKindName() === 'ObjectLiteralExpression') {
              // Transform style object to string
              const properties = expression.getProperties();
              const styleString = properties.map((prop: any) => {
                const name = prop.getName();
                const value = prop.getInitializer().getText();
                return `${name.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`;
              }).join('; ');

              initializer.replaceWithText(`'${styleString}'`);
            }
          }
        }
      } else if (attribute.getKindName() === 'JsxSpreadAttribute') {
        // Transform spread attributes
        const argument = attribute.getArgument();

        if (argument && argument.getKindName() === 'ObjectLiteralExpression') {
          // Transform spread object to props
          const properties = argument.getProperties();
          const newAttributes = properties.map((prop: any) => {
            const name = prop.getName();
            const value = prop.getInitializer().getText();
            return `${name}={${value}}`;
          }).join(' ');

          attribute.replaceWithText(newAttributes);
        }
      }
    }

    // Transform children
    const children = jsxElement.getJsxChildren();

    for (const child of children) {
      if (child.getKindName() === 'JsxElement') {
        await this.transformJsxElement(child);
      } else if (child.getKindName() === 'JsxExpression') {
        const expression = child.getExpression();

        if (expression && expression.getKindName() === 'JsxElement') {
          await this.transformJsxElement(expression);
        }
      }
    }
  }

  private async transformReactHooks(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find React hooks
      const variableDeclarations = sourceFile.getVariableDeclarations();

      for (const variableDeclaration of variableDeclarations) {
        const initializer = variableDeclaration.getInitializer();

        if (initializer && initializer.getKindName() === 'CallExpression') {
          const expression = initializer.getExpression();

          if (expression.getKindName() === 'Identifier') {
            const hookName = expression.getText();

            // Transform React hooks to ONEDOT-JS hooks
            switch (hookName) {
              case 'useState':
                await this.transformUseState(variableDeclaration);
                result.transformed = true;
                break;
              case 'useEffect':
                await this.transformUseEffect(variableDeclaration);
                result.transformed = true;
                break;
              case 'useContext':
                await this.transformUseContext(variableDeclaration);
                result.transformed = true;
                break;
              case 'useReducer':
                await this.transformUseReducer(variableDeclaration);
                result.transformed = true;
                break;
              case 'useCallback':
                await this.transformUseCallback(variableDeclaration);
                result.transformed = true;
                break;
              case 'useMemo':
                await this.transformUseMemo(variableDeclaration);
                result.transformed = true;
                break;
              case 'useRef':
                await this.transformUseRef(variableDeclaration);
                result.transformed = true;
                break;
              case 'useImperativeHandle':
                await this.transformUseImperativeHandle(variableDeclaration);
                result.transformed = true;
                break;
              case 'useLayoutEffect':
                await this.transformUseLayoutEffect(variableDeclaration);
                result.transformed = true;
                break;
              case 'useDebugValue':
                await this.transformUseDebugValue(variableDeclaration);
                result.transformed = true;
                break;
            }
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformUseState(variableDeclaration: any): Promise<void> {
    // Get useState arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useState to ONEDOT-JS useState
    initializer.getExpression().replaceWithText('useState');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];

      if (firstArg) {
        const type = firstArg.getText();
        variableDeclaration.setType(`[${type}, (value: ${type}) => void]`);
      }
    }
  }

  private async transformUseEffect(variableDeclaration: any): Promise<void> {
    // Get useEffect arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useEffect to ONEDOT-JS useEffect
    initializer.getExpression().replaceWithText('useEffect');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('void');
    }
  }

  private async transformUseContext(variableDeclaration: any): Promise<void> {
    // Get useContext arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useContext to ONEDOT-JS useContext
    initializer.getExpression().replaceWithText('useContext');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];

      if (firstArg) {
        const type = firstArg.getText();
        variableDeclaration.setType(type);
      }
    }
  }

  private async transformUseReducer(variableDeclaration: any): Promise<void> {
    // Get useReducer arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useReducer to ONEDOT-JS useReducer
    initializer.getExpression().replaceWithText('useReducer');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];
      const secondArg = arguments[1];

      if (firstArg && secondArg) {
        const reducerType = firstArg.getText();
        const initialStateType = secondArg.getText();
        variableDeclaration.setType(`[${initialStateType}, (action: any) => ${initialStateType}]`);
      }
    }
  }

  private async transformUseCallback(variableDeclaration: any): Promise<void> {
    // Get useCallback arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useCallback to ONEDOT-JS useCallback
    initializer.getExpression().replaceWithText('useCallback');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];

      if (firstArg) {
        const returnType = 'any';
        variableDeclaration.setType(`(...args: any[]) => ${returnType}`);
      }
    }
  }

  private async transformUseMemo(variableDeclaration: any): Promise<void> {
    // Get useMemo arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useMemo to ONEDOT-JS useMemo
    initializer.getExpression().replaceWithText('useMemo');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('any');
    }
  }

  private async transformUseRef(variableDeclaration: any): Promise<void> {
    // Get useRef arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useRef to ONEDOT-JS useRef
    initializer.getExpression().replaceWithText('useRef');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];

      if (firstArg) {
        const type = firstArg.getText();
        variableDeclaration.setType(`{ current: ${type} }`);
      } else {
        variableDeclaration.setType('{ current: any }');
      }
    }
  }

  private async transformUseImperativeHandle(variableDeclaration: any): Promise<void> {
    // Get useImperativeHandle arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useImperativeHandle to ONEDOT-JS useImperativeHandle
    initializer.getExpression().replaceWithText('useImperativeHandle');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('void');
    }
  }

  private async transformUseLayoutEffect(variableDeclaration: any): Promise<void> {
    // Get useLayoutEffect arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useLayoutEffect to ONEDOT-JS useLayoutEffect
    initializer.getExpression().replaceWithText('useLayoutEffect');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('void');
    }
  }

  private async transformUseDebugValue(variableDeclaration: any): Promise<void> {
    // Get useDebugValue arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useDebugValue to ONEDOT-JS useDebugValue
    initializer.getExpression().replaceWithText('useDebugValue');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('void');
    }
  }

  private async transformReactContext(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find React context
      const variableDeclarations = sourceFile.getVariableDeclarations();

      for (const variableDeclaration of variableDeclarations) {
        const initializer = variableDeclaration.getInitializer();

        if (initializer && initializer.getKindName() === 'CallExpression') {
          const expression = initializer.getExpression();

          if (expression.getKindName() === 'Identifier' && expression.getText() === 'createContext') {
            // Transform createContext to ONEDOT-JS createContext
            await this.transformCreateContext(variableDeclaration);
            result.transformed = true;
          }
        }
      }

      // Find context consumers
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        if (tagName.includes('.Consumer')) {
          // Transform context consumer to ONEDOT-JS context consumer
          await this.transformContextConsumer(jsxElement);
          result.transformed = true;
        }
      }

      // Find context providers
      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        if (tagName.includes('.Provider')) {
          // Transform context provider to ONEDOT-JS context provider
          await this.transformContextProvider(jsxElement);
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformCreateContext(variableDeclaration: any): Promise<void> {
    // Get createContext arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform createContext to ONEDOT-JS createContext
    initializer.getExpression().replaceWithText('createContext');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];

      if (firstArg) {
        const type = firstArg.getText();
        variableDeclaration.setType(`Context<${type}>`);
      } else {
        variableDeclaration.setType('Context<any>');
      }
    }
  }

  private async transformContextConsumer(jsxElement: any): Promise<void> {
    // Get context consumer
    const openingElement = jsxElement.getOpeningElement();
    const tagName = openingElement.getTagName();

    // Transform context consumer to ONEDOT-JS context consumer
    const contextName = tagName.replace('.Consumer', '');
    openingElement.setTagName(`${contextName}.Consumer`);

    // Transform children
    const children = jsxElement.getJsxChildren();

    for (const child of children) {
      if (child.getKindName() === 'JsxExpression') {
        const expression = child.getExpression();

        if (expression && expression.getKindName() === 'ArrowFunction') {
          // Transform consumer function
          const parameters = expression.getParameters();

          if (parameters.length > 0) {
            const parameter = parameters[0];
            const parameterName = parameter.getName();

            // Add parameter type annotation if not present
            if (!parameter.getTypeNode()) {
              parameter.setType('any');
            }
          }
        }
      }
    }
  }

  private async transformContextProvider(jsxElement: any): Promise<void> {
    // Get context provider
    const openingElement = jsxElement.getOpeningElement();
    const tagName = openingElement.getTagName();

    // Transform context provider to ONEDOT-JS context provider
    const contextName = tagName.replace('.Provider', '');
    openingElement.setTagName(`${contextName}.Provider`);

    // Transform value attribute
    const attributes = openingElement.getAttributes();

    for (const attribute of attributes) {
      if (attribute.getKindName() === 'JsxAttribute' && attribute.getName() === 'value') {
        const initializer = attribute.getInitializer();

        if (initializer && initializer.getKindName() === 'JsxExpression') {
          const expression = initializer.getExpression();

          if (expression) {
            // Add type annotation if not present
            const typeNode = expression.getTypeNode();

            if (!typeNode) {
              expression.setType('any');
            }
          }
        }
      }
    }
  }

  private async transformReactRedux(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find Redux imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'react-redux') {
          // Transform react-redux imports to ONEDOT-JS state imports
          importDeclaration.setModuleSpecifier('@onedot/state');
          result.transformed = true;
        }
      }

      // Find Redux hooks
      const variableDeclarations = sourceFile.getVariableDeclarations();

      for (const variableDeclaration of variableDeclarations) {
        const initializer = variableDeclaration.getInitializer();

        if (initializer && initializer.getKindName() === 'CallExpression') {
          const expression = initializer.getExpression();

          if (expression.getKindName() === 'Identifier') {
            const hookName = expression.getText();

            // Transform Redux hooks to ONEDOT-JS state hooks
            switch (hookName) {
              case 'useSelector':
                await this.transformUseSelector(variableDeclaration);
                result.transformed = true;
                break;
              case 'useDispatch':
                await this.transformUseDispatch(variableDeclaration);
                result.transformed = true;
                break;
              case 'useStore':
                await this.transformUseStore(variableDeclaration);
                result.transformed = true;
                break;
            }
          }
        }
      }

      // Find Redux components
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        if (tagName === 'Provider') {
          // Transform Redux provider to ONEDOT-JS state provider
          await this.transformReduxProvider(jsxElement);
          result.transformed = true;
        } else if (tagName === 'Connect') {
          // Transform Redux connect to ONEDOT-JS state connect
          await this.transformReduxConnect(jsxElement);
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformUseSelector(variableDeclaration: any): Promise<void> {
    // Get useSelector arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useSelector to ONEDOT-JS useSelector
    initializer.getExpression().replaceWithText('useSelector');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      const firstArg = arguments[0];

      if (firstArg) {
        const returnType = 'any';
        variableDeclaration.setType(returnType);
      }
    }
  }

  private async transformUseDispatch(variableDeclaration: any): Promise<void> {
    // Get useDispatch arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useDispatch to ONEDOT-JS useDispatch
    initializer.getExpression().replaceWithText('useDispatch');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('(action: any) => void');
    }
  }

  private async transformUseStore(variableDeclaration: any): Promise<void> {
    // Get useStore arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useStore to ONEDOT-JS useStore
    initializer.getExpression().replaceWithText('useStore');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('Store');
    }
  }

  private async transformReduxProvider(jsxElement: any): Promise<void> {
    // Get Redux provider
    const openingElement = jsxElement.getOpeningElement();
    const tagName = openingElement.getTagName();

    // Transform Redux provider to ONEDOT-JS state provider
    openingElement.setTagName('StateProvider');

    // Transform store attribute
    const attributes = openingElement.getAttributes();

    for (const attribute of attributes) {
      if (attribute.getKindName() === 'JsxAttribute' && attribute.getName() === 'store') {
        attribute.setName('state');
      }
    }
  }

  private async transformReduxConnect(jsxElement: any): Promise<void> {
    // Get Redux connect
    const openingElement = jsxElement.getOpeningElement();
    const tagName = openingElement.getTagName();

    // Transform Redux connect to ONEDOT-JS state connect
    openingElement.setTagName('StateConnect');

    // Transform attributes
    const attributes = openingElement.getAttributes();

    for (const attribute of attributes) {
      if (attribute.getKindName() === 'JsxAttribute') {
        const attributeName = attribute.getName();

        if (attributeName === 'mapStateToProps') {
          attribute.setName('mapState');
        } else if (attributeName === 'mapDispatchToProps') {
          attribute.setName('mapActions');
        } else if (attributeName === 'mapStateToPropsToProps') {
          attribute.setName('mapState');
        } else if (attributeName === 'mapDispatchToPropsToProps') {
          attribute.setName('mapActions');
        } else if (attributeName === 'mergeProps') {
          attribute.setName('mergeProps');
        }
      }
    }
  }

  private async transformReactRouter(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find React Router imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'react-router-dom') {
          // Transform react-router-dom imports to ONEDOT-JS router imports
          importDeclaration.setModuleSpecifier('@onedot/router');
          result.transformed = true;
        }
      }

      // Find React Router components
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        // Transform React Router components to ONEDOT-JS router components
        switch (tagName) {
          case 'BrowserRouter':
            openingElement.setTagName('Router');
            result.transformed = true;
            break;
          case 'HashRouter':
            openingElement.setTagName('HashRouter');
            result.transformed = true;
            break;
          case 'MemoryRouter':
            openingElement.setTagName('MemoryRouter');
            result.transformed = true;
            break;
          case 'Routes':
            openingElement.setTagName('Routes');
            result.transformed = true;
            break;
          case 'Route':
            openingElement.setTagName('Route');
            result.transformed = true;
            break;
          case 'Link':
            openingElement.setTagName('Link');
            result.transformed = true;
            break;
          case 'NavLink':
            openingElement.setTagName('NavLink');
            result.transformed = true;
            break;
          case 'Navigate':
            openingElement.setTagName('Navigate');
            result.transformed = true;
            break;
          case 'Outlet':
            openingElement.setTagName('Outlet');
            result.transformed = true;
            break;
        }

        // Transform attributes
        const attributes = openingElement.getAttributes();

        for (const attribute of attributes) {
          if (attribute.getKindName() === 'JsxAttribute') {
            const attributeName = attribute.getName();

            // Transform React Router attributes to ONEDOT-JS router attributes
            if (tagName === 'Route' && attributeName === 'element') {
              attribute.setName('component');
            } else if (tagName === 'Route' && attributeName === 'component') {
              attribute.setName('component');
            } else if (tagName === 'Route' && attributeName === 'render') {
              attribute.setName('render');
            }
          }
        }
      }

      // Find React Router hooks
      const variableDeclarations = sourceFile.getVariableDeclarations();

      for (const variableDeclaration of variableDeclarations) {
        const initializer = variableDeclaration.getInitializer();

        if (initializer && initializer.getKindName() === 'CallExpression') {
          const expression = initializer.getExpression();

          if (expression.getKindName() === 'Identifier') {
            const hookName = expression.getText();

            // Transform React Router hooks to ONEDOT-JS router hooks
            switch (hookName) {
              case 'useNavigate':
                await this.transformUseNavigate(variableDeclaration);
                result.transformed = true;
                break;
              case 'useLocation':
                await this.transformUseLocation(variableDeclaration);
                result.transformed = true;
                break;
              case 'useParams':
                await this.transformUseParams(variableDeclaration);
                result.transformed = true;
                break;
              case 'useMatch':
                await this.transformUseMatch(variableDeclaration);
                result.transformed = true;
                break;
              case 'useRoutes':
                await this.transformUseRoutes(variableDeclaration);
                result.transformed = true;
                break;
              case 'useOutlet':
                await this.transformUseOutlet(variableDeclaration);
                result.transformed = true;
                break;
              case 'useOutletContext':
                await this.transformUseOutletContext(variableDeclaration);
                result.transformed = true;
                break;
            }
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformUseNavigate(variableDeclaration: any): Promise<void> {
    // Get useNavigate arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useNavigate to ONEDOT-JS useNavigate
    initializer.getExpression().replaceWithText('useNavigate');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('(path: string, options?: any) => void');
    }
  }

  private async transformUseLocation(variableDeclaration: any): Promise<void> {
    // Get useLocation arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useLocation to ONEDOT-JS useLocation
    initializer.getExpression().replaceWithText('useLocation');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('Location');
    }
  }

  private async transformUseParams(variableDeclaration: any): Promise<void> {
    // Get useParams arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useParams to ONEDOT-JS useParams
    initializer.getExpression().replaceWithText('useParams');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('Params');
    }
  }

  private async transformUseMatch(variableDeclaration: any): Promise<void> {
    // Get useMatch arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useMatch to ONEDOT-JS useMatch
    initializer.getExpression().replaceWithText('useMatch');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('Match');
    }
  }

  private async transformUseRoutes(variableDeclaration: any): Promise<void> {
    // Get useRoutes arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useRoutes to ONEDOT-JS useRoutes
    initializer.getExpression().replaceWithText('useRoutes');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('RouteObject[]');
    }
  }

  private async transformUseOutlet(variableDeclaration: any): Promise<void> {
    // Get useOutlet arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useOutlet to ONEDOT-JS useOutlet
    initializer.getExpression().replaceWithText('useOutlet');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('ReactElement | null');
    }
  }

  private async transformUseOutletContext(variableDeclaration: any): Promise<void> {
    // Get useOutletContext arguments
    const initializer = variableDeclaration.getInitializer();
    const arguments = initializer.getArguments();

    // Transform useOutletContext to ONEDOT-JS useOutletContext
    initializer.getExpression().replaceWithText('useOutletContext');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('any');
    }
  }

  private async transformStyledComponents(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find styled-components imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'styled-components') {
          // Transform styled-components imports to ONEDOT-JS styled imports
          importDeclaration.setModuleSpecifier('@onedot/styled');
          result.transformed = true;
        }
      }

      // Find styled components
      const variableDeclarations = sourceFile.getVariableDeclarations();

      for (const variableDeclaration of variableDeclarations) {
        const initializer = variableDeclaration.getInitializer();

        if (initializer && initializer.getKindName() === 'TaggedTemplateExpression') {
          const tag = initializer.getTag();

          if (tag.getKindName() === 'Identifier' && tag.getText() === 'styled') {
            // Transform styled component to ONEDOT-JS styled component
            await this.transformStyledComponent(variableDeclaration);
            result.transformed = true;
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformStyledComponent(variableDeclaration: any): Promise<void> {
    // Get styled component
    const initializer = variableDeclaration.getInitializer();
    const tag = initializer.getTag();
    const template = initializer.getTemplate();

    // Transform styled component to ONEDOT-JS styled component
    tag.replaceWithText('styled');

    // Add type annotation if not present
    const typeNode = variableDeclaration.getTypeNode();

    if (!typeNode) {
      variableDeclaration.setType('StyledComponent');
    }
  }

  private async transformMaterialUI(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find Material-UI imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier.startsWith('@mui/')) {
          // Transform Material-UI imports to ONEDOT-JS UI imports
          importDeclaration.setModuleSpecifier(moduleSpecifier.replace('@mui/', '@onedot/ui/'));
          result.transformed = true;
        }
      }

      // Find Material-UI components
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        if (tagName.startsWith('Mui')) {
          // Transform Material-UI component to ONEDOT-JS UI component
          openingElement.setTagName(tagName.replace('Mui', ''));
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformAntDesign(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find Ant Design imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'antd') {
          // Transform Ant Design imports to ONEDOT-JS UI imports
          importDeclaration.setModuleSpecifier('@onedot/ui');
          result.transformed = true;
        }
      }

      // Find Ant Design components
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        if (tagName.includes('.')) {
          // Transform Ant Design component to ONEDOT-JS UI component
          openingElement.setTagName(tagName.replace('Ant', ''));
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformNextJS(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find Next.js imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'next') {
          // Transform Next.js imports to ONEDOT-JS imports
          importDeclaration.setModuleSpecifier('@onedot/next');
          result.transformed = true;
        } else if (moduleSpecifier === 'next/link') {
          // Transform Next.js Link imports to ONEDOT-JS Link imports
          importDeclaration.setModuleSpecifier('@onedot/router');
          result.transformed = true;
        } else if (moduleSpecifier === 'next/router') {
          // Transform Next.js router imports to ONEDOT-JS router imports
          importDeclaration.setModuleSpecifier('@onedot/router');
          result.transformed = true;
        } else if (moduleSpecifier === 'next/head') {
          // Transform Next.js Head imports to ONEDOT-JS Head imports
          importDeclaration.setModuleSpecifier('@onedot/head');
          result.transformed = true;
        }
      }

      // Find Next.js components
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        // Transform Next.js components to ONEDOT-JS components
        switch (tagName) {
          case 'Link':
            openingElement.setTagName('Link');
            result.transformed = true;
            break;
          case 'Head':
            openingElement.setTagName('Head');
            result.transformed = true;
            break;
          case 'Image':
            openingElement.setTagName('Image');
            result.transformed = true;
            break;
          case 'Script':
            openingElement.setTagName('Script');
            result.transformed = true;
            break;
        }

        // Transform attributes
        const attributes = openingElement.getAttributes();

        for (const attribute of attributes) {
          if (attribute.getKindName() === 'JsxAttribute') {
            const attributeName = attribute.getName();

            // Transform Next.js attributes to ONEDOT-JS attributes
            if (tagName === 'Link' && attributeName === 'href') {
              attribute.setName('to');
            } else if (tagName === 'Image' && attributeName === 'src') {
              attribute.setName('src');
            } else if (tagName === 'Image' && attributeName === 'alt') {
              attribute.setName('alt');
            } else if (tagName === 'Image' && attributeName === 'width') {
              attribute.setName('width');
            } else if (tagName === 'Image' && attributeName === 'height') {
              attribute.setName('height');
            }
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformGatsby(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find Gatsby imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'gatsby') {
          // Transform Gatsby imports to ONEDOT-JS imports
          importDeclaration.setModuleSpecifier('@onedot/gatsby');
          result.transformed = true;
        } else if (moduleSpecifier === 'gatsby-link') {
          // Transform Gatsby Link imports to ONEDOT-JS Link imports
          importDeclaration.setModuleSpecifier('@onedot/router');
          result.transformed = true;
        } else if (moduleSpecifier === 'gatsby-image') {
          // Transform Gatsby Image imports to ONEDOT-JS Image imports
          importDeclaration.setModuleSpecifier('@onedot/image');
          result.transformed = true;
        }
      }

      // Find Gatsby components
      const jsxElements = sourceFile.getDescendantsOfKind('JsxElement');

      for (const jsxElement of jsxElements) {
        const openingElement = jsxElement.getOpeningElement();
        const tagName = openingElement.getTagName();

        // Transform Gatsby components to ONEDOT-JS components
        switch (tagName) {
          case 'Link':
            openingElement.setTagName('Link');
            result.transformed = true;
            break;
          case 'Image':
            openingElement.setTagName('Image');
            result.transformed = true;
            break;
        }

        // Transform attributes
        const attributes = openingElement.getAttributes();

        for (const attribute of attributes) {
          if (attribute.getKindName() === 'JsxAttribute') {
            const attributeName = attribute.getName();

            // Transform Gatsby attributes to ONEDOT-JS attributes
            if (tagName === 'Link' && attributeName === 'to') {
              attribute.setName('to');
            } else if (tagName === 'Image' && attributeName === 'fixed') {
              attribute.setName('fixed');
            } else if (tagName === 'Image' && attributeName === 'fluid') {
              attribute.setName('fluid');
            }
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformCreateReactApp(sourceFile: any, project: any): Promise<any> {
    const result = {
      transformed: false,
      sourceFile
    };

    try {
      // Find Create React App imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === 'react-scripts') {
          // Transform react-scripts imports to ONEDOT-JS scripts imports
          importDeclaration.setModuleSpecifier('@onedot/scripts');
          result.transformed = true;
        }
      }

      // Find Create React App environment variables
      const variableDeclarations = sourceFile.getVariableDeclarations();

      for (const variableDeclaration of variableDeclarations) {
        const name = variableDeclaration.getName();

        if (name.startsWith('REACT_APP_')) {
          // Transform Create React App environment variables to ONEDOT-JS environment variables
          variableDeclaration.rename(name.replace('REACT_APP_', 'ONEDOT_'));
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private generateSummary(result: MigrationResult, options: ReactMigrationOptions): void {
    console.log(chalk.blue('\nMigration Summary:'));
    console.log(chalk.white(`Files processed: ${result.files.processed}`));
    console.log(chalk.green(`Files transformed: ${result.files.transformed}`));
    console.log(chalk.red(`Files failed: ${result.files.failed}`));
    console.log(chalk.yellow(`Files skipped: ${result.files.skipped}`));
    console.log(chalk.white(`Duration: ${result.duration}ms`));

    if (result.errors.length > 0) {
      console.log(chalk.red('\nErrors:'));
      result.errors.forEach(error => console.log(chalk.red(`- ${error}`)));
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      result.warnings.forEach(warning => console.log(chalk.yellow(`- ${warning}`)));
    }

    console.log(chalk.blue('\nNext Steps:'));
    console.log(chalk.white('1. Review the transformed code for any issues'));
    console.log(chalk.white('2. Update your dependencies to use ONEDOT-JS packages'));
    console.log(chalk.white('3. Update your build configuration'));
    console.log(chalk.white('4. Test your application thoroughly'));
  }
}
