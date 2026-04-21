'use strict';

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'transparencia-agil-api'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEW_RELIC_LOGGING_LEVEL || 'info',
  },
  distributed_tracing: {
    enabled: process.env.NEW_RELIC_DISTRIBUTED_TRACING_ENABLED === 'true' || true,
  },
  allow_all_headers: true,
  attributes: {
    enabled: true,
    include: ['request.parameters.*'],
  },
};