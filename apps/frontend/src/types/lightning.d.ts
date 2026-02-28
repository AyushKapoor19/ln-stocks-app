/**
 * Type augmentation for Lightning.js
 * Extends Lightning.Component to include custom fireAncestors events
 */

import { Lightning } from "@lightningjs/sdk";
import type { IUser } from "./auth";
import type {
  ISelectStockEvent,
  ISearchActivatedEvent,
  ISearchDeactivatedEvent,
  IShowSearchResultsEvent,
  IUpdateSearchSelectionEvent,
  INavigateSearchResultsEvent,
  IClearSearchResultsEvent,
} from "./events";

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
        $authSuccess(data: { user: IUser; token: string }): void;
        $authenticationSuccess(data: { user: IUser; token: string }): void;
        $signOut(): void;
        $focusBackToTab(): void;

        // Search events
        $selectStock(event: ISelectStockEvent): void;
        $searchActivated(event: ISearchActivatedEvent): void;
        $searchDeactivated(event: ISearchDeactivatedEvent): void;
        $showSearchResults(event: IShowSearchResultsEvent): void;
        $updateSearchSelection(event: IUpdateSearchSelectionEvent): void;
        $navigateSearchResultsUp(event: INavigateSearchResultsEvent): void;
        $navigateSearchResultsDown(event: INavigateSearchResultsEvent): void;
        $clearSearchResults(event: IClearSearchResultsEvent): void;
        $openSearch(): void;
        $closeSearch(): void;
        $selectStockFromSearch(data: ISelectStockEvent): void;

        // Keyboard events
        $onKeyPress(event: { key: string }): void;
        $closeKeyboard(): void;
      }
    }
  }
}
