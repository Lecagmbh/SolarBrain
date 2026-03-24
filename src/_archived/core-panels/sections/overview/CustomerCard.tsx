/**
 * CustomerCard – Anlagenbetreiber info with copyable fields
 */

import { User, Phone, Mail, Cake } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';

interface CustomerCardProps {
  customerName: string;
  phone?: string;
  mobile?: string;
  email?: string;
  birthday?: string;
  salutation?: string;
  title?: string;
}

export function CustomerCard({
  customerName,
  phone,
  mobile,
  email,
  birthday,
  salutation,
  title,
}: CustomerCardProps) {
  const salutationText = salutation
    ? `${salutation === 'herr' ? 'Herr' : salutation === 'frau' ? 'Frau' : salutation}${title ? ` ${title}` : ''}`
    : null;

  return (
    <SectionCard title="Anlagenbetreiber">
      <div className="flex flex-col gap-2">
        {salutationText && (
          <span className="text-xs text-[var(--text-muted)]">{salutationText}</span>
        )}
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-[var(--text-muted)] shrink-0" />
          <CopyableField value={customerName} />
        </div>
        {phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={14} className="text-[var(--text-muted)] shrink-0" />
            <CopyableField value={phone} />
          </div>
        )}
        {mobile && (
          <div className="flex items-center gap-1.5">
            <Phone size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Mobil</span>
            <CopyableField value={mobile} />
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1.5">
            <Mail size={14} className="text-[var(--text-muted)] shrink-0" />
            <CopyableField value={email} />
          </div>
        )}
        {birthday && (
          <div className="flex items-center gap-1.5">
            <Cake size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-xs text-[var(--text-primary)]">
              {new Date(birthday).toLocaleDateString('de-DE')}
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
