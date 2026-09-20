import type { ConnectToHostAppResult, HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

// The real ThreeDViewer mounts RevealWidget, which needs a WebGL context
// unavailable in happy-dom (see ThreeDViewer.test.tsx for that coverage).
vi.mock('./components/ThreeDViewer', () => ({
  default: () => <div data-testid="three-d-viewer-stub" />,
}));

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

type AppApi = Pick<HostAppAPI, 'syncInternalState'>;

function makeApi(): AppApi {
  return {
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
  };
}

function makeConnectedFn(api: AppApi = makeApi()) {
  return vi.fn(() => Promise.resolve({ api }));
}

function makeDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => new Promise<ConnectToHostAppResult>(() => undefined)),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<App deps={makeLoadingDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />);
    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders the unified workspace once connected (FR-017)', async () => {
    render(<App deps={makeDeps()} connectToHostApp={makeConnectedFn()} />);
    await waitFor(() => expect(screen.getByLabelText(/search for equipment/i)).toBeInTheDocument());
    expect(screen.getByRole('navigation', { name: 'Asset navigator' })).toBeInTheDocument();
    expect(screen.getByText(/search for equipment above or pick an asset/i)).toBeInTheDocument();
  });

  it('restores the selected asset from initial state (deep link, FR-003)', async () => {
    const api = makeApi();
    render(
      <App
        deps={makeDeps()}
        connectToHostApp={() =>
          Promise.resolve({
            api,
            initialState: JSON.stringify({
              selectedAssetId: { space: 'sp', externalId: 'PUMP-101' },
              searchQuery: '',
              navigatorCollapsed: false,
            }),
          })
        }
      />
    );

    await waitFor(() => expect(screen.getByRole('region', { name: 'Time series' })).toBeInTheDocument());
  });

  it('falls back to the waiting state for malformed initial state instead of crashing', async () => {
    render(<App deps={makeDeps()} connectToHostApp={() => Promise.resolve({ api: makeApi(), initialState: 'not json' })} />);
    await waitFor(() => expect(screen.getByLabelText(/search for equipment/i)).toBeInTheDocument());
    expect(screen.getByText(/search for equipment above or pick an asset/i)).toBeInTheDocument();
  });

  it('folds and unfolds the navigator, syncing the collapsed state to the host', async () => {
    const api = makeApi();
    render(<App deps={makeDeps()} connectToHostApp={makeConnectedFn(api)} />);
    await waitFor(() => expect(screen.getByLabelText(/search for equipment/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /collapse navigator/i }));

    expect(screen.getByRole('button', { name: /expand navigator/i })).toBeInTheDocument();
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({ selectedAssetId: null, searchQuery: '', navigatorCollapsed: true })
    );
  });
});
