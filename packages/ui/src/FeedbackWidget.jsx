import { useState } from 'react';
import { useTheme } from './ThemeContext';
import Icons from './Icons';
import { submitTicket } from '@tsc/supabase';

/**
 * AI-gestütztes Feedback & Bug-Report Widget
 * Führt Benutzer durch den Prozess der Fehlermeldung
 */

const FEEDBACK_STEPS = [
  {
    id: 'type',
    question: 'Was möchtest du uns mitteilen?',
    options: [
      { value: 'bug', label: 'Fehler melden', icon: 'warning', description: 'Etwas funktioniert nicht wie erwartet' },
      { value: 'feature', label: 'Verbesserung vorschlagen', icon: 'plus', description: 'Eine neue Funktion oder Verbesserung' },
      { value: 'question', label: 'Frage stellen', icon: 'info', description: 'Ich habe eine Frage zur Nutzung' },
    ],
  },
  {
    id: 'context',
    question: 'Wo ist das Problem aufgetreten?',
    dependsOn: { type: 'bug' },
  },
  {
    id: 'description',
    question: 'Beschreibe das Problem genauer:',
    placeholder: 'Was hast du erwartet? Was ist stattdessen passiert?',
  },
  {
    id: 'contact',
    question: 'Möchtest du eine Rückmeldung erhalten?',
    optional: true,
  },
];

