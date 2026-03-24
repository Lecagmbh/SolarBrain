import { useParams } from "react-router-dom";

export default function InstallationDetailPage() {
  const { id } = useParams();
  return (
    <div style={{ padding: 24 }}>
      Detailseite für Anlage #{id} (Placeholder – hier binden wir später das Detail-Layout an)
    </div>
  );
}
