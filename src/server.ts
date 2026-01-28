import { EventEmitter } from 'events';
import { Server } from 'paracord';
import { attachLogProxies, CacheUtils, LogCollector } from 'statbot-utils';

import type { EnvironmentType } from 'statbot-utils';

const { ENV } = process.env as Record<string, EnvironmentType>;
const {
  SERVER_HOST, SERVER_PORT,
  GLOBAL_MAX, GLOBAL_PADDING,
  REMOTE_CACHE_HOST, REMOTE_CACHE_PORT,
  LOGGING_HOST, LOGGING_METRICS_PORT, LOGGING_TEXT_PORT,
} = process.env as Record<string, string>;

for (const [key, value] of Object.entries({
  SERVER_HOST,
  SERVER_PORT,
  GLOBAL_MAX,
  GLOBAL_PADDING,
  REMOTE_CACHE_HOST,
  REMOTE_CACHE_PORT,
  LOGGING_HOST,
  LOGGING_METRICS_PORT,
  LOGGING_TEXT_PORT,
})) {
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Missing environment variable ${key}`);
  }
}

async function main() {
  const logger = new LogCollector({
    env: ENV,
    source: 'discord_proxy',
    prometheusHost: { host: LOGGING_HOST, port: LOGGING_METRICS_PORT },
    lokiHost: ENV === 'development' ? undefined : { host: LOGGING_HOST, port: LOGGING_TEXT_PORT },
    enabled: ENV !== 'development',
  });

  attachLogProxies({ textLogCollector: logger.textLogCollector });

  const emitter = new EventEmitter();

  const cache = new CacheUtils({
    remote: {
      host: REMOTE_CACHE_HOST,
      port: Number(REMOTE_CACHE_PORT),
    },
  }, 'discord_proxy');

  const token = await cache.getBotToken();

  const server = new Server({
    host: SERVER_HOST,
    port: SERVER_PORT,
    emitter,
    globalRateLimitMax: Number(GLOBAL_MAX),
    globalRateLimitResetPadding: Number(GLOBAL_PADDING),
  });
  emitter.on('DEBUG', ({ message }) => {
    console.debug(message);
  });

  server.addRequestService(token, { requestOptions: { maxRateLimitRetry: 3 } });
  server.apiClient?.on('REQUEST_SENT', ({ message }) => {
    console.debug(JSON.stringify({ message }, null, 2));
  });
  server.apiClient?.on('RESPONSE_RECEIVED', ({ message }) => {
    console.debug(JSON.stringify({ message }, null, 2));
  });

  server.serve();
}

void main();
