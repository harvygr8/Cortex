class OllamaStatus {
  public baseUrl: string;
  public isRunning: boolean;

  constructor() {
    this.baseUrl = 'http://localhost:11434';
    this.isRunning = false;
    console.log('OllamaStatus: Initialized with baseUrl:', this.baseUrl);
  }

  async checkStatus() {
    try {
      console.log('OllamaStatus: Checking server status...');
      const response = await fetch(`${this.baseUrl}/api/tags`);
      this.isRunning = response.ok;
      console.log('OllamaStatus: Server status check result:', this.isRunning);
      return response.ok;
    } catch (error: unknown) {
      console.error('OllamaStatus: Server check failed:', (error as Error).message);
      this.isRunning = false;
      return false;
    }
  }

  async checkModel(modelName = 'llama3.2') {
    try {
      console.log(`OllamaStatus: Checking for model ${modelName}...`);
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        console.log('OllamaStatus: Failed to get model list - server returned error');
        return false;
      }
      
      const data = await response.json();
      const modelExists = data.models?.includes(modelName) || false;
      console.log(`OllamaStatus: Model ${modelName} ${modelExists ? 'found' : 'not found'}`);
      return modelExists;
    } catch (error: unknown) {
      console.error('OllamaStatus: Model check failed:', (error as Error).message);
      return false;
    }
  }

  getStatus() {
    console.log('OllamaStatus: Current server status:', this.isRunning);
    return this.isRunning;
  }
}

// Log when the singleton is created
console.log('OllamaStatus: Creating singleton instance');
export default new OllamaStatus(); 