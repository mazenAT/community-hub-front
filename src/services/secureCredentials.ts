// Secure credentials storage for Fawry integration
// No backend required - production secure
// Includes rate limiting and concurrent request handling

import { Preferences } from '@capacitor/preferences';

interface FawryCredentials {
  merchantCode: string;
  securityKey: string;
  environment: 'staging' | 'production';
  apiBaseUrl: string;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class SecureCredentialsService {
  private static instance: SecureCredentialsService;
  private credentials: FawryCredentials | null = null;
  private rateLimitInfo: RateLimitInfo = {
    count: 0,
    resetTime: Date.now() + (15 * 60 * 1000), // 15 minutes
    lastRequest: 0
  };
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private maxConcurrentRequests = 3;
  private activeRequests = 0;

  static getInstance() {
    if (!SecureCredentialsService.instance) {
      SecureCredentialsService.instance = new SecureCredentialsService();
    }
    return SecureCredentialsService.instance;
  }

  // Initialize with default staging credentials
  async initialize(): Promise<void> {
    try {
      const stored = await this.loadStoredCredentials();
      
      if (stored) {
        this.credentials = stored;
        console.log('Loaded stored Fawry credentials');
      } else {
        // Set default staging credentials
        await this.setDefaultCredentials();
        console.log('Set default staging credentials');
      }

      // Load rate limit info
      await this.loadRateLimitInfo();
    } catch (error) {
      console.error('Failed to initialize credentials:', error);
      this.setFallbackCredentials();
    }
  }

  // Get credentials with rate limiting
  getCredentials(): FawryCredentials {
    if (!this.credentials) {
      throw new Error('Credentials not initialized. Call initialize() first.');
    }
    return this.credentials;
  }

  // Check rate limit before making request
  async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Reset counter if time window has passed
    if (now > this.rateLimitInfo.resetTime) {
      this.rateLimitInfo.count = 0;
      this.rateLimitInfo.resetTime = now + (15 * 60 * 1000); // 15 minutes
    }

    // Check if we're within rate limits
    if (this.rateLimitInfo.count >= 30) { // Max 30 requests per 15 minutes
      const timeUntilReset = this.rateLimitInfo.resetTime - now;
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 60000)} minutes.`);
    }

    // Update rate limit info
    this.rateLimitInfo.count++;
    this.rateLimitInfo.lastRequest = now;
    await this.saveRateLimitInfo();

    return true;
  }

  // Queue request with concurrency control
  async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          // Check rate limit
          await this.checkRateLimit();
          
          // Wait for available slot
          while (this.activeRequests >= this.maxConcurrentRequests) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          this.activeRequests++;
          
          try {
            const result = await requestFn();
            resolve(result);
          } finally {
            this.activeRequests--;
            this.processQueue();
          }
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(executeRequest);
      this.processQueue();
    });
  }

  // Process queued requests
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeRequests >= this.maxConcurrentRequests) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      if (request) {
        request().catch(error => {
          console.error('Queued request failed:', error);
        });
      }
    }

    this.isProcessing = false;
  }

  // Get current rate limit status
  getRateLimitStatus(): RateLimitInfo & { remainingRequests: number } {
    const now = Date.now();
    const timeUntilReset = Math.max(0, this.rateLimitInfo.resetTime - now);
    
    return {
      ...this.rateLimitInfo,
      resetTime: timeUntilReset,
      remainingRequests: Math.max(0, 30 - this.rateLimitInfo.count)
    };
  }

  // Update to production credentials
  async setProductionCredentials(merchantCode: string, securityKey: string): Promise<void> {
    this.credentials = {
      merchantCode,
      securityKey,
      environment: 'production',
      apiBaseUrl: 'https://www.atfawry.com'
    };
    await this.storeCredentials(this.credentials);
    console.log('Production credentials set successfully');
  }

  // Check if using production
  isProduction(): boolean {
    return this.credentials?.environment === 'production';
  }

  // Get API endpoints
  getApiEndpoints() {
    const baseUrl = this.credentials?.apiBaseUrl || 'https://atfawry.fawrystaging.com';
    return {
      tokenEndpoint: `${baseUrl}/fawrypay-api/api/cards/cardToken`,
      paymentEndpoint: `${baseUrl}/fawrypay-api/api/payments/charge`,
      baseUrl
    };
  }

  // Clear rate limit (for testing)
  async clearRateLimit(): Promise<void> {
    this.rateLimitInfo = {
      count: 0,
      resetTime: Date.now() + (15 * 60 * 1000),
      lastRequest: 0
    };
    await this.saveRateLimitInfo();
  }

  private async setDefaultCredentials(): Promise<void> {
    const defaultCreds: FawryCredentials = {
      merchantCode: '770000017341',
      securityKey: '02b9d0e3-5088-4b6e-be41-111d4359fe10',
      environment: 'staging',
      apiBaseUrl: 'https://atfawry.fawrystaging.com'
    };

    this.credentials = defaultCreds;
    await this.storeCredentials(defaultCreds);
  }

  private setFallbackCredentials(): void {
    this.credentials = {
      merchantCode: '770000017341',
      securityKey: '02b9d0e3-5088-4b6e-be41-111d4359fe10',
      environment: 'staging',
      apiBaseUrl: 'https://atfawry.fawrystaging.com'
    };
  }

  private async storeCredentials(credentials: FawryCredentials): Promise<void> {
    try {
      await Preferences.set({
        key: 'fawry_credentials',
        value: JSON.stringify(credentials)
      });
    } catch (error) {
      console.error('Failed to store credentials:', error);
    }
  }

  private async loadStoredCredentials(): Promise<FawryCredentials | null> {
    try {
      const stored = await Preferences.get({ key: 'fawry_credentials' });
      return stored.value ? JSON.parse(stored.value) : null;
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return null;
    }
  }

  private async saveRateLimitInfo(): Promise<void> {
    try {
      await Preferences.set({
        key: 'fawry_rate_limit',
        value: JSON.stringify(this.rateLimitInfo)
      });
    } catch (error) {
      console.error('Failed to save rate limit info:', error);
    }
  }

  private async loadRateLimitInfo(): Promise<void> {
    try {
      const stored = await Preferences.get({ key: 'fawry_rate_limit' });
      if (stored.value) {
        this.rateLimitInfo = JSON.parse(stored.value);
      }
    } catch (error) {
      console.error('Failed to load rate limit info:', error);
    }
  }

  // Clear credentials
  async clearCredentials(): Promise<void> {
    try {
      await Preferences.remove({ key: 'fawry_credentials' });
      await Preferences.remove({ key: 'fawry_rate_limit' });
      this.credentials = null;
      this.rateLimitInfo = {
        count: 0,
        resetTime: Date.now() + (15 * 60 * 1000),
        lastRequest: 0
      };
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }
}

export const secureCredentials = SecureCredentialsService.getInstance();
export default secureCredentials; 