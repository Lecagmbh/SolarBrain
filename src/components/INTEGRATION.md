/**
 * INTEGRATION BEISPIEL
 * So fügst du das Speed Widget ins Dashboard ein
 */

// 1. Import hinzufügen (oben in LECADashboard.tsx)
import SpeedPerformanceWidget from './SpeedPerformanceWidget';
import './SpeedPerformanceWidget.css';

// 2. State hinzufügen (in der Component)
const [speedData, setSpeedData] = useState<any>(null);

// 3. In der load() Function laden
const loadSpeedData = async () => {
  try {
    const data = await apiGet("/dashboard/speed-stats");
    setSpeedData(data);
  } catch (e) {
    console.error("Speed stats error:", e);
  }
};

// In load() aufrufen:
// const [s, k, speed] = await Promise.all([
//   apiGet("/dashboard/summary"),
//   apiGet("/dashboard/kpis").catch(() => null),
//   apiGet("/dashboard/speed-stats").catch(() => null),
// ]);
// setSpeedData(speed);

// 4. Widget rendern (nach der Pipeline, vor insights-grid)
{speedData && (
  <section className="speed-section">
    <SpeedPerformanceWidget
      data={{
        avgDays: speedData.avgDays,
        fastestDays: speedData.fastestDays,
        fastestId: speedData.fastestId,
        fastestName: speedData.fastestName,
        trend: speedData.trend,
        thisWeek: speedData.thisWeek,
        thisMonth: speedData.thisMonth,
        record: speedData.record,
      }}
      leaderboard={speedData.leaderboard || []}
      onViewAll={() => navigate("/archiv")}
    />
  </section>
)}

// 5. CSS für Section (in dashboard.css hinzufügen)
/*
.speed-section {
  margin: 24px 0;
}
*/
