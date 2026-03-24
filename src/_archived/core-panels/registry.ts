/**
 * Panel Registry – Maps entity types to their PanelConfig
 */

import type { PanelConfig } from './types';
import { installationConfig } from './configs/installationConfig';
import { nbResponseConfig } from './configs/nbResponseConfig';
import { factroConfig } from './configs/factroConfig';
import { invoiceConfig } from './configs/invoiceConfig';
import { emailConfig } from './configs/emailConfig';

const registry = new Map<string, PanelConfig>();

// Register built-in configs
registry.set('installation', installationConfig);
registry.set('nb-response', nbResponseConfig);
registry.set('factro-project', factroConfig);
registry.set('invoice', invoiceConfig);
registry.set('email', emailConfig);

/**
 * Get the panel config for an entity type
 */
export function getPanelConfig(entityType: string): PanelConfig | undefined {
  return registry.get(entityType);
}

/**
 * Register a custom panel config (for feature-specific panels)
 */
export function registerPanelConfig(entityType: string, config: PanelConfig) {
  registry.set(entityType, config);
}

/**
 * Check if a panel config exists for an entity type
 */
export function hasPanelConfig(entityType: string): boolean {
  return registry.has(entityType);
}
