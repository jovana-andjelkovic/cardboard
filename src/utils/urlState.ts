import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { useEffect, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { ProjectState } from '../store/types';

/**
 * Encodes the project state to a URL hash
 */
export const encodeStateToUrl = (state: ProjectState): string => {
  const json = JSON.stringify(state);
  const compressed = compressToEncodedURIComponent(json);
  return compressed;
};

/**
 * Decodes the project state from the URL hash
 */
export const decodeStateFromUrl = (): ProjectState | null => {
  try {
    const hash = window.location.hash.slice(1); // Remove the '#' prefix
    if (!hash) return null;

    const decompressed = decompressFromEncodedURIComponent(hash);
    if (!decompressed) return null;

    const state = JSON.parse(decompressed) as ProjectState;
    return state;
  } catch (error) {
    console.error('Failed to decode state from URL:', error);
    return null;
  }
};

/**
 * Updates the URL hash with the current state
 */
export const updateUrlWithState = (state: ProjectState): void => {
  const encoded = encodeStateToUrl(state);
  window.location.hash = encoded;
};

/**
 * React hook that syncs the Zustand store with the URL hash
 * - On mount, loads state from URL if available
 * - Debounces URL updates (500ms) when store changes
 */
export const useUrlSync = () => {
  const getSnapshot = useProjectStore((state) => state.getSnapshot);
  const loadSnapshot = useProjectStore((state) => state.loadSnapshot);
  const hasLoadedFromUrl = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // On mount, load from URL if hash exists
  useEffect(() => {
    if (!hasLoadedFromUrl.current) {
      const stateFromUrl = decodeStateFromUrl();
      if (stateFromUrl) {
        loadSnapshot(stateFromUrl);
      }
      hasLoadedFromUrl.current = true;
    }
  }, [loadSnapshot]);

  // Subscribe to store changes and update URL (debounced)
  useEffect(() => {
    const unsubscribe = useProjectStore.subscribe((state) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced update
      debounceTimerRef.current = setTimeout(() => {
        const snapshot = getSnapshot();
        updateUrlWithState(snapshot);
      }, 500);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [getSnapshot]);
};
