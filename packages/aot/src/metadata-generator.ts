import { Decorator, ObjectLiteralExpression } from 'ts-morph';
import { ComponentMetadata, Diagnostic } from './types';

export class MetadataGenerator {
  private diagnostics: Diagnostic[] = [];

  generate(componentDecorator: Decorator): ComponentMetadata {
    const metadata: ComponentMetadata = {
      selector: '',
      encapsulation: 'none',
      changeDetection: 'default',
      preserveWhitespaces: false,
      interpolation: ['{{', '}}']
    };

    const decoratorArgs = componentDecorator.getArguments();
    if (decoratorArgs.length === 0) {
      this.diagnostics.push({
        message: 'Component decorator requires configuration object',
        severity: 'error',
        code: 'MISSING_COMPONENT_CONFIG'
      });
      return metadata;
    }

    const configObject = decoratorArgs[0];
    if (!configObject.isKind(233)) { // SyntaxKind.ObjectLiteralExpression
      this.diagnostics.push({
        message: 'Component decorator requires an object literal argument',
        severity: 'error',
        code: 'INVALID_COMPONENT_CONFIG'
      });
      return metadata;
    }

    const properties = (configObject as ObjectLiteralExpression).getProperties();

    for (const property of properties) {
      const name = property.getName();

      switch (name) {
        case 'selector':
          metadata.selector = this.getStringValue(property);
          break;
        case 'template':
          metadata.template = this.getStringValue(property);
          break;
        case 'templateUrl':
          metadata.templateUrl = this.getStringValue(property);
          break;
        case 'styles':
          metadata.styles = this.getStringArrayValue(property);
          break;
        case 'styleUrls':
          metadata.styleUrls = this.getStringArrayValue(property);
          break;
        case 'encapsulation':
          metadata.encapsulation = this.getEnumValue(property, ['none', 'emulated', 'shadowdom']) as any;
          break;
        case 'changeDetection':
          metadata.changeDetection = this.getEnumValue(property, ['default', 'onpush']) as any;
          break;
        case 'inputs':
          metadata.inputs = this.getStringArrayValue(property);
          break;
        case 'outputs':
          metadata.outputs = this.getStringArrayValue(property);
          break;
        case 'host':
          metadata.host = this.getObjectValue(property);
          break;
        case 'providers':
          metadata.providers = this.getArrayValue(property);
          break;
        case 'viewProviders':
          metadata.viewProviders = this.getArrayValue(property);
          break;
        case 'queries':
          metadata.queries = this.getArrayValue(property);
          break;
        case 'preserveWhitespaces':
          metadata.preserveWhitespaces = this.getBooleanValue(property);
          break;
        case 'interpolation':
          metadata.interpolation = this.getStringArrayValue(property) as [string, string];
          break;
        default:
          this.diagnostics.push({
            message: `Unknown component property: ${name}`,
            severity: 'warning',
            code: 'UNKNOWN_COMPONENT_PROPERTY'
          });
      }
    }

    // Validate required properties
    if (!metadata.selector) {
      this.diagnostics.push({
        message: 'Component selector is required',
        severity: 'error',
        code: 'MISSING_SELECTOR'
      });
    }

    if (!metadata.template && !metadata.templateUrl) {
      this.diagnostics.push({
        message: 'Component must have either template or templateUrl',
        severity: 'error',
        code: 'MISSING_TEMPLATE'
      });
    }

    return metadata;
  }

  private getStringValue(property: any): string {
    const initializer = property.getInitializer();
    if (!initializer) return '';

    if (initializer.isKind(10)) { // SyntaxKind.StringLiteral
      return initializer.getLiteralValue();
    }

    this.diagnostics.push({
      message: `Expected string value for property ${property.getName()}`,
      severity: 'error',
      code: 'INVALID_STRING_VALUE'
    });
    return '';
  }

  private getStringArrayValue(property: any): string[] {
    const initializer = property.getInitializer();
    if (!initializer) return [];

    if (initializer.isKind(237)) { // SyntaxKind.ArrayLiteralExpression
      return initializer.getElements().map(element => {
        if (element.isKind(10)) { // SyntaxKind.StringLiteral
          return element.getLiteralValue();
        }
        this.diagnostics.push({
          message: `Array element must be a string`,
          severity: 'error',
          code: 'INVALID_ARRAY_ELEMENT'
        });
        return '';
      });
    }

    this.diagnostics.push({
      message: `Expected array value for property ${property.getName()}`,
      severity: 'error',
      code: 'INVALID_ARRAY_VALUE'
    });
    return [];
  }

  private getBooleanValue(property: any): boolean {
    const initializer = property.getInitializer();
    if (!initializer) return false;

    if (initializer.isKind(84)) { // SyntaxKind.TrueKeyword
      return true;
    }

    if (initializer.isKind(87)) { // SyntaxKind.FalseKeyword
      return false;
    }

    this.diagnostics.push({
      message: `Expected boolean value for property ${property.getName()}`,
      severity: 'error',
      code: 'INVALID_BOOLEAN_VALUE'
    });
    return false;
  }

  private getEnumValue(property: any, allowedValues: string[]): string {
    const initializer = property.getInitializer();
    if (!initializer) return allowedValues[0];

    if (initializer.isKind(10)) { // SyntaxKind.StringLiteral
      const value = initializer.getLiteralValue();
      if (allowedValues.includes(value)) {
        return value;
      }
    }

    this.diagnostics.push({
      message: `Expected one of ${allowedValues.join(', ')} for property ${property.getName()}`,
      severity: 'error',
      code: 'INVALID_ENUM_VALUE'
    });
    return allowedValues[0];
  }

  private getObjectValue(property: any): Record<string, string> {
    const initializer = property.getInitializer();
    if (!initializer) return {};

    if (initializer.isKind(233)) { // SyntaxKind.ObjectLiteralExpression
      const result: Record<string, string> = {};
      const properties = initializer.getProperties();

      for (const prop of properties) {
        const name = prop.getName();
        const value = this.getStringValue(prop);
        result[name] = value;
      }

      return result;
    }

    this.diagnostics.push({
      message: `Expected object value for property ${property.getName()}`,
      severity: 'error',
      code: 'INVALID_OBJECT_VALUE'
    });
    return {};
  }

  private getArrayValue(property: any): any[] {
    const initializer = property.getInitializer();
    if (!initializer) return [];

    if (initializer.isKind(237)) { // SyntaxKind.ArrayLiteralExpression
      return initializer.getElements().map(element => {
        // For now, just return the text - in practice you'd parse the elements properly
        return element.getText();
      });
    }

    this.diagnostics.push({
      message: `Expected array value for property ${property.getName()}`,
      severity: 'error',
      code: 'INVALID_ARRAY_VALUE'
    });
    return [];
  }

  getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }
}
