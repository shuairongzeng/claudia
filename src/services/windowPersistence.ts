/**
 * Window Persistence Service
 * Handles saving and restoring window size to/from localStorage
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { PhysicalSize } from '@tauri-apps/api/dpi';

const WINDOW_SIZE_KEY = 'claudia_window_size';
const PERSISTENCE_ENABLED_KEY = 'claudia_window_persistence_enabled';

interface WindowSize {
  width: number;
  height: number;
  timestamp: number;
}

export class WindowPersistenceService {
  private static saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Check if window persistence is enabled
   */
  static isEnabled(): boolean {
    const enabled = localStorage.getItem(PERSISTENCE_ENABLED_KEY);
    // Default to true if not set
    return enabled === null || enabled === 'true';
  }

  /**
   * Enable or disable window persistence
   */
  static setEnabled(enabled: boolean): void {
    localStorage.setItem(PERSISTENCE_ENABLED_KEY, String(enabled));
    if (!enabled) {
      // Clear saved window size when disabling persistence
      this.clearWindowSize();
    }
  }

  /**
   * Save current window size to localStorage (debounced)
   */
  static async saveWindowSize(): Promise<void> {
    if (!this.isEnabled()) return;

    // Clear existing timeout to debounce rapid resize events
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Debounce saving to avoid excessive localStorage writes during resize
    this.saveTimeout = setTimeout(async () => {
      try {
        const window = getCurrentWindow();
        const size = await window.innerSize();
        
        const windowSize: WindowSize = {
          width: size.width,
          height: size.height,
          timestamp: Date.now()
        };

        localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify(windowSize));
        console.log('Window size saved:', windowSize);
      } catch (error) {
        console.error('Failed to save window size:', error);
      }
    }, 500); // 500ms debounce
  }

  /**
   * Restore window size from localStorage
   */
  static async restoreWindowSize(): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const savedData = localStorage.getItem(WINDOW_SIZE_KEY);
      if (!savedData) return false;

      const windowSize: WindowSize = JSON.parse(savedData);
      
      // Validate the saved data
      if (!windowSize.width || !windowSize.height || 
          windowSize.width < 400 || windowSize.height < 300 ||
          windowSize.width > 4000 || windowSize.height > 3000) {
        console.warn('Invalid saved window size, skipping restore');
        return false;
      }

      const window = getCurrentWindow();
      const size = new PhysicalSize(windowSize.width, windowSize.height);
      await window.setSize(size);

      console.log('Window size restored:', windowSize);
      return true;
    } catch (error) {
      console.error('Failed to restore window size:', error);
      return false;
    }
  }

  /**
   * Get saved window size without applying it
   */
  static getSavedWindowSize(): WindowSize | null {
    if (!this.isEnabled()) return null;

    try {
      const savedData = localStorage.getItem(WINDOW_SIZE_KEY);
      if (!savedData) return null;

      return JSON.parse(savedData);
    } catch (error) {
      console.error('Failed to get saved window size:', error);
      return null;
    }
  }

  /**
   * Clear saved window size
   */
  static clearWindowSize(): void {
    localStorage.removeItem(WINDOW_SIZE_KEY);
    console.log('Window size data cleared');
  }

  /**
   * Initialize window resize listener
   */
  static initializeResizeListener(): () => void {
    if (!this.isEnabled()) return () => {};

    const handleResize = () => {
      this.saveWindowSize();
    };

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
    };
  }
}
