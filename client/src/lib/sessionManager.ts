// Stable anonymous session ID management for operation tracking
// This ensures all operations from the same browser session are tracked together

const SESSION_KEY = 'mj_session_id';
const SESSION_DATA_KEY = 'microJpegSession';

interface SessionData {
  compressions: number;
  conversions: number;
  uploadedFiles: any[];
  results: any[];
  showPricingProbability: number;
  activityScore: number;
  batchDownloadUrl?: string;
}

class SessionManager {
  private sessionId: string | null = null;

  /**
   * Get or create stable session ID - FORCE CONSISTENCY
   */
  getSessionId(): string {
    // ALWAYS check localStorage first for absolute consistency
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored && stored.startsWith('mj_client_')) {
        this.sessionId = stored;
        console.log(`🔧 Using stored session ID: ${this.sessionId}`);
        return this.sessionId;
      }
    } catch (error) {
      // localStorage not available or error
    }

    // Only generate new ID if we don't have one AND localStorage is empty
    if (!this.sessionId) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      this.sessionId = `mj_client_${timestamp}_${random}`;

      // Store in localStorage immediately
      try {
        localStorage.setItem(SESSION_KEY, this.sessionId);
        console.log(`🔧 Generated and stored new session ID: ${this.sessionId}`);
      } catch (error) {
        console.log(`🔧 Generated temporary session ID: ${this.sessionId}`);
      }
    }

    return this.sessionId;
  }

  /**
   * Get session data from sessionStorage
   */
  getSession(): SessionData {
    try {
      const stored = sessionStorage.getItem(SESSION_DATA_KEY);
      const session = stored ? JSON.parse(stored) : {
        compressions: 0,
        conversions: 0,
        uploadedFiles: [],
        results: [],
        showPricingProbability: 0,
        activityScore: 0
      };
      return session;
    } catch (error) {
      return {
        compressions: 0,
        conversions: 0,
        uploadedFiles: [],
        results: [],
        showPricingProbability: 0,
        activityScore: 0
      };
    }
  }

  /**
   * Update session data in sessionStorage
   */
  updateSession(updates: Partial<SessionData>): SessionData {
    const current = this.getSession();
    const updated = { ...current, ...updates };
    try {
      sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(updated));
    } catch (error) {
      // sessionStorage not available
    }
    return updated;
  }

  /**
   * Track user activity and update scoring
   */
  trackActivity(): SessionData {
    const session = this.getSession();
    const activityScore = session.activityScore + 1;
    const showPricingProbability = Math.min(activityScore * 0.15, 0.6);
    
    return this.updateSession({
      activityScore,
      showPricingProbability
    });
  }

  /**
   * Clear session ID (for testing purposes)
   */
  clearSession(): void {
    this.sessionId = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_DATA_KEY);
    } catch (error) {
      // ignore
    }
  }
}

export const sessionManager = new SessionManager();