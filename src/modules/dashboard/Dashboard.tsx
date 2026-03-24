import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { NewAnmeldungModal } from '../../features/nb-portal';
import {
  DashboardHeader,
  ActionRequired,
  AnimatedPipeline,
  AdminTaskList,
  CustomerAnlagen,
  QuickActions,
  UpcomingTermine,
  ActivityFeedCard,
  WeekCalendar,
  KundenDashboard,
} from './components';
import { useDashboardData } from './hooks/useDashboardData';
import type {
  TaskItem,
  CustomerAnlage,
} from './types';
import './dashboard.css';

/**
 * Dashboard - Haupt-Container mit rollenbasierter Sichtbarkeit
 *
 * Admin/Mitarbeiter sehen:
 * - Alle Pipeline-Stages
 * - NB-Mails, Einreichen, IBN, Nachfassen
 * - Handlungsbedarf-Liste
 * - NB Performance
 *
 * Kunden sehen:
 * - Vereinfachte Pipeline (eigene Anlagen)
 * - Rückfragen, Dokumente, Termine
 * - Eigene Anlagen-Liste
 * - Nächste Termine
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Modal state for new Anmeldung
  const [showNewAnmeldungModal, setShowNewAnmeldungModal] = useState(false);

  // Role checks
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MITARBEITER';
  const isKunde = user?.role === 'KUNDE' || user?.role === 'DEMO';
  const isHV = user?.role === 'HANDELSVERTRETER';
  const isSub = user?.role === 'SUBUNTERNEHMER';

  // Redirect Handelsvertreter to HV-Center
  useEffect(() => {
    if (isHV) {
      navigate('/hv-center', { replace: true });
    }
  }, [isHV, navigate]);

  // API data
  const apiData = useDashboardData({
    isAdmin,
    kundeId: user?.kundeId,
    autoRefresh: true,
  });

  const {
    pipelineStages,
    tasks,
    anlagen,
    termine,
    activities,
    actionItems,
    openCount,
    loading: isRefreshing,
  } = apiData;

  // Handlers
  const handleRefresh = useCallback(async () => {
    await apiData.refresh();
  }, [apiData]);

  const handleNewAnmeldung = useCallback(() => {
    setShowNewAnmeldungModal(true);
  }, []);

  const handleStageClick = useCallback((stageKey: string) => {
    navigate(`/netzanmeldungen?stage=${stageKey}`);
  }, [navigate]);

  const handleTaskClick = useCallback((task: TaskItem) => {
    navigate(`/netzanmeldungen/${task.publicId || task.id}`);
  }, [navigate]);

  const handleAnlageClick = useCallback((anlage: CustomerAnlage) => {
    navigate(`/netzanmeldungen/${anlage.publicId || anlage.id}`);
  }, [navigate]);

  // KUNDE: Dediziertes KundenDashboard
  if (isKunde) {
    return (
      <>
        <KundenDashboard
          userName={user?.name || user?.email}
          pipelineStages={pipelineStages}
          anlagen={anlagen}
          activities={activities}
          termine={termine}
          actionItems={actionItems}
          onNewAnmeldung={handleNewAnmeldung}
          onStageClick={handleStageClick}
          onAnlageClick={handleAnlageClick}
          isRefreshing={isRefreshing}
        />
        <NewAnmeldungModal
          isOpen={showNewAnmeldungModal}
          onClose={() => setShowNewAnmeldungModal(false)}
        />
      </>
    );
  }

  return (
    <div className="dashboard-container">
      <motion.div
        className="dashboard-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {/* Header */}
        <DashboardHeader
          userName={user?.name || user?.email}
          openCount={openCount}
          isAdmin={isAdmin}
          onRefresh={handleRefresh}
          onNewAnmeldung={handleNewAnmeldung}
          isRefreshing={isRefreshing}
        />

        {/* Action Required - Not for SUBUNTERNEHMER (their actions are job-specific) */}
        {!isSub && <ActionRequired items={actionItems.map(item => ({
          ...item,
          onClick: () => {
            const categoryMap: Record<string, string> = {
              'nb-mails': 'rueckfrage',
              'queries': 'rueckfrage',
              'submit': 'einreichung',
              'ibn': 'ibn',
              'followup': 'nachfassen',
              'documents': 'dokumente',
            };
            const cat = categoryMap[item.type];
            navigate(cat ? `/aufgaben?category=${cat}` : '/aufgaben');
          },
        }))} />}

        {/* Animated Pipeline */}
        <AnimatedPipeline
          stages={pipelineStages}
          onStageClick={handleStageClick}
          simplified={false}
        />

        {/* Two-column layout for details */}
        <div className="dashboard-row">
          {/* Left: Task List */}
          <motion.section
            className="glass-card glass-card--no-hover"
            style={{ padding: '24px' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AdminTaskList
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />
          </motion.section>

          {/* Right: Activity Feed */}
          <motion.section
            className="glass-card glass-card--no-hover"
            style={{ padding: '24px' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ActivityFeedCard
              activities={activities}
              onActivityClick={(a) => navigate(`/netzanmeldungen/${a.publicId}`)}
              onViewAll={() => navigate('/netzanmeldungen')}
              maxItems={8}
            />
          </motion.section>
        </div>

        {/* Week Calendar */}
        <WeekCalendar
          termine={termine}
          onTerminClick={(t) => navigate(`/netzanmeldungen/${t.anmeldungId}`)}
          onDayClick={(date) => navigate(`/termine?date=${date.toISOString().split('T')[0]}`)}
        />

        {/* Quick Actions */}
        <motion.section
          className="glass-card glass-card--no-hover"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <QuickActions
            isAdmin={isAdmin}
            onNewAnmeldung={handleNewAnmeldung}
            onImport={() => navigate('/import')}
            onEmails={() => navigate('/emails')}
            onDocuments={() => navigate('/dokumente')}
            onAnalytics={() => navigate('/analytics')}
          />
        </motion.section>
      </motion.div>

      {/* New Anmeldung Modal */}
      <NewAnmeldungModal
        isOpen={showNewAnmeldungModal}
        onClose={() => setShowNewAnmeldungModal(false)}
      />
    </div>
  );
}

export default Dashboard;
