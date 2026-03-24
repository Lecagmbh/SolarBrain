// ============================================
// FINANZEN MODULE - STYLES
// ============================================

export const styles = `
/* ═══════════════════════════════════════════════════════════════════════════════ */
/* FINANZEN PAGE - ENDLEVEL PREMIUM STYLES                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────────────────────────
   BASE & LAYOUT
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-page {
  min-height: 100vh;
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

/* Background Effects */
.fin-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.fin-bg__gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(212, 168, 67, 0.08) 0%, transparent 50%);
}

.fin-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.fin-bg__orb--1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent);
}

.fin-bg__orb--2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  background: radial-gradient(circle, rgba(212, 168, 67, 0.2), transparent);
}

.fin-bg__grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* ───────────────────────────────────────────────────────────────────────────────
   HEADER
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.fin-header__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.fin-header__icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #EAD068 0%, #D4A843 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
}

.fin-header__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fin-badge {
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #EAD068, #D4A843);
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fin-header__subtitle {
  font-size: 0.875rem;
  color: var(--text-tertiary, #94a3b8);
  margin: 0.25rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fin-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-shortcut:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary, #fff);
}

.fin-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ───────────────────────────────────────────────────────────────────────────────
   BUTTONS
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.fin-btn--ghost {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-secondary, #cbd5e1);
}

.fin-btn--ghost:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary, #fff);
}

.fin-btn--primary {
  background: linear-gradient(135deg, #EAD068 0%, #D4A843 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.fin-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.fin-btn--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.fin-btn--sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.fin-btn__sparkle {
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.fin-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ───────────────────────────────────────────────────────────────────────────────
   KPI CARDS
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-kpis {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 1200px) {
  .fin-kpis { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .fin-kpis { grid-template-columns: 1fr; }
}

.fin-kpi {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.fin-kpi--clickable {
  cursor: pointer;
}

.fin-kpi--clickable:hover,
.fin-kpi:hover {
  transform: translateY(-4px);
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.fin-kpi--featured {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(212, 168, 67, 0.05) 100%);
  border-color: rgba(139, 92, 246, 0.2);
}

.fin-kpi--alert {
  animation: pulse-alert 2s ease-in-out infinite;
}

@keyframes pulse-alert {
  0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
  50% { border-color: rgba(239, 68, 68, 0.6); }
}

.fin-kpi__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.fin-kpi__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fin-kpi__icon--purple { background: rgba(139, 92, 246, 0.15); color: #EAD068; }
.fin-kpi__icon--orange { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.fin-kpi__icon--green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.fin-kpi__icon--red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.fin-kpi__badge {
  padding: 0.25rem 0.5rem;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.fin-kpi__badge--urgent {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.fin-pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.fin-kpi__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
  line-height: 1.2;
}

.fin-kpi__value--orange { color: #f59e0b; }
.fin-kpi__value--green { color: #10b981; }
.fin-kpi__value--red { color: #ef4444; }

.fin-kpi__label {
  font-size: 0.875rem;
  color: var(--text-tertiary, #94a3b8);
  margin-top: 0.25rem;
}

.fin-kpi__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 0.8125rem;
  color: var(--text-tertiary, #94a3b8);
}

.fin-kpi__shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.fin-kpi__alert-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ef4444, #f87171);
}

/* Trend Indicator */
.fin-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.fin-trend--up {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.fin-trend--down {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Progress Ring */
.fin-progress-ring {
  position: relative;
}

.fin-progress-ring__value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ───────────────────────────────────────────────────────────────────────────────
   FILTERS
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-filters {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.fin-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  min-width: 280px;
  transition: all 0.2s;
}

.fin-search:focus-within {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.fin-search__icon {
  color: var(--text-tertiary, #94a3b8);
}

.fin-search__input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  color: var(--text-primary, #fff);
  outline: none;
}

.fin-search__input::placeholder {
  color: var(--text-tertiary, #94a3b8);
}

.fin-search__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-search__clear:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.fin-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.fin-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: var(--text-secondary, #cbd5e1);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-chip:hover {
  background: rgba(255,255,255,0.06);
}

.fin-chip--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: #EAD068;
}

.fin-chip__count {
  padding: 0.125rem 0.375rem;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.fin-filter-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.fin-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: var(--text-secondary, #cbd5e1);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-toggle--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: #EAD068;
}

.fin-view-switch {
  display: flex;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  overflow: hidden;
}

.fin-view-switch button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-view-switch button:hover {
  color: var(--text-secondary, #cbd5e1);
}

.fin-view-switch button.active {
  background: rgba(139, 92, 246, 0.15);
  color: #EAD068;
}

/* Bulk Actions Bar */
.fin-bulk-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 14px;
  margin-top: 1rem;
}

.fin-bulk-bar__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.fin-bulk-bar__count {
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.fin-bulk-bar__link {
  background: transparent;
  border: none;
  color: var(--text-secondary, #cbd5e1);
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
}

.fin-bulk-bar__actions {
  display: flex;
  gap: 0.75rem;
}

/* ───────────────────────────────────────────────────────────────────────────────
   MAIN CONTENT
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-main {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 1.5rem;
}

.fin-main--split .fin-content {
  flex: 1;
}

.fin-content {
  flex: 1;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  overflow: hidden;
}

.fin-content__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.fin-content__header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fin-content__count {
  padding: 0.25rem 0.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ───────────────────────────────────────────────────────────────────────────────
   TABLE
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-table-wrap {
  overflow-x: auto;
}

.fin-table {
  width: 100%;
  border-collapse: collapse;
}

.fin-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary, #94a3b8);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.fin-table__th--sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.fin-table__th--sortable:hover {
  color: var(--text-secondary, #cbd5e1);
}

.fin-table__th--right {
  text-align: right;
}

.fin-table__th--checkbox {
  width: 48px;
}

.fin-table__th--actions {
  width: 120px;
}

.fin-table__sort-icon {
  display: inline-block;
  margin-left: 0.25rem;
  vertical-align: middle;
  transition: transform 0.2s;
}

.fin-table__sort-icon--asc {
  transform: rotate(180deg);
}

.fin-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  font-size: 0.875rem;
  color: var(--text-secondary, #cbd5e1);
}

.fin-table__row {
  cursor: pointer;
  transition: background 0.2s;
  animation: row-fade-in 0.3s ease-out backwards;
  animation-delay: var(--row-delay, 0s);
}

@keyframes row-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fin-table__row:hover {
  background: rgba(255,255,255,0.03);
}

.fin-table__row--active {
  background: rgba(139, 92, 246, 0.1);
}

.fin-table__row--selected {
  background: rgba(139, 92, 246, 0.15);
}

.fin-table__row--overdue {
  background: rgba(239, 68, 68, 0.05);
}

.fin-invoice-number {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.fin-customer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fin-customer__name {
  color: var(--text-primary, #fff);
}

.fin-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.fin-status--sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
}

.fin-status--lg {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.fin-amount {
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.fin-table__td--amount {
  text-align: right;
}

.fin-actions {
  display: flex;
  gap: 0.5rem;
}

.fin-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 8px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-action-btn:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary, #fff);
}

.fin-action-btn--success:hover {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

/* Checkbox */
.fin-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.fin-checkbox input {
  display: none;
}

.fin-checkbox__box {
  width: 20px;
  height: 20px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s;
}

.fin-checkbox input:checked + .fin-checkbox__box {
  background: #EAD068;
  border-color: #EAD068;
  color: white;
}

/* Avatar */
.fin-avatar {
  border-radius: 10px;
  object-fit: cover;
}

.fin-avatar--initials {
  background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
}

/* ───────────────────────────────────────────────────────────────────────────────
   GRID VIEW
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.fin-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: card-fade-in 0.3s ease-out backwards;
  animation-delay: var(--card-delay, 0s);
}

@keyframes card-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fin-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.fin-card--active {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.05);
}

.fin-card--overdue {
  border-color: rgba(239, 68, 68, 0.3);
}

.fin-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.fin-card__number {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.fin-card__customer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: var(--text-secondary, #cbd5e1);
}

.fin-card__customer-name {
  font-size: 0.875rem;
}

.fin-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.fin-card__date {
  font-size: 0.8125rem;
  color: var(--text-tertiary, #94a3b8);
}

.fin-card__amount {
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.fin-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.fin-card:hover .fin-card__glow {
  opacity: 1;
}

/* ───────────────────────────────────────────────────────────────────────────────
   DETAIL PANEL
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-detail {
  width: 400px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  overflow: hidden;
  flex-shrink: 0;
  animation: detail-slide-in 0.3s ease-out;
}

@keyframes detail-slide-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.fin-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.fin-detail__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin: 0;
}

.fin-detail__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 8px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-detail__close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.fin-detail__content {
  padding: 1.5rem;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.fin-detail__status {
  margin-bottom: 1.5rem;
}

.fin-detail__section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.fin-detail__section:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.fin-detail__section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary, #94a3b8);
  margin: 0 0 1rem;
}

.fin-detail__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.fin-detail__row--highlight {
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px dashed rgba(255,255,255,0.1);
}

.fin-detail__label {
  font-size: 0.875rem;
  color: var(--text-tertiary, #94a3b8);
}

.fin-detail__value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.fin-detail__row--highlight .fin-detail__value {
  font-size: 1.125rem;
}

.fin-detail__positions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fin-detail__position {
  padding: 0.75rem;
  background: rgba(255,255,255,0.02);
  border-radius: 10px;
}

.fin-detail__position-desc {
  font-size: 0.875rem;
  color: var(--text-primary, #fff);
  margin-bottom: 0.5rem;
}

.fin-detail__position-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--text-tertiary, #94a3b8);
}

.fin-detail__position-total {
  font-weight: 600;
  color: var(--text-secondary, #cbd5e1);
}

.fin-detail__notes {
  font-size: 0.875rem;
  color: var(--text-secondary, #cbd5e1);
  line-height: 1.6;
  margin: 0;
}

.fin-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.fin-detail__loading,
.fin-detail__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-tertiary, #94a3b8);
}

/* ───────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.fin-empty__icon {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #94a3b8);
  margin-bottom: 1.5rem;
}

.fin-empty__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin: 0 0 0.5rem;
}

.fin-empty__description {
  color: var(--text-tertiary, #94a3b8);
  margin: 0 0 1.5rem;
}

.fin-empty__action {
  margin-top: 1rem;
}

/* ───────────────────────────────────────────────────────────────────────────────
   SKELETON
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-skeleton {
  background: linear-gradient(90deg, 
    rgba(255,255,255,0.03) 25%, 
    rgba(255,255,255,0.06) 50%, 
    rgba(255,255,255,0.03) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.fin-skeleton-list {
  padding: 1.5rem;
}

.fin-skeleton-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

.fin-skeleton-text__line {
  margin-bottom: 0.5rem;
}

.fin-skeleton-card {
  padding: 1rem;
}

.fin-skeleton-card__content {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ───────────────────────────────────────────────────────────────────────────────
   PAGINATION
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.fin-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: var(--text-secondary, #cbd5e1);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-pagination__btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary, #fff);
}

.fin-pagination__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.fin-pagination__info {
  font-size: 0.875rem;
  color: var(--text-tertiary, #94a3b8);
}

/* ───────────────────────────────────────────────────────────────────────────────
   MODAL
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fin-modal {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.fin-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.fin-modal__header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin: 0;
}

.fin-modal__header button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 10px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-modal__header button:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.fin-modal__body {
  flex: 1;
  overflow: hidden;
}

.fin-pdf-frame {
  width: 100%;
  height: 65vh;
  border: none;
  background: white;
}

.fin-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

/* ───────────────────────────────────────────────────────────────────────────────
   COMMAND PALETTE
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-cmd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 9999;
  animation: fade-in 0.2s ease-out;
}

.fin-cmd {
  width: 100%;
  max-width: 560px;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  overflow: hidden;
  animation: modal-in 0.3s ease-out;
}

.fin-cmd__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.fin-cmd__icon {
  color: var(--text-tertiary, #94a3b8);
}

.fin-cmd__input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1rem;
  color: var(--text-primary, #fff);
  outline: none;
}

.fin-cmd__input::placeholder {
  color: var(--text-tertiary, #94a3b8);
}

.fin-kbd {
  padding: 0.25rem 0.5rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  font-family: 'SF Mono', monospace;
  font-size: 0.6875rem;
  color: var(--text-tertiary, #94a3b8);
}

.fin-cmd__body {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.75rem;
}

.fin-cmd__group {
  margin-bottom: 1rem;
}

.fin-cmd__category {
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary, #94a3b8);
}

.fin-cmd__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  color: var(--text-primary, #fff);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.fin-cmd__item:hover,
.fin-cmd__item--selected {
  background: rgba(139, 92, 246, 0.15);
}

.fin-cmd__item-icon {
  color: var(--text-tertiary, #94a3b8);
}

.fin-cmd__item-label {
  flex: 1;
}

.fin-cmd__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--text-tertiary, #94a3b8);
  gap: 0.75rem;
}

.fin-cmd__empty-hint {
  font-size: 0.8125rem;
}

.fin-cmd__footer {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 0.75rem;
  color: var(--text-tertiary, #94a3b8);
}

.fin-cmd__footer span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ───────────────────────────────────────────────────────────────────────────────
   TOAST
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fin-toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  font-size: 0.875rem;
  color: var(--text-primary, #fff);
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  cursor: pointer;
  animation: toast-in 0.4s ease-out;
  position: relative;
  overflow: hidden;
  max-width: 400px;
}

@keyframes toast-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.fin-toast--success { border-color: rgba(16, 185, 129, 0.3); }
.fin-toast--success .fin-toast__icon { color: #10b981; }

.fin-toast--error { border-color: rgba(239, 68, 68, 0.3); }
.fin-toast--error .fin-toast__icon { color: #ef4444; }

.fin-toast--warning { border-color: rgba(245, 158, 11, 0.3); }
.fin-toast--warning .fin-toast__icon { color: #f59e0b; }

.fin-toast--info { border-color: rgba(59, 130, 246, 0.3); }
.fin-toast--info .fin-toast__icon { color: #3b82f6; }

.fin-toast__message {
  flex: 1;
}

.fin-toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-toast__close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.fin-toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* ───────────────────────────────────────────────────────────────────────────────
   SPINNER
   ─────────────────────────────────────────────────────────────────────────────── */

.fin-spinner {
  border: 3px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ───────────────────────────────────────────────────────────────────────────────
   RESPONSIVE
   ─────────────────────────────────────────────────────────────────────────────── */

@media (max-width: 1200px) {
  .fin-main { flex-direction: column; }
  .fin-detail { width: 100%; }
}

@media (max-width: 768px) {
  .fin-page { padding: 1rem; }
  
  .fin-header { 
    flex-direction: column; 
    gap: 1rem; 
    text-align: center; 
  }
  
  .fin-header__left { 
    flex-direction: column; 
  }
  
  .fin-filters { 
    flex-direction: column; 
    align-items: stretch; 
  }
  
  .fin-filter-actions { 
    justify-content: center; 
    margin-left: 0; 
  }
  
  .fin-search { 
    min-width: auto; 
  }
  
  .fin-chips {
    justify-content: center;
  }
}
`;
