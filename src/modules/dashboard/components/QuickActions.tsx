import { motion } from 'framer-motion';
import {
  Plus,
  Upload,
  Mail,
  FolderOpen,
  BarChart3,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  onClick?: () => void;
}

interface QuickActionsProps {
  isAdmin: boolean;
  onNewAnmeldung?: () => void;
  onImport?: () => void;
  onEmails?: () => void;
  onDocuments?: () => void;
  onAnalytics?: () => void;
}

/**
 * QuickActions - Schnellzugriff-Buttons am unteren Rand
 * Admin: Mehrere Aktionen
 * Kunde: Prominenter "Neue Anmeldung" Button
 */
export function QuickActions({
  isAdmin,
  onNewAnmeldung,
  onImport,
  onEmails,
  onDocuments,
  onAnalytics,
}: QuickActionsProps) {
  const adminActions: QuickAction[] = [
    { id: 'new', label: 'Neue Anmeldung', icon: Plus, primary: true, onClick: onNewAnmeldung },
    { id: 'import', label: 'Import', icon: Upload, onClick: onImport },
    { id: 'emails', label: 'E-Mails', icon: Mail, onClick: onEmails },
    { id: 'documents', label: 'Dokumente', icon: FolderOpen, onClick: onDocuments },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, onClick: onAnalytics },
  ];

  const customerActions: QuickAction[] = [
    { id: 'new', label: 'Neue Anlage anmelden', icon: Sparkles, primary: true, onClick: onNewAnmeldung },
  ];

  const actions = isAdmin ? adminActions : customerActions;

  return (
    <motion.div
      className="quick-actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={action.onClick}
          className={`quick-action ${action.primary ? 'quick-action--primary' : ''}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <action.icon size={18} />
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

/**
 * FloatingQuickAction - Für Mobile: Floating Action Button
 */
export function FloatingQuickAction({
  onClick,
  icon: Icon = Plus,
  label = 'Neue Anmeldung',
}: {
  onClick?: () => void;
  icon?: LucideIcon;
  label?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-2 px-5 py-3
        bg-gradient-to-r from-amber-500 to-purple-500
        text-white font-medium text-sm
        rounded-full shadow-lg shadow-amber-500/30
        hover:shadow-xl hover:shadow-amber-500/40
        transition-shadow
        md:hidden
      "
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', bounce: 0.4 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon size={20} />
      <span>{label}</span>
    </motion.button>
  );
}

export default QuickActions;
