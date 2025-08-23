export interface AIAssistantOptions {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  autoAnalyze?: boolean;
  analyzeErrors?: boolean;
  analyzePerformance?: boolean;
  analyzeStateChanges?: boolean;
  analyzeComponentUpdates?: boolean;
  analyzeNetworkRequests?: boolean;
  analyzeUserActions?: boolean;
  provideSuggestions?: boolean;
  provideOptimizations?: boolean;
  provideFixes?: boolean;
  provideDocumentation?: boolean;
  provideExamples?: boolean;
}

export class AIAssistant {
  private options: AIAssistantOptions;
  private initialized = false;
  private socket: any = null;
  private analysisQueue: any[] = [];
  private isAnalyzing = false;
  private suggestions: any[] = [];
  private optimizations: any[] = [];
  private fixes: any[] = [];
  private documentation: any[] = [];
  private examples: any[] = [];

  constructor(options: AIAssistantOptions = {}) {
    this.options = {
      enabled: true,
      apiKey: '',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.2,
      autoAnalyze: true,
      analyzeErrors: true,
      analyzePerformance: true,
      analyzeStateChanges: true,
      analyzeComponentUpdates: true,
      analyzeNetworkRequests: true,
      analyzeUserActions: true,
      provideSuggestions: true,
      provideOptimizations: true,
      provideFixes: true,
      provideDocumentation: true,
      provideExamples: true,
      ...options
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    // Set up WebSocket connection for real-time analysis
    this.setupWebSocket();

    // Set up auto analysis if enabled
    if (this.options.autoAnalyze) {
      this.setupAutoAnalysis();
    }

    this.initialized = true;
  }

  public destroy(): void {
    if (!this.initialized) return;

    // Close WebSocket connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Clear analysis queue
    this.analysisQueue = [];
    this.isAnalyzing = false;

    this.initialized = false;
  }

  private setupWebSocket(): void {
    if (typeof WebSocket !== 'undefined') {
      this.socket = new WebSocket('wss://api.onedot-js.com/ai-assistant');

      this.socket.onopen = () => {
        console.log('AI Assistant connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'analysis':
              this.handleAnalysisResult(message.data);
              break;
            case 'suggestion':
              this.handleSuggestion(message.data);
              break;
            case 'optimization':
              this.handleOptimization(message.data);
              break;
            case 'fix':
              this.handleFix(message.data);
              break;
            case 'documentation':
              this.handleDocumentation(message.data);
              break;
            case 'example':
              this.handleExample(message.data);
              break;
            default:
              console.warn('Unknown AI Assistant message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing AI Assistant message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('AI Assistant disconnected');
      };

      this.socket.onerror = (error) => {
        console.error('AI Assistant error:', error);
      };
    }
  }

  private setupAutoAnalysis(): void {
    // Set up listeners for various events to trigger analysis
    window.addEventListener('error', (event) => {
      if (this.options.analyzeErrors) {
        this.analyzeError(event.error);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (this.options.analyzeErrors) {
        this.analyzeError(event.reason);
      }
    });

    window.addEventListener('load', () => {
      if (this.options.analyzePerformance) {
        this.analyzePerformance();
      }
    });

    window.addEventListener('onedot-state-changed', (event: any) => {
      if (this.options.analyzeStateChanges) {
        this.analyzeStateChange(event.detail);
      }
    });

    window.addEventListener('onedot-component-updated', (event: any) => {
      if (this.options.analyzeComponentUpdates) {
        this.analyzeComponentUpdate(event.detail);
      }
    });

    window.addEventListener('onedot-network-request', (event: any) => {
      if (this.options.analyzeNetworkRequests) {
        this.analyzeNetworkRequest(event.detail);
      }
    });

    window.addEventListener('onedot-user-action', (event: any) => {
      if (this.options.analyzeUserActions) {
        this.analyzeUserAction(event.detail);
      }
    });
  }

  public analyzeError(error: any): void {
    if (!this.options.enabled) return;

    const analysis = {
      type: 'error',
      data: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      }
    };

    this.queueAnalysis(analysis);
  }

  public analyzePerformance(): void {
    if (!this.options.enabled) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const resourceEntries = performance.getEntriesByType('resource');
    const longTaskEntries = performance.getEntriesByType('longtask');

    const analysis = {
      type: 'performance',
      data: {
        navigation: navigation ? {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        } : null,
        paint: paintEntries.map(entry => ({
          name: entry.name,
          startTime: entry.startTime
        })),
        resources: resourceEntries.map(entry => ({
          name: entry.name,
          duration: entry.duration,
          size: (entry as any).transferSize
        })),
        longTasks: longTaskEntries.map(entry => ({
          duration: entry.duration,
          name: entry.name
        })),
        timestamp: new Date()
      }
    };

    this.queueAnalysis(analysis);
  }

  public analyzeStateChange(stateChange: any): void {
    if (!this.options.enabled) return;

    const analysis = {
      type: 'stateChange',
      data: {
        action: stateChange.action,
        timestamp: new Date()
      }
    };

    this.queueAnalysis(analysis);
  }

  public analyzeComponentUpdate(componentUpdate: any): void {
    if (!this.options.enabled) return;

    const analysis = {
      type: 'componentUpdate',
      data: {
        component: componentUpdate.component,
        duration: componentUpdate.duration,
        timestamp: new Date()
      }
    };

    this.queueAnalysis(analysis);
  }

  public analyzeNetworkRequest(networkRequest: any): void {
    if (!this.options.enabled) return;

    const analysis = {
      type: 'networkRequest',
      data: {
        url: networkRequest.url,
        method: networkRequest.method,
        status: networkRequest.status,
        duration: networkRequest.duration,
        timestamp: new Date()
      }
    };

    this.queueAnalysis(analysis);
  }

  public analyzeUserAction(userAction: any): void {
    if (!this.options.enabled) return;

    const analysis = {
      type: 'userAction',
      data: {
        type: userAction.type,
        target: userAction.target,
        timestamp: new Date()
      }
    };

    this.queueAnalysis(analysis);
  }

  private queueAnalysis(analysis: any): void {
    this.analysisQueue.push(analysis);

    if (!this.isAnalyzing) {
      this.processAnalysisQueue();
    }
  }

  private async processAnalysisQueue(): Promise<void> {
    if (this.analysisQueue.length === 0) {
      this.isAnalyzing = false;
      return;
    }

    this.isAnalyzing = true;

    while (this.analysisQueue.length > 0) {
      const analysis = this.analysisQueue.shift();

      try {
        await this.sendAnalysis(analysis);
      } catch (error) {
        console.error('Error analyzing:', error);
      }
    }

    this.isAnalyzing = false;
  }

  private async sendAnalysis(analysis: any): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // If WebSocket is not available, use HTTP API
      await this.sendAnalysisViaHTTP(analysis);
      return;
    }

    this.socket.send(JSON.stringify({
      type: 'analysis',
      data: analysis
    }));
  }

  private async sendAnalysisViaHTTP(analysis: any): Promise<void> {
    if (!this.options.apiKey) {
      console.warn('AI Assistant API key not provided');
      return;
    }

    const prompt = this.buildPrompt(analysis);

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for the ONEDOT-JS framework. Your job is to analyze code, errors, and performance issues to provide helpful suggestions, optimizations, and fixes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    this.handleAnalysisResult({
      analysis,
      result
    });
  }

  private buildPrompt(analysis: any): string {
    switch (analysis.type) {
      case 'error':
        return `Analyze this error and provide suggestions for fixing it:\n\nError Name: ${analysis.data.name}\nError Message: ${analysis.data.message}\nError Stack: ${analysis.data.stack}`;

      case 'performance':
        return `Analyze this performance data and provide optimization suggestions:\n\nNavigation: ${JSON.stringify(analysis.data.navigation)}\nPaint: ${JSON.stringify(analysis.data.paint)}\nResources: ${JSON.stringify(analysis.data.resources)}\nLong Tasks: ${JSON.stringify(analysis.data.longTasks)}`;

      case 'stateChange':
        return `Analyze this state change and provide suggestions for improvement:\n\nAction: ${JSON.stringify(analysis.data.action)}`;

      case 'componentUpdate':
        return `Analyze this component update and provide optimization suggestions:\n\nComponent: ${analysis.data.component}\nDuration: ${analysis.data.duration}ms`;

      case 'networkRequest':
        return `Analyze this network request and provide optimization suggestions:\n\nURL: ${analysis.data.url}\nMethod: ${analysis.data.method}\nStatus: ${analysis.data.status}\nDuration: ${analysis.data.duration}ms`;

      case 'userAction':
        return `Analyze this user action and provide suggestions for improvement:\n\nType: ${analysis.data.type}\nTarget: ${analysis.data.target}`;

      default:
        return `Analyze this data and provide suggestions:\n\n${JSON.stringify(analysis.data)}`;
    }
  }

  private handleAnalysisResult(result: any): void {
    // Parse the result and extract suggestions, optimizations, fixes, documentation, and examples
    const { analysis, result: analysisResult } = result;

    // This would involve parsing the natural language response from the AI
    // For now, we'll just store the raw result
    console.log('Analysis result:', analysisResult);

    // If the analysis result contains suggestions, extract them
    if (this.options.provideSuggestions) {
      this.extractSuggestions(analysisResult);
    }

    // If the analysis result contains optimizations, extract them
    if (this.options.provideOptimizations) {
      this.extractOptimizations(analysisResult);
    }

    // If the analysis result contains fixes, extract them
    if (this.options.provideFixes) {
      this.extractFixes(analysisResult);
    }

    // If the analysis result contains documentation, extract it
    if (this.options.provideDocumentation) {
      this.extractDocumentation(analysisResult);
    }

    // If the analysis result contains examples, extract them
    if (this.options.provideExamples) {
      this.extractExamples(analysisResult);
    }
  }

  private extractSuggestions(result: string): void {
    // Extract suggestions from the analysis result
    // This would involve natural language processing
    // For now, we'll just add the entire result as a suggestion
    this.suggestions.push({
      id: Date.now(),
      content: result,
      timestamp: new Date()
    });
  }

  private extractOptimizations(result: string): void {
    // Extract optimizations from the analysis result
    // This would involve natural language processing
    // For now, we'll just add the entire result as an optimization
    this.optimizations.push({
      id: Date.now(),
      content: result,
      timestamp: new Date()
    });
  }

  private extractFixes(result: string): void {
    // Extract fixes from the analysis result
    // This would involve natural language processing
    // For now, we'll just add the entire result as a fix
    this.fixes.push({
      id: Date.now(),
      content: result,
      timestamp: new Date()
    });
  }

  private extractDocumentation(result: string): void {
    // Extract documentation from the analysis result
    // This would involve natural language processing
    // For now, we'll just add the entire result as documentation
    this.documentation.push({
      id: Date.now(),
      content: result,
      timestamp: new Date()
    });
  }

  private extractExamples(result: string): void {
    // Extract examples from the analysis result
    // This would involve natural language processing
    // For now, we'll just add the entire result as an example
    this.examples.push({
      id: Date.now(),
      content: result,
      timestamp: new Date()
    });
  }

  private handleSuggestion(suggestion: any): void {
    this.suggestions.push({
      id: suggestion.id,
      content: suggestion.content,
      timestamp: new Date()
    });
  }

  private handleOptimization(optimization: any): void {
    this.optimizations.push({
      id: optimization.id,
      content: optimization.content,
      timestamp: new Date()
    });
  }

  private handleFix(fix: any): void {
    this.fixes.push({
      id: fix.id,
      content: fix.content,
      timestamp: new Date()
    });
  }

  private handleDocumentation(documentation: any): void {
    this.documentation.push({
      id: documentation.id,
      content: documentation.content,
      timestamp: new Date()
    });
  }

  private handleExample(example: any): void {
    this.examples.push({
      id: example.id,
      content: example.content,
      timestamp: new Date()
    });
  }

  public getSuggestions(): any[] {
    return [...this.suggestions];
  }

  public getOptimizations(): any[] {
    return [...this.optimizations];
  }

  public getFixes(): any[] {
    return [...this.fixes];
  }

  public getDocumentation(): any[] {
    return [...this.documentation];
  }

  public getExamples(): any[] {
    return [...this.examples];
  }

  public clearSuggestions(): void {
    this.suggestions = [];
  }

  public clearOptimizations(): void {
    this.optimizations = [];
  }

  public clearFixes(): void {
    this.fixes = [];
  }

  public clearDocumentation(): void {
    this.documentation = [];
  }

  public clearExamples(): void {
    this.examples = [];
  }

  public clearAll(): void {
    this.clearSuggestions();
    this.clearOptimizations();
    this.clearFixes();
    this.clearDocumentation();
    this.clearExamples();
  }

  public async askQuestion(question: string): Promise<string> {
    if (!this.options.enabled || !this.options.apiKey) {
      throw new Error('AI Assistant is not enabled or API key is not provided');
    }

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for the ONEDOT-JS framework. Your job is to answer questions about the framework, provide code examples, and help with development tasks.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  public async generateCode(prompt: string): Promise<string> {
    if (!this.options.enabled || !this.options.apiKey) {
      throw new Error('AI Assistant is not enabled or API key is not provided');
    }

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for the ONEDOT-JS framework. Your job is to generate code based on the provided prompt. The code should be written in TypeScript and follow the best practices of the ONEDOT-JS framework.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  public async explainCode(code: string): Promise<string> {
    if (!this.options.enabled || !this.options.apiKey) {
      throw new Error('AI Assistant is not enabled or API key is not provided');
    }

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for the ONEDOT-JS framework. Your job is to explain the provided code in a clear and concise manner.'
          },
          {
            role: 'user',
            content: `Explain this code:\n\n${code}`
          }
        ],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  public async refactorCode(code: string): Promise<string> {
    if (!this.options.enabled || !this.options.apiKey) {
      throw new Error('AI Assistant is not enabled or API key is not provided');
    }

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for the ONEDOT-JS framework. Your job is to refactor the provided code to improve its performance, readability, and maintainability while preserving its functionality.'
          },
          {
            role: 'user',
            content: `Refactor this code:\n\n${code}`
          }
        ],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
