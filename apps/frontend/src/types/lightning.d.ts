/**
 * Type augmentation for Lightning.js
 * Extends Lightning.Component to include custom fireAncestors events
 */

import { Lightning } from "@lightningjs/sdk";

declare module "@lightningjs/sdk" {
  namespace Lightning {
    namespace Component {
      interface FireAncestorsMap {
        // Navigation events
        $navigateBack(): void;
        $navigateToHome(): void;
        $navigateToSignIn(): void;
        $navigateToSignUp(): void;
        $showAuthFlow(): void;

        // Auth events
        $authSuccess(data: { user: any; token: string }): void;
        $authenticationSuccess(data: { user: any; token: string }): void;
        $signOut(): void;
        $focusBackToTab(): void;

        // Search events
        $selectStock(event: any): void;
        $searchActivated(event: any): void;
        $searchDeactivated(event: any): void;
        $showSearchResults(event: any): void;
        $updateSearchSelection(event: any): void;
        $navigateSearchResultsUp(event: any): void;
        $navigateSearchResultsDown(event: any): void;
        $clearSearchResults(event: any): void;
        $openSearch(): void;
        $closeSearch(): void;
        $selectStockFromSearch(data: { symbol: string; name: string }): void;

        // Keyboard events
        $onKeyPress(event: { key: string }): void;
        $closeKeyboard(): void;
      }
    }
  }
}
