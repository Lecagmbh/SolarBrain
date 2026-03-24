/**
 * EmailTabView — Extracted from PremiumOverviewTab email tab mode
 * Shows full email detail with AI analysis and reply functionality
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Lightbulb, Sparkles, Loader2, Send, Paperclip, FileText, Check
} from 'lucide-react';
import { sanitizeHtml } from '../../../../utils/sanitizeHtml';

interface ApiEmail {
  id: number;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  aiType?: string;
  aiSummary?: string;
  aiRequiredAction?: string;
  aiDeadline?: string;
  aiConfidence?: number;
  aiAnalysis?: {
    type?: string;
    summary?: string;
    requiredAction?: string;
    deadline?: string;
    confidence?: number;
    extractedData?: {
      aktenzeichen?: string;
      termin?: string;
      ansprechpartner?: string;
    };
  };
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface EmailTabViewProps {
  data: {
    id: number;
    nbCaseNumber?: string;
    publicId?: string;
  };
  selectedEmailId: number;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onTabChange?: (tab: string) => void;
  onOpenUploadModal?: () => void;
}

async function fetchEmailDetail(emailId: number): Promise<ApiEmail | null> {
  if (!emailId) return null;
  try {
    const res = await fetch(`/api/emails/${emailId}`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchTemplates(): Promise<EmailTemplate[]> {
  try {
    const res = await fetch('/api/email-templates', { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.templates)) return data.templates;
    return [];
  } catch {
    return [];
  }
}

async function fetchNbAnfrageTemplate(installationId: number): Promise<{ betreff: string; htmlBody: string; nbEmail: string; nbName: string } | null> {
  try {
    const res = await fetch(`/api/crm/nb-anfrage/render/${installationId}`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function EmailTabView({ data, selectedEmailId, showToast, onTabChange, onOpenUploadModal }: EmailTabViewProps) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingAktenzeichen, setIsSavingAktenzeichen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [nbAnfrage, setNbAnfrage] = useState<{ betreff: string; htmlBody: string; nbEmail: string; nbName: string } | null>(null);
  const [isLoadingNb, setIsLoadingNb] = useState(false);
  const [isSendingNb, setIsSendingNb] = useState(false);

  const { data: selectedEmail } = useQuery({
    queryKey: ['email-detail', selectedEmailId],
    queryFn: () => fetchEmailDetail(selectedEmailId),
    enabled: !!selectedEmailId,
    staleTime: 60000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchTemplates,
    staleTime: 300000,
  });

  const handleTemplateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = parseInt(e.target.value);
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setReplyText(template.body);
        setSelectedTemplateId(templateId);
      }
    }
  }, [templates]);

  const handleSendEmail = useCallback(async () => {
    if (!replyText.trim() || !selectedEmail) {
      showToast('Bitte Text eingeben', 'error');
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch(`/api/installation/${data.id}/reply-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          replyToEmailId: selectedEmail.id,
          subject: `Re: ${selectedEmail.subject}`,
          body: replyText,
        }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      showToast('Email gesendet', 'success');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['emails', data.id] });
    } catch {
      showToast('Fehler beim Senden', 'error');
    } finally {
      setIsSending(false);
    }
  }, [replyText, selectedEmail, data.id, showToast, queryClient]);

  const handleGenerateAIReply = useCallback(async () => {
    if (!selectedEmail) return;
    if (!aiPrompt.trim()) {
      showToast('Bitte Anweisung eingeben', 'error');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const emailId = typeof selectedEmail.id === 'string' ? parseInt(selectedEmail.id as unknown as string, 10) : selectedEmail.id;
      const res = await fetch('/api/claude-code/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailId, instruction: aiPrompt.trim() }),
      });
      if (!res.ok) throw new Error('Failed to generate reply');
      const result = await res.json();
      setReplyText(result.data?.response || result.response || result.reply || '');
      showToast('KI-Antwort generiert', 'success');
    } catch {
      showToast('KI-Generierung fehlgeschlagen', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [selectedEmail, showToast, aiPrompt]);

  const handleSaveAktenzeichen = useCallback(async (aktenzeichen: string) => {
    if (!aktenzeichen || isSavingAktenzeichen) return;
    setIsSavingAktenzeichen(true);
    try {
      const res = await fetch(`/api/installations/${data.id}/nb-case`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nbCaseNumber: aktenzeichen }),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast(`Vorgangsnummer "${aktenzeichen}" übernommen`, 'success');
      queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['netzanmeldungen'] });
    } catch {
      showToast('Fehler beim Speichern der Vorgangsnummer', 'error');
    } finally {
      setIsSavingAktenzeichen(false);
    }
  }, [data.id, showToast, queryClient, isSavingAktenzeichen]);

  if (!selectedEmail) {
    return (
      <div className="premium-overview email-tab-mode">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="premium-overview email-tab-mode">
      <div className="email-tab-container">
        {/* Email Header */}
        <div className="email-tab-header">
          <div className="email-tab-meta">
            <div className="email-tab-row">
              <span className="email-tab-label">VON:</span>
              <span className="email-tab-value">{selectedEmail.fromAddress}</span>
            </div>
            <div className="email-tab-row">
              <span className="email-tab-label">DATUM:</span>
              <span className="email-tab-value">{formatDateTime(selectedEmail.receivedAt)}</span>
            </div>
            <div className="email-tab-row">
              <span className="email-tab-label">BETREFF:</span>
              <span className="email-tab-value email-tab-subject">{selectedEmail.subject}</span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="email-tab-body">
          {selectedEmail.bodyHtml ? (
            <div
              className="email-tab-html-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.bodyHtml) }}
            />
          ) : (
            (selectedEmail.bodyText || '').split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))
          )}
        </div>

        {/* KI-Analyse Box */}
        {(selectedEmail.aiType || selectedEmail.aiSummary || selectedEmail.aiAnalysis) && (
          <div className="email-tab-ai">
            <div className="email-tab-ai-header">
              <Lightbulb size={16} />
              <span>KI-Analyse</span>
            </div>
            <div className="email-tab-ai-content">
              {(selectedEmail.aiAnalysis?.type || selectedEmail.aiType) && (
                <div className="email-tab-ai-row">
                  <span className="email-tab-ai-label">Typ:</span>
                  <span className="email-tab-ai-value highlight">{selectedEmail.aiAnalysis?.type || selectedEmail.aiType}</span>
                </div>
              )}
              {(selectedEmail.aiAnalysis?.requiredAction || selectedEmail.aiRequiredAction) && (
                <div className="email-tab-ai-row">
                  <span className="email-tab-ai-label">Benötigt:</span>
                  <span className="email-tab-ai-value">{selectedEmail.aiAnalysis?.requiredAction || selectedEmail.aiRequiredAction}</span>
                </div>
              )}
              {(selectedEmail.aiAnalysis?.deadline || selectedEmail.aiDeadline) && (
                <div className="email-tab-ai-row">
                  <span className="email-tab-ai-label">Frist:</span>
                  <span className="email-tab-ai-value">{new Date(selectedEmail.aiAnalysis?.deadline || selectedEmail.aiDeadline || '').toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {selectedEmail.aiAnalysis?.extractedData?.aktenzeichen && (
                <div className="email-tab-ai-row">
                  <span className="email-tab-ai-label">Vorgangsnummer:</span>
                  <span className="email-tab-ai-value mono">{selectedEmail.aiAnalysis.extractedData.aktenzeichen}</span>
                </div>
              )}
            </div>

            {selectedEmail.aiAnalysis?.extractedData?.aktenzeichen && !data.nbCaseNumber && (
              <div className="email-tab-ai-action">
                <button
                  className="btn btn-primary"
                  onClick={() => handleSaveAktenzeichen(selectedEmail.aiAnalysis!.extractedData!.aktenzeichen!)}
                  disabled={isSavingAktenzeichen}
                >
                  {isSavingAktenzeichen ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Vorgangsnummer übernehmen: {selectedEmail.aiAnalysis.extractedData.aktenzeichen}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reply Section */}
        <div className="email-tab-reply">
          <div className="email-tab-reply-header">
            <span className="email-tab-reply-title">Antworten</span>
            <div className="email-tab-reply-tools" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                style={{ padding: '4px 10px', fontSize: 11, background: '#1565c0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}
                disabled={isLoadingNb || isSendingNb}
                onClick={async () => {
                  setIsLoadingNb(true);
                  const result = await fetchNbAnfrageTemplate(data.id);
                  setIsLoadingNb(false);
                  if (result) {
                    setNbAnfrage(result);
                    setReplyText(result.htmlBody);
                  } else {
                    showToast('Keine NB-Anfrage-Vorlage verfügbar (CRM-Verknüpfung fehlt)', 'error');
                  }
                }}
              >
                {isLoadingNb ? '...' : 'NB-Anfrage laden'}
              </button>
              {nbAnfrage && (
                <button
                  style={{ padding: '4px 10px', fontSize: 11, background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}
                  disabled={isSendingNb}
                  onClick={async () => {
                    if (!nbAnfrage.nbEmail) {
                      showToast('Keine NB-Email gefunden', 'error');
                      return;
                    }
                    if (!confirm(`Email an ${nbAnfrage.nbName} (${nbAnfrage.nbEmail}) senden?\n\nBetreff: ${nbAnfrage.betreff}`)) return;
                    setIsSendingNb(true);
                    try {
                      const res = await fetch(`/api/vde-center/html-send/${data.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          to: nbAnfrage.nbEmail,
                          subject: nbAnfrage.betreff,
                          message: nbAnfrage.htmlBody,
                          norm: '4110',
                          forms: ['E1', 'E8'],
                        }),
                      });
                      if (res.ok) {
                        showToast(`NB-Anfrage an ${nbAnfrage.nbEmail} gesendet`, 'success');
                        setNbAnfrage(null);
                        setReplyText('');
                      } else {
                        showToast('Senden fehlgeschlagen', 'error');
                      }
                    } catch {
                      showToast('Senden fehlgeschlagen', 'error');
                    } finally {
                      setIsSendingNb(false);
                    }
                  }}
                >
                  {isSendingNb ? 'Sende...' : `An ${nbAnfrage.nbName || 'NB'} senden`}
                </button>
              )}
              <select className="template-select" onChange={handleTemplateChange} value={selectedTemplateId || ''}>
                <option value="">Vorlage wählen...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="email-tab-ai-prompt">
            <div className="ai-prompt-label">
              <Sparkles size={14} />
              Was soll in der Antwort stehen?
            </div>
            <div className="ai-prompt-row">
              <input
                type="text"
                className="ai-prompt-input"
                placeholder="z.B. Lageplan wird morgen nachgereicht"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAIReply()}
              />
              <button
                className="btn btn-secondary"
                onClick={handleGenerateAIReply}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generieren
              </button>
            </div>
          </div>

          <textarea
            className="email-tab-reply-textarea"
            placeholder="Ihre Antwort..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={8}
          />

          <div className="email-tab-reply-actions">
            <div className="email-tab-reply-attachments">
              <button className="btn btn-ghost" onClick={() => onOpenUploadModal?.()}>
                <Paperclip size={14} />
                Anhang
              </button>
              <button className="btn btn-ghost" onClick={() => onTabChange?.('dokumente')}>
                <FileText size={14} />
                Dokument
              </button>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSendEmail}
              disabled={isSending || !replyText.trim()}
            >
              {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Senden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
