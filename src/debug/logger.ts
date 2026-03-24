export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  source?: 'frontend' | 'backend';
}

let subscribers: Array<(entry: DebugLogEntry) => void> = [];

export function subscribeDebugLogs(fn: (entry: DebugLogEntry) => void) {
  subscribers.push(fn);
  return () => {
    subscribers = subscribers.filter((s) => s !== fn);
  };
}

function emit(entry: DebugLogEntry) {
  for (const s of subscribers) {
    try {
      s(entry);
    } catch (err) {
      console.error('[DebugLogger] subscriber error', err);
    }
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return (
    'dbg-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).substring(2, 10)
  );
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): DebugLogEntry {
  return {
    id: createId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    source: 'frontend',
  };
}

function logToConsole(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
) {
  const prefix = `[${level.toUpperCase()}]`;
  switch (level) {
    case 'debug':
      console.debug(prefix, message, context ?? '');
      break;
    case 'info':
      console.info(prefix, message, context ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, context ?? '');
      break;
    case 'error':
      console.error(prefix, message, context ?? '');
      break;
    default:
      console.log(prefix, message, context ?? '');
  }
}

export const DebugLogger = {
  debug(message: string, context?: Record<string, unknown>) {
    const entry = createEntry('debug', message, context);
    logToConsole('debug', message, context);
    emit(entry);
  },
  info(message: string, context?: Record<string, unknown>) {
    const entry = createEntry('info', message, context);
    logToConsole('info', message, context);
    emit(entry);
  },
  warn(message: string, context?: Record<string, unknown>) {
    const entry = createEntry('warn', message, context);
    logToConsole('warn', message, context);
    emit(entry);
  },
  error(message: string, context?: Record<string, unknown>) {
    const entry = createEntry('error', message, context);
    logToConsole('error', message, context);
    emit(entry);
  },
};
