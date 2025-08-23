export interface ErrorOverlayOptions {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  showStack?: boolean;
  showCodeSnippet?: boolean;
  showSuggestions?: boolean;
  showFixButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  maxErrors?: number;
  filterErrors?: (error: any) => boolean;
  customStyles?: {
    container?: string;
    header?: string;
    title?: string;
    message?: string;
    stack?: string;
    code?: string;
    suggestions?: string;
    button?: string;
  };
}

export class ErrorOverlay {
  private options: ErrorOverlayOptions;
  private container: HTMLElement | null = null;
  private errors: any[] = [];
  private initialized = false;
  private hideTimeout: number | null = null;

  constructor(options: ErrorOverlayOptions = {}) {
    this.options = {
      enabled: true,
      position: 'top-right',
      showStack: true,
      showCodeSnippet: true,
      showSuggestions: true,
      showFixButton: true,
      autoHide: false,
      autoHideDelay: 5000,
      maxErrors: 10,
      filterErrors: () => true,
      customStyles: {
        container: '',
        header: '',
        title: '',
        message: '',
        stack: '',
        code: '',
        suggestions: '',
        button: ''
      },
      ...options
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    // Create error overlay container
    this.createContainer();

    // Set up error listeners
    this.setupErrorListeners();

    this.initialized = true;
  }

  public destroy(): void {
    if (!this.initialized) return;

    // Remove error overlay container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // Clear hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Clear errors
    this.errors = [];

    this.initialized = false;
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'onedot-error-overlay';

    // Apply position styles
    switch (this.options.position) {
      case 'top-right':
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        break;
      case 'top-left':
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        break;
      case 'bottom-right':
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        break;
      case 'bottom-left':
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        break;
      case 'center':
        this.container.style.position = 'fixed';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        break;
    }

    // Apply custom styles
    if (this.options.customStyles?.container) {
      this.container.className = this.options.customStyles.container;
    } else {
      // Default styles
      this.container.style.zIndex = '9999';
      this.container.style.maxWidth = '500px';
      this.container.style.maxHeight = '80vh';
      this.container.style.overflowY = 'auto';
      this.container.style.backgroundColor = '#ffffff';
      this.container.style.borderRadius = '8px';
      this.container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      this.container.style.fontFamily = 'monospace';
      this.container.style.fontSize = '14px';
      this.container.style.color = '#333333';
    }

    // Hide container initially
    this.container.style.display = 'none';

    // Add container to document
    document.body.appendChild(this.container);
  }

  private setupErrorListeners(): void {
    window.addEventListener('error', (event) => {
      this.showError([event.error]);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.showError([event.reason]);
    });
  }

  public showError(errors: any[]): void {
    if (!this.options.enabled || !this.container) return;

    // Filter errors
    const filteredErrors = errors.filter(error => this.options.filterErrors!(error));

    if (filteredErrors.length === 0) return;

    // Add errors to the list
    filteredErrors.forEach(error => {
      this.errors.push({
        error,
        timestamp: new Date()
      });
    });

    // Limit errors
    if (this.errors.length > this.options.maxErrors!) {
      this.errors = this.errors.slice(-this.options.maxErrors!);
    }

    // Update overlay
    this.updateOverlay();

    // Show overlay
    this.container.style.display = 'block';

    // Auto hide if enabled
    if (this.options.autoHide) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }

      this.hideTimeout = window.setTimeout(() => {
        this.hide();
      }, this.options.autoHideDelay);
    }
  }

  private updateOverlay(): void {
    if (!this.container) return;

    // Clear container
    this.container.innerHTML = '';

    // Add header
    const header = document.createElement('div');

    if (this.options.customStyles?.header) {
      header.className = this.options.customStyles.header;
    } else {
      // Default styles
      header.style.padding = '10px 15px';
      header.style.backgroundColor = '#f44336';
      header.style.color = '#ffffff';
      header.style.fontWeight = 'bold';
      header.style.borderTopLeftRadius = '8px';
      header.style.borderTopRightRadius = '8px';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
    }

    header.textContent = 'Error';

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#ffffff';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.marginLeft = '10px';

    closeButton.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(closeButton);
    this.container.appendChild(header);

    // Add error content
    const content = document.createElement('div');
    content.style.padding = '15px';

    // Add each error
    this.errors.forEach((errorData, index) => {
      const error = errorData.error;

      // Add error title
      const title = document.createElement('div');

      if (this.options.customStyles?.title) {
        title.className = this.options.customStyles.title;
      } else {
        // Default styles
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.color = '#d32f2f';
      }

      title.textContent = error.name || 'Error';
      content.appendChild(title);

      // Add error message
      const message = document.createElement('div');

      if (this.options.customStyles?.message) {
        message.className = this.options.customStyles.message;
      } else {
        // Default styles
        message.style.marginBottom = '10px';
        message.style.whiteSpace = 'pre-wrap';
        message.style.wordBreak = 'break-word';
      }

      message.textContent = error.message || 'An unknown error occurred';
      content.appendChild(message);

      // Add error stack if enabled
      if (this.options.showStack && error.stack) {
        const stack = document.createElement('div');

        if (this.options.customStyles?.stack) {
          stack.className = this.options.customStyles.stack;
        } else {
          // Default styles
          stack.style.marginBottom = '10px';
          stack.style.fontSize = '12px';
          stack.style.color = '#666666';
          stack.style.whiteSpace = 'pre-wrap';
          stack.style.wordBreak = 'break-word';
          stack.style.maxHeight = '200px';
          stack.style.overflowY = 'auto';
          stack.style.backgroundColor = '#f5f5f5';
          stack.style.padding = '10px';
          stack.style.borderRadius = '4px';
        }

        stack.textContent = error.stack;
        content.appendChild(stack);
      }

      // Add code snippet if enabled
      if (this.options.showCodeSnippet && error.code) {
        const code = document.createElement('div');

        if (this.options.customStyles?.code) {
          code.className = this.options.customStyles.code;
        } else {
          // Default styles
          code.style.marginBottom = '10px';
          code.style.fontSize = '12px';
          code.style.color = '#333333';
          code.style.whiteSpace = 'pre-wrap';
          code.style.wordBreak = 'break-word';
          code.style.maxHeight = '200px';
          stack.style.overflowY = 'auto';
          code.style.backgroundColor = '#f5f5f5';
          code.style.padding = '10px';
          code.style.borderRadius = '4px';
          code.style.fontFamily = 'monospace';
        }

        code.textContent = error.code;
        content.appendChild(code);
      }

      // Add suggestions if enabled
      if (this.options.showSuggestions && error.suggestions) {
        const suggestions = document.createElement('div');

        if (this.options.customStyles?.suggestions) {
          suggestions.className = this.options.customStyles.suggestions;
        } else {
          // Default styles
          suggestions.style.marginBottom = '10px';
          suggestions.style.fontSize = '12px';
          suggestions.style.color = '#333333';
        }

        const suggestionsTitle = document.createElement('div');
        suggestionsTitle.style.fontWeight = 'bold';
        suggestionsTitle.style.marginBottom = '5px';
        suggestionsTitle.textContent = 'Suggestions:';
        suggestions.appendChild(suggestionsTitle);

        const suggestionsList = document.createElement('ul');
        suggestionsList.style.margin = '0';
        suggestionsList.style.paddingLeft = '20px';

        error.suggestions.forEach((suggestion: string) => {
          const suggestionItem = document.createElement('li');
          suggestionItem.textContent = suggestion;
          suggestionsList.appendChild(suggestionItem);
        });

        suggestions.appendChild(suggestionsList);
        content.appendChild(suggestions);
      }

      // Add fix button if enabled
      if (this.options.showFixButton && error.fixable) {
        const fixButton = document.createElement('button');

        if (this.options.customStyles?.button) {
          fixButton.className = this.options.customStyles.button;
        } else {
          // Default styles
          fixButton.style.padding = '8px 16px';
          fixButton.style.backgroundColor = '#4caf50';
          fixButton.style.color = '#ffffff';
          fixButton.style.border = 'none';
          fixButton.style.borderRadius = '4px';
          fixButton.style.cursor = 'pointer';
          fixButton.style.marginTop = '10px';
          fixButton.style.marginRight = '10px';
        }

        fixButton.textContent = 'Fix';

        fixButton.addEventListener('click', () => {
          this.fixError(index);
        });

        content.appendChild(fixButton);
      }

      // Add separator if there are more errors
      if (index < this.errors.length - 1) {
        const separator = document.createElement('hr');
        separator.style.margin = '15px 0';
        separator.style.border = 'none';
        separator.style.borderTop = '1px solid #eeeeee';
        content.appendChild(separator);
      }
    });

    this.container.appendChild(content);
  }

  public hide(): void {
    if (!this.container) return;

    this.container.style.display = 'none';

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  public clear(): void {
    this.errors = [];
    this.hide();
  }

  public fixError(index: number): void {
    if (index < 0 || index >= this.errors.length) return;

    const errorData = this.errors[index];
    const error = errorData.error;

    // This would trigger the fix for the error
    // The actual implementation would depend on the type of error
    console.log('Fixing error:', error);

    // Remove the error from the list
    this.errors.splice(index, 1);

    // Update overlay
    if (this.errors.length > 0) {
      this.updateOverlay();
    } else {
      this.hide();
    }
  }

  public getErrors(): any[] {
    return [...this.errors];
  }
}
