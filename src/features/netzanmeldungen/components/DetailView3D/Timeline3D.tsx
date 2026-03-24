/**
 * TIMELINE 3D - Animated Status Progress
 * =======================================
 * Visual timeline with glowing progress and pulse effects
 */

import { motion } from "framer-motion";
import { Inbox, Send, CheckCircle, Zap, Flag, Receipt } from "lucide-react";
import "./Timeline3D.css";

const STEPS = [
  { key: "eingang", label: "Ein", icon: Inbox, color: "#3b82f6" },
  { key: "beim-nb", label: "NB", icon: Send, color: "#eab308" },
  { key: "genehmigt", label: "Gen", icon: CheckCircle, color: "#22c55e" },
  { key: "ibn", label: "IBN", icon: Zap, color: "#a855f7" },
  { key: "fertig", label: "Fer", icon: Flag, color: "#10b981" },
  { key: "abgerechnet", label: "€", icon: Receipt, color: "#f59e0b" },
];

interface Timeline3DProps {
  currentStep: number;
  statusColor?: string;
}

export function Timeline3D({ currentStep, statusColor = "#3b82f6" }: Timeline3DProps) {
  return (
    <div className="timeline3d">
      {/* Progress Track */}
      <div className="timeline3d__track">
        <motion.div
          className="timeline3d__progress"
          style={{ background: statusColor }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        />
        <div
          className="timeline3d__glow"
          style={{
            background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`,
            left: `${(currentStep / (STEPS.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="timeline3d__steps">
        {STEPS.map((step, index) => {
          const isComplete = index <= currentStep;
          const isCurrent = index === currentStep;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.key}
              className={`timeline3d__step ${isComplete ? "timeline3d__step--complete" : ""} ${isCurrent ? "timeline3d__step--current" : ""}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <motion.div
                className="timeline3d__dot"
                style={{
                  background: isComplete ? step.color : "rgba(255,255,255,0.1)",
                  borderColor: isComplete ? step.color : "rgba(255,255,255,0.2)",
                  boxShadow: isCurrent ? `0 0 20px ${step.color}` : "none",
                }}
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Icon
                  size={14}
                  style={{ color: isComplete ? "white" : "rgba(255,255,255,0.3)" }}
                />
              </motion.div>
              <span
                className="timeline3d__label"
                style={{ color: isComplete ? step.color : "rgba(255,255,255,0.4)" }}
              >
                {step.label}
              </span>

              {/* Pulse ring for current */}
              {isCurrent && (
                <motion.div
                  className="timeline3d__pulse"
                  style={{ borderColor: step.color }}
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Timeline3D;
