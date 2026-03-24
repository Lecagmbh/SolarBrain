import { motion } from 'framer-motion';
import { RefreshCw, Plus, Sparkles } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface DashboardHeaderProps {
  userName?: string;
  openCount: number;
  isAdmin: boolean;
  onRefresh?: () => void;
  onNewAnmeldung?: () => void;
  isRefreshing?: boolean;
}

/**
 * DashboardHeader - Begrüßung mit animiertem Counter und Aktionen
 */
export function DashboardHeader({
  userName,
  openCount,
  isAdmin,
  onRefresh,
  onNewAnmeldung,
  isRefreshing = false,
}: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const firstName = userName?.split(' ')[0] || 'User';

  return (
    <motion.header
      className="dashboard-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div>
        <h1 className="dashboard-header__greeting">
          {getGreeting()}, <span>{firstName}</span>!
        </h1>
        <p className="dashboard-header__subtitle">
          <AnimatedCounter value={openCount} duration={1.2} /> offene Anmeldungen
          {!isAdmin && ' in Bearbeitung'}
        </p>
      </div>

      <div className="dashboard-header__actions">
        {onRefresh && (
          <motion.button
            className="quick-action"
            onClick={onRefresh}
            disabled={isRefreshing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">Aktualisieren</span>
          </motion.button>
        )}

        {onNewAnmeldung && (
          <motion.button
            className="quick-action quick-action--primary"
            onClick={onNewAnmeldung}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isAdmin ? (
              <>
                <Plus size={18} />
                <span>Neue Anmeldung</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Anlage anmelden</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}

export default DashboardHeader;
