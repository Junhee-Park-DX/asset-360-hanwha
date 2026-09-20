import { useCogniteSdk } from '@cognite/app-sdk/react';
import { Button } from '@cognite/aura/components/button';

import { CogniteFileViewer } from '../cognite-file-viewer';
import type { DocumentSummary } from '../services/types';

/**
 * Default-exported and lazy-loaded from DocumentsPanel.tsx: CogniteFileViewer
 * pulls in react-pdf/pdf.js, which was previously bundled eagerly into the
 * app's main chunk even though a preview only renders after the user clicks
 * "Preview" on a document. Lazy-loading it (same pattern as ThreeDViewer)
 * keeps that weight out of initial load.
 */
export default function DocumentPreview({ document, onClose }: { document: DocumentSummary; onClose: () => void }) {
  // CogniteFileViewer is a vendored third-party component that requires the
  // raw SDK client as a prop — it isn't one of this app's own CDF calls, so
  // it stays outside the service/ViewModel layer.
  const client = useCogniteSdk();
  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{document.name}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {/* CogniteFileViewer renders PDFs via pdf.js (no embedded-script execution)
          and images via a plain <img>, inside this app's own sandboxed/CSP'd
          origin — no raw <iframe>/<embed> of untrusted file content (FR-010a). */}
      <CogniteFileViewer
        source={{ type: 'instanceId', space: document.instanceId.space, externalId: document.instanceId.externalId }}
        client={client}
        style={{ width: '100%', height: '480px' }}
      />
    </div>
  );
}
