import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteSdkProvider, useCogniteSdk } from '@cognite/app-sdk/react';
// Import per-component, not from the `@cognite/aura/components` barrel: the
// barrel pulls in Aura's entire dependency graph (including large libraries like
// mermaid and shiki), which slows the build and can exhaust memory in CI.
import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Card, CardContent } from '@cognite/aura/components/card';
import { Loader } from '@cognite/aura/components/loader';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

import { AppErrorBoundary } from './components/AppErrorBoundary';
import { WorkspaceView } from './components/WorkspaceView';
import { ServicesProvider } from './context/ServicesContext';
import type { InstanceRef } from './services/types';

interface AppState {
  selectedAssetId: InstanceRef | null;
  searchQuery: string;
  navigatorCollapsed: boolean;
}

const DEFAULT_STATE: AppState = { selectedAssetId: null, searchQuery: '', navigatorCollapsed: false };

type AppApi = Pick<HostAppAPI, 'syncInternalState'>;
type AppConnectResult = { api: AppApi; initialState?: string };

const loadingFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Card aria-label="Loading project" aria-live="polite">
          <CardContent>
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <Loader size={20} />
              <span>Loading project...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>
);

const errorFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Alert>
          <AlertDescription>Failed to connect to Fusion host</AlertDescription>
        </Alert>
      </div>
    </section>
  </main>
);

function parseAssetId(value: unknown): InstanceRef | null {
  if (typeof value !== 'object' || value === null) return null;
  const { space, externalId } = value as { space?: unknown; externalId?: unknown };
  return typeof space === 'string' && typeof externalId === 'string' ? { space, externalId } : null;
}

function parseInitialState(initialState: string | undefined): AppState {
  if (!initialState) return DEFAULT_STATE;
  try {
    const parsed: unknown = JSON.parse(initialState);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE;
    const record = parsed as Record<string, unknown>;
    return {
      selectedAssetId: parseAssetId(record.selectedAssetId),
      searchQuery: typeof record.searchQuery === 'string' ? record.searchQuery : '',
      navigatorCollapsed: record.navigatorCollapsed === true,
    };
  } catch {
    // ignore malformed saved state
  }
  return DEFAULT_STATE;
}

type AppContentProps = { api: AppApi | null; initialState?: string };

function AppContent({ api, initialState }: AppContentProps) {
  const client = useCogniteSdk();
  // initialState is restored from the ?customAppInternalState search param by
  // the host — a lazy initializer, not an effect, since it only needs to run
  // once per real connection (AppContent remounts when that connection changes).
  const [state, setState] = useState<AppState>(() => parseInitialState(initialState));

  // Syncing lives in its own effect, driven by whatever `state` actually
  // ends up being — not called imperatively at each call site. WorkspaceView
  // sometimes fires two state-changing callbacks back-to-back in one handler
  // (selecting a result also clears the search query); composing each one
  // off a stale outer `state` closure would let the second call clobber the
  // first. The functional updater form below always builds on the latest
  // state regardless of how many updates land in the same synchronous pass.
  useEffect(() => {
    void api?.syncInternalState(JSON.stringify(state));
  }, [api, state]);

  return (
    <ServicesProvider client={client}>
      <WorkspaceView
        selectedAssetId={state.selectedAssetId}
        onSelectAsset={(selectedAssetId) => setState((prev) => ({ ...prev, selectedAssetId }))}
        searchQuery={state.searchQuery}
        onSearchQueryChange={(searchQuery) => setState((prev) => ({ ...prev, searchQuery }))}
        navigatorCollapsed={state.navigatorCollapsed}
        onToggleNavigatorCollapsed={() => setState((prev) => ({ ...prev, navigatorCollapsed: !prev.navigatorCollapsed }))}
      />
    </ServicesProvider>
  );
}

type AppProps = {
  deps?: ComponentProps<typeof CogniteSdkProvider>['deps'];
  connectToHostApp?: () => Promise<AppConnectResult>;
};

function App({ deps, connectToHostApp = deps?.connectToHostApp ?? connectToHostAppImpl }: AppProps) {
  const [connection, setConnection] = useState<AppConnectResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void connectToHostApp().then((result) => {
      if (!cancelled) setConnection(result);
    });
    return () => {
      cancelled = true;
    };
  }, [connectToHostApp]);

  return (
    <AppErrorBoundary>
      <CogniteSdkProvider loadingFallback={loadingFallback} errorFallback={errorFallback} deps={deps}>
        <AppContent api={connection?.api ?? null} initialState={connection?.initialState} />
      </CogniteSdkProvider>
    </AppErrorBoundary>
  );
}

export default App;
