/**
 * Base API Service
 * 
 * Centralized API handling with common fetch logic, error handling, and response parsing
 */

export class BaseApiService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  protected async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  /**
   * GET request helper
   */
  protected async get<T>(
    endpoint: string,
    headers?: HeadersInit
  ): Promise<T | null> {
    return this.fetch<T>(endpoint, { method: "GET", headers });
  }

  /**
   * POST request helper
   */
  protected async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: HeadersInit
  ): Promise<T | null> {
    return this.fetch<T>(endpoint, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

/**
 * Local Storage Helper
 * Centralizes localStorage access with type safety
 */
export class StorageHelper {
  private static isAvailable(): boolean {
    return typeof localStorage !== "undefined";
  }

  static setItem(key: string, value: string): void {
    if (this.isAvailable()) {
      localStorage.setItem(key, value);
    }
  }

  static getItem(key: string): string | null {
    if (this.isAvailable()) {
      return localStorage.getItem(key);
    }
    return null;
  }

  static removeItem(key: string): void {
    if (this.isAvailable()) {
      localStorage.removeItem(key);
    }
  }
}
