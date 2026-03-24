import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Mail,
  Send,
  FileText,
  Clock,
  MessageSquare,
  Upload,
  Calendar,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { AnimatedCounter } from '../AnimatedCounter';

export type ActionType =
  | 'nb-mails'
  | 'submit'
  | 'ibn'
  | 'followup'
  | 'queries'
  | 'documents'
  | 'termine';

export interface ActionItem {
  type: ActionType;
  count: number;
  label: string;
  urgent?: boolean;
  onClick?: () => void;
}

interface ActionRequiredProps {
  items: ActionItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;  // Reserved for future collapse toggle
}

const ACTION_CONFIG: Record<
  ActionType,
  { icon: LucideIcon; variant: 'danger' | 'warning' | 'primary' | 'success' }
> = {
  'nb-mails': { icon: Mail, variant: 'danger' },
  submit: { icon: Send, variant: 'primary' },
  ibn: { icon: FileText, variant: 'primary' },
  followup: { icon: Clock, variant: 'warning' },
  queries: { icon: MessageSquare, variant: 'danger' },
  documents: { icon: Upload, variant: 'warning' },
  termine: { icon: Calendar, variant: 'primary' },
};

/**
 * ActionRequired - Pulsierende Aktions-Box für dringende Aufgaben
 */
export function ActionRequired({
  items,
  isCollapsed = false,
  onToggle: _onToggle,
}: ActionRequiredProps) {
  // onToggle reserved for future collapse functionality
  void _onToggle;
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const hasUrgent = items.some((item) => item.urgent && item.count > 0);
  const visibleItems = items.filter((item) => item.count > 0);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <motion.section
      className={`glass-card action-required ${
        hasUrgent ? 'action-required--urgent pulse-danger' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Header */}
      <div className="action-required__header">
        <div className="action-required__icon">
          <AlertCircle />
        </div>
        <div>
          <h2 className="action-required__title">Aktion erforderlich</h2>
          <p className="action-required__count">
            <AnimatedCounter value={totalCount} duration={1} /> Aufgaben warten auf Sie
          </p>
        </div>
      </div>

      {/* Action Items Grid */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="action-required__items"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {visibleItems.map((item, index) => (
              <ActionItemCard
                key={item.type}
                item={item}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  index: number;
}

function ActionItemCard({ item, index }: ActionItemCardProps) {
  const config = ACTION_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      className={`action-item ${item.urgent ? 'action-item--urgent' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={item.onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className={`action-item__icon action-item__icon--${config.variant}`}>
        <Icon size={18} />
      </div>

      <div className="action-item__content">
        <span className="action-item__label">{item.label}</span>
      </div>

      <span className="action-item__count">
        <AnimatedCounter value={item.count} duration={0.8} delay={index * 0.1} />
      </span>

      <ChevronRight size={16} className="action-item__arrow" />
    </motion.div>
  );
}

export default ActionRequired;
