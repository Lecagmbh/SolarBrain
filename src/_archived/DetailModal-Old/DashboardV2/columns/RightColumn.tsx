import { User } from 'lucide-react';
import { T, box, boxHeader, boxTitle } from '../styles';
import { WorkflowVertical } from '../sections/WorkflowVertical';
import { HealthScore } from '../sections/HealthScore';
import { TimelineCompact } from '../sections/TimelineCompact';
import { PortalCard } from '../sections/PortalCard';
import { usePermissions } from '../../../../../../hooks/usePermissions';
import type { Installation, NormalizedWizardData } from '../types';

interface RightColumnProps {
  data: Installation;
  wizardData: NormalizedWizardData;
  onStatusChange: (status: string) => void;
}

export function RightColumn({ data, wizardData, onStatusChange }: RightColumnProps) {
  const permissions = usePermissions();
  const isAdmin = permissions.isAdmin === true;

  return (
    <div className="gnz-scroll" style={{
      overflowY: 'auto', padding: 10,
      display: 'flex', flexDirection: 'column', gap: 10,
      borderLeft: `1px solid ${T.bd}`,
      minHeight: 0,
    }}>
      {/* Workflow */}
      <WorkflowVertical data={data} onStatusChange={onStatusChange} />

      {/* Health Score */}
      <HealthScore data={data} wizardData={wizardData} />

      {/* Kundenportal */}
      <PortalCard
        installationId={data.id}
        contactEmail={data.contactEmail || ''}
        customerName={data.customerName || ''}
        isAdmin={isAdmin}
      />

      {/* Timeline */}
      <TimelineCompact history={data.statusHistory} />

      {/* Ersteller */}
      {data.createdByName && (
        <div style={box}>
          <div style={boxHeader}>
            <div style={boxTitle}><User size={13} /> Ersteller</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: T.acGlow, color: T.ac,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {(data.createdByName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.t1 }}>
                {data.createdByName}
                {data.createdByCompany && (
                  <span style={{ color: T.t3, fontWeight: 400, marginLeft: 6 }}>
                    {data.createdByCompany}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
