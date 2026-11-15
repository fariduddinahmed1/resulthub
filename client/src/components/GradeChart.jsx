const GradeChart = ({ distribution }) => {
  const entries = Object.entries(distribution || {});
  const max = Math.max(...entries.map(([, count]) => count), 1);

  if (entries.every(([, count]) => count === 0)) {
    return <p>No results recorded yet.</p>;
  }

  return (
    <div className="grade-chart">
      {entries.map(([grade, count]) => (
        <div className="grade-bar-row" key={grade}>
          <span className="grade-label">{grade}</span>
          <div className="grade-bar-track">
            <div
              className="grade-bar-fill"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="grade-count">{count}</span>
        </div>
      ))}
    </div>
  );
};

export default GradeChart;
