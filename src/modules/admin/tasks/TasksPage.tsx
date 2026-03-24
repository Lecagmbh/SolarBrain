import { useState } from "react";

export function TasksPage() {
  const [intervals, setIntervals] = useState({
    emailPoll: 10,
    automation: 5,
    cleanup: 60,
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>Aufgaben & Worker</h1>

      <label>E-Mail Polling (Sek.)</label>
      <input
        type="number"
        value={intervals.emailPoll}
        onChange={(e) =>
          setIntervals({
            ...intervals,
            emailPoll: Number(e.target.value),
          })
        }
      />

      <label>Automation Interval (Sek.)</label>
      <input
        type="number"
        value={intervals.automation}
        onChange={(e) =>
          setIntervals({
            ...intervals,
            automation: Number(e.target.value),
          })
        }
      />

      <label>Cleanup Interval (Min.)</label>
      <input
        type="number"
        value={intervals.cleanup}
        onChange={(e) =>
          setIntervals({
            ...intervals,
            cleanup: Number(e.target.value),
          })
        }
      />
    </div>
  );
}
