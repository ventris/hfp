import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4173;

app.use(express.json());

const getClientIp = (req) => {
  const forwardedFor = req.get('x-forwarded-for');
  const remoteAddress = req.socket?.remoteAddress;
  return forwardedFor?.split(',')[0]?.trim() || remoteAddress || 'unknown';
};

function mouseEntropy(events, options = {}) {
  if (!Array.isArray(events) || events.length < 2) {
    return { distanceEntropy: 0, timeEntropy: 0 };
  }

  const {
    distanceBinSize = 5,  // pixels per bin
    timeBinSize = 20      // ms per bin
  } = options;

  const distances = [];
  const times = [];

  // Compute deltas
  for (let i = 1; i < events.length; i++) {
    const dx = events[i].x - events[i - 1].x;
    const dy = events[i].y - events[i - 1].y;
    const dt = events[i].timestamp - events[i - 1].timestamp;

    distances.push(Math.sqrt(dx * dx + dy * dy));
    times.push(dt);
  }

  // Helper: compute Shannon entropy of binned values
  function entropy(values, binSize) {
    if (values.length === 0) return 0;

    const bins = new Map();

    for (const v of values) {
      const bin = Math.floor(v / binSize);
      bins.set(bin, (bins.get(bin) || 0) + 1);
    }

    const total = values.length;
    let H = 0;

    for (const count of bins.values()) {
      const p = count / total;
      H -= p * Math.log2(p);
    }

    return H;
  }

  return {
    distanceEntropy: entropy(distances, distanceBinSize),
    timeEntropy: entropy(times, timeBinSize)
  };
}

const logVisit = ({
  req,
  width = 'n/a',
  height = 'n/a',
  reportedUserAgent = 'n/a',
  note = 'n/a',
}) => {
  const requestUserAgent = req.get('user-agent') ?? 'unknown';
  const ip = getClientIp(req);

  console.log(
    `[visit] ip=${ip} width=${width} height=${height} reportedUA=${reportedUserAgent} requestUA=${requestUserAgent} note=${note}`,
  );
};

app.use((req, _res, next) => {
  const isLikelyBrowserNavigation =
    req.get('sec-fetch-mode') === 'navigate' ||
    req.get('sec-fetch-dest') === 'document';

  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !path.extname(req.path) &&
    !isLikelyBrowserNavigation
  ) {
    // Avoid double-logging: browsers will send metrics via /api/visit after navigation.
    logVisit({
      req,
      note: 'initial-request-no-client-metrics',
    });
  }

  next();
});

app.post('/api/visit', (req, res) => {
  const { width, height, userAgent: reportedUserAgent } = req.body ?? {};

  logVisit({
    req,
    width: width ?? 'n/a',
    height: height ?? 'n/a',
    reportedUserAgent: reportedUserAgent ?? 'n/a',
    note: 'client-metrics',
  });

  // console.log(req.body)
  console.log(mouseEntropy(req.body.mouseMoves))

  res.sendStatus(204);
});

const distDir = path.resolve(__dirname, 'dist');
app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
