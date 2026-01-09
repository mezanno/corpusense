# Unit Tests Documentation

This document provides a detailed overview of the unit and component tests implemented and fixed during the optimization phase. It explains the testing architecture, the configuration of the environment, and the rationale behind specific test implementations.

## 1. Test Configuration & Environment

The project uses **Vitest** as a test runner and **React Testing Library** for component testing.

### Global Setup (`vitest.setup.ts`)

To ensure a stable and predictable testing environment, several global mocks are defined:

- **UI Components (Clover IIIF)**: Components from `@samvera/clover-iiif/primitives` (Label, Metadata, Summary, Thumbnail) are mocked to render their content into simple `div` elements with `data-testid` attributes. This prevents CSSOM errors (`insertRule` failures) while allowing tests to assert on the actual data passed to these components.
- **Supabase**: The `@/utils/config` Supabase client is mocked globally to prevent real network calls and provide a controlled environment for authentication-related logic.
- **`matchMedia` Polyfill**: Added to `globalThis` to support components from `shadcn-ui` and `sonner` that rely on viewport detection (used in `use-mobile` hooks and toast positioning).
- **i18next**: Mocked to return translation keys directly, simplifying assertions and avoiding localization dependencies in unit tests.

### Test Utilities (`src/__tests__/utils.tsx`)

The `renderWithProviders` helper is the core utility for component testing. It wraps the component under test with all necessary React Contexts:

- `Provider` (Redux)
- `ConnectedUserProvider`
- `ExperimentalProvider`
- `AlertDialogProvider`
- `CollectionProvider`
- `WorkerProvider`
- `MemoryRouter`

This eliminates "context not found" errors and ensures components have access to the global state and services they expect.

---

## 2. Data Utility Tests (`src/data/utils/__tests__`)

These tests target "pure" logic and data transformations, following the project's testing pyramid strategy.

### `canvas.test.ts`

- **Why**: Canvas handling is central to IIIF manifest navigation and display.
- **What it tests**:
  - `getLabel`: Correctly extracts labels from complex IIIF Language Map objects (e.g., handling `none` keys vs. language-specific keys).
  - `getImage`: Safely extracts image resources from canvas items.
  - `getImageForThumbnail`: Tests the regex-based URL manipulation that converts full-size IIIF images into smaller thumbnails.
  - `toGallicaUrl`: Verifies the conversion of BnF Gallica IIIF identifiers into persistent item URLs.
- **How**: Uses JSON mocks of real IIIF canvases to verify extraction logic.

### `manifest.test.ts`

- **Why**: Handles manifest metadata and history storage.
- **What it tests**:
  - Label extraction from manifests.
  - Consistency of manifest IDs.

### `namedEntity.test.ts`

- **Why**: This contains the complex logic for mapping extracted text back to spatial coordinates on a canvas.
- **What it tests**:
  - `computeSelector`: Identifies word indexes within a set of annotations for a given search string.
  - `generateNamedEntity`: Orchestrates the creation of a named entity model with correct UUIDs and relationships.

### `annotations.test.ts`

- **Why**: Essential for the transition to the new annotation model structure.
- **What it tests**:
  - Correct generation of `TEXT_REGION` and `TEXT_LINE` elements.
  - Handling of classification values and spatial targets.

### `export.test.ts`

- **Why**: Exporting data involves interacting with IndexedDB.
- **What it tests**:
  - Mocking of Dexie and database factories to verify that export logic correctly queries the database without requiring a real browser environment.

---

## 3. Page and Component Tests (`src/pages/__tests__`)

These tests verify the integration of hooks and state into the UI, ensuring that pages respond correctly to different data states.

### `Layout.test.tsx`

- **Why**: As the main structural component, it depends on almost every context in the app.
- **What it tests**:
  - Rendering of the sidebar and header.
  - Interaction with the `HistoryDrawer`.
  - Correct display of the "Collections" badge and counts.
- **How**: Extensive mocking of context hooks (`useWorkerContext`, `useCollectionContext`, etc.) to isolate the UI layout from the underlying database services.

### `ManifestExplorerPage.test.tsx`

- **Why**: This is the primary entry point for manifest visualization.
- **What it tests**:
  - **Welcome State**: Shows the `Welcome` component when no data is loaded and history is empty.
  - **Loaded State**: Displays manifest details and the gallery when a manifest is active.
  - **Loading State**: Displays a loader when data is being fetched.

### `CollectionsManagerPage.test.tsx`

- **Why**: Manages user-created data.
- **What it tests**:
  - Display of the empty state (call to action).
  - Rendering of the collection list when data is present.
  - Proper hook integration for data fetching.

### `CollectionInspectorPage.test.tsx`

- **Why**: Dynamic routing and detail view.
- **What it tests**:
  - Handling of invalid or missing `collectionId` params.
  - Loading states and error messages.

---

## 4. Mocking Strategy Recommendation

For future tests, the following pattern has proven most robust:

1. **Mock the Hook, not the Provider**: If a component uses a custom hook (e.g., `useManifests`), mock that hook directly in the test file using `vi.mock`.
2. **Use `renderWithProviders`**: Always use the helper to ensure a consistent environment.
3. **Mock Fragment Providers**: For layout-level tests, mock providers to simply return `{children}` to avoid heavy lifecycle logic during simple UI tests.
