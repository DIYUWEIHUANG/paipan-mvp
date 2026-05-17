import { Copy } from 'lucide-react';

type JsonViewerProps = {
  data: unknown;
};

export function JsonViewer({ data }: JsonViewerProps) {
  const json = JSON.stringify(data, null, 2);

  async function copyJson() {
    await navigator.clipboard.writeText(json);
  }

  return (
    <details className="surface json-viewer">
      <summary>
        <span>原始 JSON</span>
        <button className="icon-button" type="button" onClick={(event) => {
          event.preventDefault();
          void copyJson();
        }} title="复制 JSON">
          <Copy size={16} aria-hidden="true" />
        </button>
      </summary>
      <pre>{json}</pre>
    </details>
  );
}
