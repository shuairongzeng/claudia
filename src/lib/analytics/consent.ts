import type { AnalyticsSettings } from './types';

const ANALYTICS_STORAGE_KEY = 'claudia-analytics-settings';

export class ConsentManager {
  private static instance: ConsentManager;
  private settings: AnalyticsSettings | null = null;
  
  private constructor() {}
  
  static getInstance(): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager();
    }
    return ConsentManager.instance;
  }
  
  async initialize(): Promise<AnalyticsSettings> {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      } else {
        // Initialize with default settings
        this.settings = {
          enabled: false,
          hasConsented: false,
          hasSeenBanner: false,
        };
      }
      
      // Generate anonymous user ID if not exists
      if (this.settings && !this.settings.userId) {
        this.settings.userId = this.generateAnonymousId();
        await this.saveSettings();
      }
      
      // Generate session ID
      if (this.settings) {
        this.settings.sessionId = this.generateSessionId();
      }
      
      // Ensure hasSeenBanner field exists for backward compatibility
      if (this.settings && this.settings.hasSeenBanner === undefined) {
        // If user has already made a consent decision, mark banner as seen
        // We can detect this by checking if they have consented OR if they have a userId
        // (which indicates they've interacted with the app before)
        const hasInteractedBefore = this.settings.hasConsented ||
                                   this.settings.consentDate ||
                                   this.settings.userId;

        this.settings.hasSeenBanner = !!hasInteractedBefore;
        await this.saveSettings();
      }

      return this.settings || {
        enabled: false,
        hasConsented: false,
        hasSeenBanner: false,
      };
    } catch (error) {
      console.error('Failed to initialize consent manager:', error);
      // Return default settings on error
      return {
        enabled: false,
        hasConsented: false,
        hasSeenBanner: false,
      };
    }
  }
  
  async grantConsent(): Promise<void> {
    if (!this.settings) {
      await this.initialize();
    }

    this.settings!.enabled = true;
    this.settings!.hasConsented = true;
    this.settings!.hasSeenBanner = true;
    this.settings!.consentDate = new Date().toISOString();

    await this.saveSettings();
  }
  
  async revokeConsent(): Promise<void> {
    if (!this.settings) {
      await this.initialize();
    }

    this.settings!.enabled = false;
    this.settings!.hasSeenBanner = true; // Mark banner as seen even when declining
    this.settings!.consentDate = new Date().toISOString(); // Record when user declined

    await this.saveSettings();
  }
  
  async deleteAllData(): Promise<void> {
    // Clear local storage
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    
    // Reset settings with new anonymous ID
    this.settings = {
      enabled: false,
      hasConsented: false,
      hasSeenBanner: false, // Reset banner state when deleting all data
      userId: this.generateAnonymousId(),
      sessionId: this.generateSessionId(),
    };
    
    await this.saveSettings();
  }
  
  getSettings(): AnalyticsSettings | null {
    return this.settings;
  }

  // Debug method to help troubleshoot banner issues
  debugBannerState(): void {
    console.log('=== Analytics Banner Debug ===');
    console.log('Settings:', this.settings);
    console.log('hasSeenBanner:', this.hasSeenBanner());
    console.log('hasConsented:', this.hasConsented());
    console.log('isEnabled:', this.isEnabled());
    console.log('==============================');
  }
  
  hasConsented(): boolean {
    return this.settings?.hasConsented || false;
  }

  hasSeenBanner(): boolean {
    return this.settings?.hasSeenBanner || false;
  }

  isEnabled(): boolean {
    return this.settings?.enabled || false;
  }
  
  getUserId(): string {
    return this.settings?.userId || this.generateAnonymousId();
  }
  
  getSessionId(): string {
    return this.settings?.sessionId || this.generateSessionId();
  }
  
  private async saveSettings(): Promise<void> {
    if (!this.settings) return;
    
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save analytics settings:', error);
    }
  }
  
  private generateAnonymousId(): string {
    // Generate a UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  private generateSessionId(): string {
    // Simple session ID based on timestamp and random value
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}