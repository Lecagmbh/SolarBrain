// Main Dashboard
export { Dashboard } from './Dashboard';
export { default } from './Dashboard';

// Components (excluding types that conflict with ./types)
export {
  AnimatedCounter,
  SimpleCounter,
  DashboardHeader,
  ActionRequired,
  AnimatedPipeline,
  FlowingParticles,
  PulsingDot,
  AdminTaskList,
  CustomerAnlagen,
  QuickActions,
  FloatingQuickAction,
  NBPerformance,
  UpcomingTermine,
  ActivityFeedCard,
} from './components';

// Hooks
export { useDashboardData } from './hooks/useDashboardData';

// Types
export * from './types';
