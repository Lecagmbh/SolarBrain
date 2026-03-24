type DetailHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function DetailHeader({ title, subtitle }: DetailHeaderProps) {
  return (
    <div style={{ padding: 16, borderBottom: "1px solid rgba(148,163,184,0.3)" }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>
        {title ?? "Anlagendetails"}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default DetailHeader;
