export type RawDataViewerProps = {
  data?: unknown;
};

export function RawDataViewer({ data }: RawDataViewerProps) {
  return (
    <div style={{ padding: 16 }}>
      <pre
        style={{
          background: "rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        {JSON.stringify(data ?? {}, null, 2)}
      </pre>
    </div>
  );
}

export default RawDataViewer;
