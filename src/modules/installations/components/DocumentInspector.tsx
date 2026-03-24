import React from "react";
import type { UploadMeta } from "../types";

type Props = {
  docs: UploadMeta[];
};

export const DocumentInspector: React.FC<Props> = ({ docs }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {docs.map((d) => (
        <div
          key={d.filename}
          className="p-4 rounded-xl bg-[#0f1623]/80 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
        >
          <p className="font-semibold text-white">{d.filename}</p>
          <p className="text-slate-400 text-sm">{d.contentType}</p>
          {d.url && (
            <a
              href={d.url}
              target="_blank"
              className="text-[#00b7ff] text-sm mt-2 inline-block"
            >
              Öffnen →
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
