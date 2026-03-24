/**
 * CommentsPreviewCard – Latest comments preview
 */

import { MessageSquare } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { EmptyState } from '../../primitives/EmptyState';

interface Comment {
  id: number;
  text: string;
  authorName: string;
  createdAt: string;
}

interface CommentsPreviewCardProps {
  comments: Comment[];
  onViewAll?: () => void;
}

export function CommentsPreviewCard({ comments, onViewAll }: CommentsPreviewCardProps) {
  const preview = comments.slice(0, 3);

  return (
    <SectionCard
      title="Kommentare"
      badge={comments.length || undefined}
      action={comments.length > 3 ? { label: 'Alle anzeigen', onClick: () => onViewAll?.() } : undefined}
    >
      {preview.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="Keine Kommentare"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {preview.map((c) => (
            <div key={c.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-medium text-[var(--text-secondary)]">{c.authorName}</span>
                <span className="text-[var(--text-muted)]">
                  {new Date(c.createdAt).toLocaleDateString('de-DE', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-[var(--text-primary)] line-clamp-2">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
