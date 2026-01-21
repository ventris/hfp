import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4173;

app.use(express.json());

// const getClientIp = (req) => {
//   const forwardedFor = req.get("x-forwarded-for");
//   const remoteAddress = req.socket?.remoteAddress;
//   return forwardedFor?.split(",")[0]?.trim() || remoteAddress || "unknown";
// };

const logVisit = ({ note = "n/a", score = "n/a", botProbability = "n/a" }) => {
  // const requestUserAgent = req.get("user-agent") ?? "unknown";
  // const ip = getClientIp(req);

  console.log(
    `[visit]
    note=${note}
    score=${score}
    botProbability=${botProbability}`,
  );
};

app.use((req, _res, next) => {
  const isLikelyBrowserNavigation =
    req.get("sec-fetch-mode") === "navigate" ||
    req.get("sec-fetch-dest") === "document";

  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !path.extname(req.path) &&
    !isLikelyBrowserNavigation
  ) {
    // Avoid double-logging: browsers will send metrics via /api/visit after navigation.
    logVisit({
      req,
      note: "initial-request-no-client-metrics",
    });
  }

  next();
});

app.post("/api/visit", (req, res) => {
  const {
    width,
    height,
    userAgent: reportedUserAgent,
    botProbability,
    score,
  } = req.body ?? {};

  logVisit({
    req,
    width: width ?? "n/a",
    height: height ?? "n/a",
    reportedUserAgent: reportedUserAgent ?? "n/a",
    note: "client-metrics",
    score,
    botProbability,
  });

  res.sendStatus(204);
});

const distDir = path.resolve(__dirname, "dist");
app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
