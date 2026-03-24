/**
 * EMAIL FILTER BAR
 * Suchfeld mit Enter-to-Search
 */

import { Search } from "lucide-react";
import { s } from "./styles";

interface EmailFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export function EmailFilterBar({ search, onSearchChange, onSearch }: EmailFilterBarProps) {
  return (
    <div style={s.filterRow}>
      <div style={s.searchBox}>
        <Search size={14} style={{ color: "#71717a" }} />
        <input
          style={s.searchInput}
          placeholder="Suchen in Betreff, Absender..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
    </div>
  );
}
