import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { useEffect, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { ProjectState } from '../store/types';

/**
 * Encodes the project state to a URL hash, stripping volatile meta fields.
 */
export const encodeStateToUrl = (state: ProjectState): string => {
  const { updatedAt: _u, createdAt: _c, version: _v, ...metaToEncode } = state.meta;
  const stripped = { ...state, meta: metaToEncode };
  const json = JSON.stringify(stripped);
  const compressed = compressToEncodedURIComponent(json);
  return compressed;
};

/**
 * Decodes the project state from the URL hash, reconstructing stripped meta fields.
 */
export const decodeStateFromUrl = (): ProjectState | null => {
  try {
    const hash = window.location.hash.slice(1); // Remove the '#' prefix
    if (!hash) return null;

    const decompressed = decompressFromEncodedURIComponent(hash);
    if (!decompressed) return null;

    const state = JSON.parse(decompressed) as ProjectState;
    const now = new Date().toISOString();
    state.meta.createdAt = now;
    state.meta.updatedAt = now;
    state.meta.version = 1;
    return state;
  } catch (error) {
    console.error('Failed to decode state from URL:', error);
    return null;
  }
};

const DEFAULT_TITLE = 'Untitled project';

const isDefaultState = (state: ProjectState): boolean => {
  const mainNav = state.groups.find((g) => g.prototypeRole === 'main-nav');
  return (
    state.groups.length === 1 &&
    (mainNav?.cardIds.length ?? 0) === 0 &&
    state.meta.title === DEFAULT_TITLE
  );
};

/**
 * Updates the URL hash with the current state, or clears it if no meaningful changes exist.
 */
export const updateUrlWithState = (state: ProjectState): void => {
  if (isDefaultState(state)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } else {
    window.location.hash = encodeStateToUrl(state);
  }
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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const unsubscribe = useProjectStore.subscribe((_state) => {
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
