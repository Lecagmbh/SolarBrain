/**
 * ADMIN MODULE EXPORTS v3.0
 */

// Layout
export { AdminLayout, useLayout } from "./components/layout/AdminLayout";

// UI Components
export {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Textarea,
  Select,
  Avatar,
  Progress,
  Skeleton,
  EmptyState,
  Modal,
  Tabs,
  TabPanel,
  ToastProvider,
  useToast,
  Dropdown,
  Table,
  Checkbox,
  Switch,
  Divider,
  StatCard,
  Tooltip,
} from "./components/ui/UIComponents";

export { CommandPalette, useCommandPalette } from "./components/ui/CommandPalette";
export { NotificationCenter, NotificationBell, useNotifications } from "./features/notifications/NotificationCenter";
export { AIAssistantLocal, useAIAssistantLocal } from "./features/ai/AIAssistantLocal";

// Features - both named and default exports
export { default as Dashboard } from "./features/dashboard/Dashboard";
export { default as Analytics } from "./features/analytics/Analytics";
export { default as WorkflowAutomation } from "./features/automation/WorkflowAutomation";

// Router
export { router, createAdminRouter, adminRoutes } from "./router";

// Re-export default
export { default } from "./features/dashboard/Dashboard";
