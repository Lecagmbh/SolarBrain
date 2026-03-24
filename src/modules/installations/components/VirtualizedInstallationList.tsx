import { memo, useCallback } from "react";

export type InstallationListItem = {
  id: number | string;
  customerName: string;
  location: string;
  statusLabel: string;
  updatedAt: string;
};

const InstallationRow = memo(function InstallationRow({
  inst,
  onSelect,
}: {
  inst: InstallationListItem;
  onSelect: (item: InstallationListItem) => void;
}) {
  return (
    <div className="virt-row" onClick={() => onSelect(inst)}>
      <div className="virt-cell">{inst.id}</div>
      <div className="virt-cell">{inst.customerName}</div>
      <div className="virt-cell">{inst.location}</div>
      <div className="virt-cell">{inst.statusLabel}</div>
      <div className="virt-cell">{inst.updatedAt}</div>
    </div>
  );
});

export const VirtualizedInstallationList = memo(function VirtualizedInstallationList({
  items,
  onSelect,
}: {
  items: InstallationListItem[];
  onSelect: (item: InstallationListItem) => void;
}) {
  return (
    <div>
      {items.map((inst) => (
        <InstallationRow key={inst.id} inst={inst} onSelect={onSelect} />
      ))}
    </div>
  );
});
