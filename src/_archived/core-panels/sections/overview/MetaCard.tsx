/**
 * MetaCard – Creation and update metadata
 */

import { Calendar, User } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { DataGrid } from '../../primitives/DataGrid';

interface MetaCardProps {
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  publicId?: string;
}

export function MetaCard({ createdAt, updatedAt, createdByName, publicId }: MetaCardProps) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <SectionCard title="Meta">
      <DataGrid
        data={[
          ...(publicId ? [{ label: 'Public ID', value: publicId, copyable: true, mono: true }] : []),
          { label: 'Erstellt', value: fmt(createdAt) },
          { label: 'Aktualisiert', value: fmt(updatedAt) },
          ...(createdByName ? [{ label: 'Erstellt von', value: createdByName }] : []),
        ]}
      />
    </SectionCard>
  );
}
