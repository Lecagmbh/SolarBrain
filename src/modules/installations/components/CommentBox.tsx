import React, { useState } from "react";

type Props = {
  onSubmit: (text: string) => void;
};

export const CommentBox: React.FC<Props> = ({ onSubmit }) => {
  const [text, setText] = useState("");

  return (
    <div className="p-4 rounded-xl bg-[#0f1623]/80 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-28 bg-[#0d1117] text-slate-200 p-3 rounded-lg border border-white/10 focus:border-[#00b7ff] focus:ring-0 outline-none"
        placeholder="Kommentar hinzufügen…"
      />

      <button
        onClick={() => {
          if (text.trim().length === 0) return;
          onSubmit(text);
          setText("");
        }}
        className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00b7ff] to-[#006bff] text-white font-semibold shadow-[0_0_12px_rgba(0,0,0,0.4)]"
      >
        Speichern
      </button>
    </div>
  );
};
