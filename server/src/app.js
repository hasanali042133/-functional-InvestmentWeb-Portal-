import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env, isProduction } from './config/env.js';
import routes from './routes/index.js';
import { openApiSpec } from './docs/openapi.js';
import { AppError } from './utils/AppError.js';
import { globalLimiter } from './middlewares/rateLimit.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Behind Render/Vercel proxies, trust the forwarded IP so rate limiting keys on
// the real client rather than the load balancer.
app.set('trust proxy', 1);

/**
 * Interactive API docs.
 *
 * Mounted before the global `helmet()` with its own relaxed policy: Swagger UI
 * is the only HTML this service serves and it needs inline styles, which the
 * default Content-Security-Policy blocks. Scoping the exception here keeps the
 * strict policy on every JSON endpoint.
 */
app.use(
  '/api-docs',
  helmet({ contentSecurityPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'Investment Portal API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
    },
  }),
);

app.use(helmet());

// Only the deployed frontend and the local dev server may call the API.
const allowedOrigins = new Set([env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']);

/**
 * The API's own origin is always allowed, so the Swagger UI at /api-docs can
 * call the endpoints it documents. It is derived from the request rather than
 * hardcoded, so this keeps working on the deployed URL too.
 *
 * A rejected origin is answered with a 403 through the normal error envelope —
 * throwing a bare Error here would surface as a misleading 500.
 */
app.use(
  cors((req, callback) => {
    const { origin } = req.headers;
    const selfOrigin = `${req.protocol}://${req.get('host')}`;

    // No Origin header: same-origin navigation, curl, platform health checks.
    if (!origin || origin === selfOrigin || allowedOrigins.has(origin)) {
      return callback(null, { origin: true, credentials: true });
    }

    return callback(
      AppError.forbidden(`Origin ${origin} is not allowed by CORS.`, 'CORS_NOT_ALLOWED'),
    );
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(globalLimiter);

/**
 * Root index. Opening the API URL in a browser should explain what the service
 * is and where to go, rather than returning a bare 404.
 */
app.get('/', (req, res) =>
  res.json({
    service: 'Investment / Account Opening Portal API',
    status: 'ok',
    docs: '/api-docs',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        verifyOtp: 'POST /api/auth/verify-otp',
        resendOtp: 'POST /api/auth/resend-otp',
        login: 'POST /api/auth/login',
        currentUser: 'GET /api/auth/me',
      },
      products: {
        list: 'GET /api/products',
        detail: 'GET /api/products/:id',
      },
    },
  }),
);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() }),
);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
