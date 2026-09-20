import type { CogniteClient } from '@cognite/sdk';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { buildServices, ServicesReactContext } from './services';

export function ServicesProvider({ client, children }: { client: CogniteClient; children: ReactNode }) {
  const services = useMemo(() => buildServices(client, window.localStorage), [client]);

  return <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>;
}
