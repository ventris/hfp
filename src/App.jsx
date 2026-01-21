import { useEffect, useRef, useState } from "react";
import "./App.css";
import { isBot } from "./utils";
import BotScoreBar from "./BotScoreBar";
import botMeme from "./assets/botMeme.png";
import noBotMeme from "./assets/notBotMeme.jpg";

const initialDimensions = () => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export default function App() {
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [userAgent, setUserAgent] = useState(() =>
    typeof navigator === "undefined" ? "Unavailable" : navigator.userAgent,
  );
  const hasReported = useRef(false);
  const { score, botProbability } = isBot();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  useEffect(() => {
    if (hasReported.current) {
      return;
    }

    if (!dimensions.width || !dimensions.height) {
      return;
    }

    if (import.meta.env.DEV) {
      hasReported.current = true;
      return;
    }

    hasReported.current = true;

    fetch("/api/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        width: dimensions.width,
        height: dimensions.height,
        userAgent,
        score,
        botProbability,
      }),
    }).catch((error) => {
      if (import.meta.env.DEV) {
        console.warn("Failed to report visit", error);
      }
    });
  }, [dimensions.width, dimensions.height, userAgent]);

  return (
    <div className="fingerprint-container">
      <div style={{ marginTop: 8 }}>
        <BotScoreBar />
        <img
          src={botProbability >= 50 ? botMeme : noBotMeme}
          alt="Logo"
          style={{ width: 200, height: 200, padding: 20, paddingTop: 0 }}
        />
      </div>
    </div>
  );
}
