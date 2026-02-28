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
      const headers: Record<string, string> = Object.assign(
        {},
        options.headers as Record<string, string>
      );
      
      // Only set Content-Type if there's a body
      if (options.body) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, Object.assign(
        {},
        options,
        { headers }
      ));

      if (!response.ok) {
        console.error(`API Error: ${response.status} ${endpoint}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Network Error: ${endpoint}`, error);
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
