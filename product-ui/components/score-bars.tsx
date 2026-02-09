type ScoreBarsProps = {
  efficiency: number;
  speed: number;
  stability: number;
};

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="scoreRow">
      <span>{label}</span>
      <span className="track">
        <span className="fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
      <strong>{value}</strong>
    </div>
  );
}

export function ScoreBars({ efficiency, speed, stability }: ScoreBarsProps) {
  return (
    <div className="scoreBars" aria-label="Quality score breakdown">
      <Row label="Efficiency" value={efficiency} />
      <Row label="Speed" value={speed} />
      <Row label="Stability" value={stability} />
    </div>
  );
}
