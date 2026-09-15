import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env, isProduction } from './config/env.js';
import routes from './routes/index.js';
import { openApiSpec } from './docs/openapi.js';
import { AppError } from './utils/AppError.js';
import { usingLocalDisk } from './storage/index.js';
import { UPLOAD_ROOT, PUBLIC_PATH } from './storage/local.storage.js';
import { globalLimiter } from './middlewares/rateLimit.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Behind Render/Vercel proxies, trust the forwarded IP so rate limiting keys on
// the real client rather than the load balancer.
app.set('trust proxy', 1);

// Mounted before the global helmet() with its own relaxed policy: Swagger UI is
// the only HTML this service serves and needs inline styles, which the default
// CSP blocks. Scoping it here keeps the strict policy on every JSON endpoint.
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

// Only the deployed frontend may call the API.
const allowedOrigins = new Set([env.CLIENT_URL]);

// In development any localhost port is accepted: the Vite dev server moves to
// another port whenever its usual one is taken, and a CORS failure is an
// unhelpful way to discover that. Production stays restricted to CLIENT_URL.
const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const isLocalDevOrigin = (origin) => !isProduction && LOCALHOST_ORIGIN.test(origin);

// The API's own origin is always allowed so Swagger UI can call the endpoints it
// documents, derived from the request so it holds on the deployed URL too. A
// rejected origin gets a 403; a bare Error here would surface as a 500.
app.use(
  cors((req, callback) => {
    const { origin } = req.headers;
    const selfOrigin = `${req.protocol}://${req.get('host')}`;

    // No Origin header: same-origin navigation, curl, platform health checks.
    if (!origin || origin === selfOrigin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)) {
      return callback(null, { origin: true, credentials: true });
    }

    return callback(
      AppError.forbidden(`Origin ${origin} is not allowed by CORS.`, 'CORS_NOT_ALLOWED'),
    );
  }),
);

// Only mounted when Cloudinary is absent, i.e. development. The frontend runs on
// a different port, so helmet's same-origin resource policy has to be relaxed
// here or the browser refuses to render the uploaded images.
if (usingLocalDisk) {
  app.use(
    PUBLIC_PATH,
    helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }),
    express.static(UPLOAD_ROOT, { fallthrough: true, index: false, dotfiles: 'deny' }),
  );
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(globalLimiter);

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
      account: {
        application: 'GET|PUT /api/account/application',
        status: 'GET /api/account/status',
        documents: 'POST /api/account/documents · DELETE /api/account/documents/:id',
        submit: 'POST /api/account/submit',
      },
      products: {
        list: 'GET /api/products',
        detail: 'GET /api/products/:id',
      },
      investing: {
        invest: 'POST /api/investments',
        investments: 'GET /api/investments',
        transactions: 'GET /api/transactions',
        portfolio: 'GET /api/portfolio/summary · GET /api/portfolio/performance',
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