export function FeedbackWidget({ appName = 'TSC-Jugendportal', onSubmit }) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    type: '',
    context: '',
    description: '',
    email: '',
    wantsResponse: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);

  const currentStep = FEEDBACK_STEPS[step];

  const handleTypeSelect = (type) => {
    setData(prev => ({ ...prev, type }));
    // Skip context step for non-bug reports
    setStep(type === 'bug' ? 1 : 2);
  };

  const handleNext = () => {
    if (step < FEEDBACK_STEPS.length - 1) {
      // Skip context step if not a bug report
      if (step === 0 && data.type !== 'bug') {
        setStep(2);
      } else {
        setStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      // Handle skipping context step
      if (step === 2 && data.type !== 'bug') {
        setStep(0);
      } else {
        setStep(prev => prev - 1);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const feedbackData = {
      ...data,
      appName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      if (onSubmit) {
        await onSubmit(feedbackData);
      } else {
        // Use integrated ticket service (ClickUp + GitHub + AI)
        const result = await submitTicket(feedbackData);
        setTicketResult(result);
        console.log('Ticket created:', result);
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStep(0);
      setData({ type: '', context: '', description: '', email: '', wantsResponse: false });
      setIsSubmitted(false);
    }, 300);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning': return Icons.warning;
      case 'plus': return Icons.plus;
      case 'info': return Icons.info;
      default: return Icons.info;
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${isDark
          ? 'bg-gradient-to-br from-gold-400 to-gold-500 text-navy-900'
          : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
          }`}
        title="Feedback geben"
      >
        <span className="w-5 h-5">{Icons.messageCircle || Icons.info}</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 ${isDark ? 'bg-navy-900/80' : 'bg-black/50'} backdrop-blur-sm`} />

          {/* Modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp ${isDark
              ? 'bg-navy-800 border border-gold-400/20'
              : 'bg-white border border-light-border'
              }`}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-navy-700' : 'border-light-border'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-100 text-teal-600'
                  }`}>
                  {Icons.messageCircle || Icons.info}
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    Feedback & Support
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    {appName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'hover:bg-navy-700 text-cream/50' : 'hover:bg-light-border text-light-muted'
                  }`}
              >
                {Icons.x}
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {isSubmitted ? (
                /* Success State */
                <div className="text-center py-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-success/20 text-success' : 'bg-green-100 text-green-500'
                    }`}>
                    {Icons.check}
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    Vielen Dank!
                  </h4>
                  <p className={`text-sm mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                    Dein Feedback wurde erfolgreich gesendet.
                    {data.wantsResponse && ' Wir melden uns bei dir.'}
                  </p>

                  {/* AI Analysis Result */}
                  {ticketResult && (
                    <div className={`mb-4 p-3 rounded-lg text-left text-sm ${isDark ? 'bg-navy-700' : 'bg-light-border/50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Ticket:</span>
                        <span className={`font-mono ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>{ticketResult.ticketId}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Kategorie:</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-100 text-teal-700'}`}>
                          {ticketResult.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={isDark ? 'text-cream/60' : 'text-light-muted'}>Priorität:</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${ticketResult.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            ticketResult.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              ticketResult.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                          }`}>
                          {ticketResult.priority}
                        </span>
                      </div>

                      {/* Links */}
                      {(ticketResult.githubUrl || ticketResult.clickupUrl) && (
                        <div className="mt-3 pt-3 border-t border-dashed flex gap-2 flex-wrap"
                          style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                          {ticketResult.githubUrl && (
                            <a href={ticketResult.githubUrl} target="_blank" rel="noopener noreferrer"
                              className={`text-xs underline ${isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'}`}>
                              GitHub #{ticketResult.githubIssueNumber}
                            </a>
                          )}
                          {ticketResult.clickupUrl && (
                            <a href={ticketResult.clickupUrl} target="_blank" rel="noopener noreferrer"
                              className={`text-xs underline ${isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'}`}>
                              ClickUp Task
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className={`px-6 py-2 rounded-xl font-medium transition-colors ${isDark
                      ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                      }`}
                  >
                    Schließen
                  </button>
                </div>
              ) : (
                <>
                  {/* AI Assistant Message */}
                  <div className={`flex gap-3 mb-6`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-100 text-teal-600'
                      }`}>
                      <span className="text-sm">AI</span>
                    </div>
                    <div className={`flex-1 p-3 rounded-xl rounded-tl-sm ${isDark ? 'bg-navy-700' : 'bg-light-border/50'
                      }`}>
                      <p className={`text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {currentStep.question}
                      </p>
                    </div>
                  </div>

                  {/* Step Content */}
                  {step === 0 && (
                    /* Type Selection */
                    <div className="space-y-3">
                      {FEEDBACK_STEPS[0].options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleTypeSelect(option.value)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${data.type === option.value
                            ? isDark
                              ? 'border-gold-400 bg-gold-400/10'
                              : 'border-teal-500 bg-teal-500/10'
                            : isDark
                              ? 'border-navy-700 hover:border-gold-400/50'
                              : 'border-light-border hover:border-teal-500/50'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.type === option.value
                            ? isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-teal-100 text-teal-600'
                            : isDark ? 'bg-navy-700 text-cream/60' : 'bg-light-border text-light-muted'
                            }`}>
                            {getTypeIcon(option.icon)}
                          </div>
                          <div>
                            <div className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                              {option.label}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                              {option.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 1 && data.type === 'bug' && (
                    /* Context for Bug */
                    <div>
                      <input
                        type="text"
                        value={data.context}
                        onChange={(e) => setData(prev => ({ ...prev, context: e.target.value }))}
                        placeholder="z.B. Beim Erstellen einer neuen Meldung"
                        className={`w-full px-4 py-3 rounded-xl border ${isDark
                          ? 'bg-navy-700 border-navy-600 text-cream placeholder:text-cream/30'
                          : 'bg-white border-light-border text-light-text'
                          }`}
                      />
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={handleBack}
                          className={`px-4 py-2 rounded-lg ${isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
                            }`}
                        >
                          Zurück
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={!data.context.trim()}
                          className={`px-6 py-2 rounded-xl font-medium transition-colors ${data.context.trim()
                            ? isDark
                              ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                              : 'bg-teal-500 text-white hover:bg-teal-600'
                            : isDark
                              ? 'bg-navy-700 text-cream/30 cursor-not-allowed'
                              : 'bg-light-border text-light-muted cursor-not-allowed'
                            }`}
                        >
                          Weiter
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    /* Description */
                    <div>
                      <textarea
                        value={data.description}
                        onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={
                          data.type === 'bug'
                            ? 'Was hast du erwartet? Was ist stattdessen passiert?'
                            : data.type === 'feature'
                              ? 'Beschreibe deine Idee...'
                              : 'Stelle deine Frage...'
                        }
                        rows={4}
                        className={`w-full px-4 py-3 rounded-xl border resize-none ${isDark
                          ? 'bg-navy-700 border-navy-600 text-cream placeholder:text-cream/30'
                          : 'bg-white border-light-border text-light-text'
                          }`}
                      />
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={handleBack}
                          className={`px-4 py-2 rounded-lg ${isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
                            }`}
                        >
                          Zurück
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={!data.description.trim()}
                          className={`px-6 py-2 rounded-xl font-medium transition-colors ${data.description.trim()
                            ? isDark
                              ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                              : 'bg-teal-500 text-white hover:bg-teal-600'
                            : isDark
                              ? 'bg-navy-700 text-cream/30 cursor-not-allowed'
                              : 'bg-light-border text-light-muted cursor-not-allowed'
                            }`}
                        >
                          Weiter
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    /* Contact */
                    <div>
                      <div className="mb-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={data.wantsResponse}
                            onChange={(e) => setData(prev => ({ ...prev, wantsResponse: e.target.checked }))}
                            className="w-5 h-5 rounded"
                          />
                          <span className={isDark ? 'text-cream' : 'text-light-text'}>
                            Ja, ich möchte eine Rückmeldung
                          </span>
                        </label>
                      </div>

                      {data.wantsResponse && (
                        <input
                          type="email"
                          value={data.email}
                          onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="deine@email.de"
                          className={`w-full px-4 py-3 rounded-xl border mb-4 ${isDark
                            ? 'bg-navy-700 border-navy-600 text-cream placeholder:text-cream/30'
                            : 'bg-white border-light-border text-light-text'
                            }`}
                        />
                      )}

                      <div className="flex justify-between">
                        <button
                          onClick={handleBack}
                          className={`px-4 py-2 rounded-lg ${isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
                            }`}
                        >
                          Zurück
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting || (data.wantsResponse && !data.email.trim())}
                          className={`px-6 py-2 rounded-xl font-medium transition-colors ${!isSubmitting && (!data.wantsResponse || data.email.trim())
                            ? isDark
                              ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                              : 'bg-teal-500 text-white hover:bg-teal-600'
                            : isDark
                              ? 'bg-navy-700 text-cream/30 cursor-not-allowed'
                              : 'bg-light-border text-light-muted cursor-not-allowed'
                            }`}
                        >
                          {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Progress Indicator */}
            {!isSubmitted && (
              <div className={`px-6 pb-4 flex gap-1`}>
                {[0, 1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${s <= step
                      ? isDark ? 'bg-gold-400' : 'bg-teal-500'
                      : isDark ? 'bg-navy-700' : 'bg-light-border'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </>
  );
}

export default FeedbackWidget;
