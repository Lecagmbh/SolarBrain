/**
 * GuideDrawer Component
 * Slide-Over von rechts mit Status-spezifischen Anleitungen.
 */
import { useState } from "react";
import { X, HelpCircle, CheckCircle2, XCircle, ChevronDown, ListOrdered, CircleHelp } from "lucide-react";
import { STATUS_GUIDES, type StatusGuide } from "../data/guideData";
import "./guide-drawer.css";

interface GuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
}

export function GuideDrawer({ isOpen, onClose, status }: GuideDrawerProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const guide: StatusGuide | undefined = STATUS_GUIDES[status];

  if (!guide) {
    return (
      <>
        <div className="guide-drawer__backdrop" onClick={onClose} />
        <div className="guide-drawer">
          <div className="guide-drawer__header">
            <span className="guide-drawer__header-title">
              <HelpCircle size={18} className="guide-drawer__header-icon" />
              Hilfe & Anleitung
            </span>
            <button className="guide-drawer__close" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="guide-drawer__body">
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              Für den aktuellen Status ist keine Anleitung verfügbar.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="guide-drawer__backdrop" onClick={onClose} />
      <div className="guide-drawer">
        <div className="guide-drawer__header">
          <span className="guide-drawer__header-title">
            <HelpCircle size={18} className="guide-drawer__header-icon" />
            Hilfe & Anleitung
          </span>
          <button className="guide-drawer__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="guide-drawer__body">
          {/* Intro */}
          <div className="guide-drawer__intro">
            <div className="guide-drawer__intro-title">{guide.title}</div>
            <div className="guide-drawer__intro-text">{guide.intro}</div>
          </div>

          {/* Steps */}
          {guide.steps.length > 0 && (
            <div className="guide-drawer__section">
              <div className="guide-drawer__section-title">
                <ListOrdered size={15} />
                Was muss ich tun?
              </div>
              <div className="guide-drawer__steps">
                {guide.steps.map((step, i) => (
                  <div key={i} className="guide-drawer__step">
                    <div className="guide-drawer__step-number">{i + 1}</div>
                    <div className="guide-drawer__step-content">
                      <div className="guide-drawer__step-title">{step.title}</div>
                      <div className="guide-drawer__step-desc">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Do List */}
          {guide.doList.length > 0 && (
            <div className="guide-drawer__section">
              <div className="guide-drawer__section-title">
                <CheckCircle2 size={15} style={{ color: "#4ade80" }} />
                Das können Sie tun
              </div>
              <div className="guide-drawer__list">
                {guide.doList.map((item, i) => (
                  <div key={i} className="guide-drawer__list-item guide-drawer__list-item--do">
                    <CheckCircle2 size={14} className="guide-drawer__list-icon--do" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Don't List */}
          {guide.dontList.length > 0 && (
            <div className="guide-drawer__section">
              <div className="guide-drawer__section-title">
                <XCircle size={15} style={{ color: "#f87171" }} />
                Das müssen Sie NICHT tun
              </div>
              <div className="guide-drawer__list">
                {guide.dontList.map((item, i) => (
                  <div key={i} className="guide-drawer__list-item guide-drawer__list-item--dont">
                    <XCircle size={14} className="guide-drawer__list-icon--dont" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {guide.faq.length > 0 && (
            <div className="guide-drawer__section">
              <div className="guide-drawer__section-title">
                <CircleHelp size={15} />
                Häufige Fragen
              </div>
              <div className="guide-drawer__faq-list">
                {guide.faq.map((faq, i) => (
                  <div key={i} className="guide-drawer__faq-item">
                    <button
                      className="guide-drawer__faq-question"
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    >
                      {faq.question}
                      <ChevronDown
                        size={14}
                        className={`guide-drawer__faq-chevron ${expandedFaq === i ? "guide-drawer__faq-chevron--open" : ""}`}
                      />
                    </button>
                    {expandedFaq === i && (
                      <div className="guide-drawer__faq-answer">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * InlineHelp Component — Ausklappbare Hilfe-Box für Pages
 */
interface InlineHelpProps {
  title: string;
  steps: string[];
  categories?: { key: string; label: string; explanation: string }[];
  defaultOpen?: boolean;
}

export function InlineHelp({ title, steps, categories, defaultOpen = false }: InlineHelpProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="inline-help">
      <button className="inline-help__trigger" onClick={() => setIsOpen(!isOpen)}>
        <HelpCircle size={16} />
        {title}
        <ChevronDown
          size={14}
          className={`inline-help__chevron ${isOpen ? "inline-help__chevron--open" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="inline-help__content">
          <div className="inline-help__steps">
            {steps.map((step, i) => (
              <div key={i} className="inline-help__step">
                <div className="inline-help__step-num">{i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
          {categories && categories.length > 0 && (
            <div className="inline-help__categories">
              {categories.map((cat) => (
                <div key={cat.key} className="inline-help__category">
                  <strong>{cat.label}:</strong> {cat.explanation}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
