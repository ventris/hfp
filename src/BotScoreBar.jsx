import { isBot } from "./utils";

export default function BotScoreBar() {
  const { score, botProbability, totalPossibleScore } = isBot();

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 500 }}>
      <h2>Bot Detection Score</h2>

      <div
        style={{
          marginBottom: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {`${score} out of ${totalPossibleScore} (${botProbability}%)`}
        <strong>{`${botProbability >= 50 ? "BOT" : "No bot"}`}</strong>
      </div>

      <div
        style={{
          width: "100%",
          height: 20,
          background: "#eee",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${botProbability}%`,
            height: "100%",
            background: botProbability >= 50 ? "#f44336" : "#4caf50",
          }}
        />
      </div>
    </div>
  );
}
