export interface TabDef {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="flex gap-2 border-b border-slate-800 mb-4">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-3 py-1.5 text-sm rounded-t-lg border-b-2 ${
              active
                ? "border-sky-500 text-slate-50"
                : "border-transparent text-slate-400 hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
