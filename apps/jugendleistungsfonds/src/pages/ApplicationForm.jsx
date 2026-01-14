import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, IconBadge, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function ApplicationFormPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { categories, submitApplication, loading } = useData();

  // Form state
  const [applicantFirstName, setApplicantFirstName] = useState('');
  const [applicantLastName, setApplicantLastName] = useState('');
  const [applicantBirthDate, setApplicantBirthDate] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costItems, setCostItems] = useState([{ id: '1', description: '', amount: 0 }]);
  const [documents, setDocuments] = useState([]);

  const totalAmount = costItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const addCostItem = () => {
    setCostItems(prev => [...prev, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  const removeCostItem = (id) => {
    if (costItems.length > 1) {
      setCostItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateCostItem = (id, field, value) => {
    setCostItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : item
      )
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    }));
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const removeDocument = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      addToast('Bitte wähle eine Kategorie aus', 'error');
      return;
    }

    if (costItems.some(item => !item.description.trim() || item.amount <= 0)) {
      addToast('Bitte fülle alle Kostenpositionen vollständig aus', 'error');
      return;
    }

    try {
      await submitApplication({
        applicant_first_name: applicantFirstName.trim(),
        applicant_last_name: applicantLastName.trim(),
        applicant_birth_date: applicantBirthDate,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || undefined,
        category,
        title: title.trim(),
        description: description.trim(),
        cost_items: costItems.map(item => ({
          description: item.description.trim(),
          amount: item.amount,
        })),
        documents: documents.map(doc => ({
          name: doc.name,
          type: doc.type,
          size: doc.size,
          url: '#', // In production: upload to storage and get URL
        })),
      });

      addToast('Antrag erfolgreich eingereicht!', 'success');
      navigate('/antraege');
    } catch (err) {
      console.error('Error submitting application:', err);
      addToast('Fehler beim Einreichen des Antrags', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Förderantrag stellen
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Beantrage finanzielle Unterstützung für Ausrüstung, Training oder Veranstaltungen
        </p>
      </div>

      {/* Info Box */}
      <GlassCard>
        <div className="flex items-start gap-4">
          <IconBadge icon={Icons.info} color="purple" size="lg" />
          <div>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Was wird gefördert?
            </h3>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              <li>• Segelausrüstung und -bekleidung</li>
              <li>• Trainerstunden und Kurse</li>
              <li>• Regatta-Teilnahmen (Startgelder, Reisekosten)</li>
              <li>• Trainingslager-Teilnahmen</li>
            </ul>
            <p className={`text-xs mt-2 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Bitte füge Belege (Rechnungen, Quittungen) als Dokumente bei.
            </p>
          </div>
        </div>
      </GlassCard>

      <form onSubmit={handleSubmit}>
        <GlassCard className="space-y-6">
          {/* Applicant Info */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Antragsteller:in
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Vorname *
                </label>
                <input
                  type="text"
                  value={applicantFirstName}
                  onChange={(e) => setApplicantFirstName(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Nachname *
                </label>
                <input
                  type="text"
                  value={applicantLastName}
                  onChange={(e) => setApplicantLastName(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Geburtsdatum *
              </label>
              <input
                type="date"
                value={applicantBirthDate}
                onChange={(e) => setApplicantBirthDate(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Förderkategorie *
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    category === cat.id
                      ? isDark
                        ? 'bg-purple-500/20 border-purple-500 text-cream'
                        : 'bg-purple-50 border-purple-500 text-light-text'
                      : isDark
                        ? 'bg-navy-800 border-navy-700 text-cream/80 hover:border-navy-600'
                        : 'bg-white border-light-border text-light-text hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{cat.label}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    {cat.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Application Details */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Antragsdetails
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Titel / Kurzbezeichnung *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="z.B. Neues Segel für Optimist"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Begründung *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Beschreibe, wofür die Förderung benötigt wird..."
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Cost Items */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Kostenpositionen
              </h3>
              <Button type="button" variant="secondary" size="sm" onClick={addCostItem} icon={Icons.plus}>
                Position hinzufügen
              </Button>
            </div>

            <div className="space-y-3">
              {costItems.map((item, index) => (
                <div key={item.id} className={`flex gap-3 items-start p-3 rounded-xl ${
                  isDark ? 'bg-navy-800/50' : 'bg-light-border/30'
                }`}>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateCostItem(item.id, 'description', e.target.value)}
                      placeholder="Beschreibung"
                      required
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark
                          ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                          : 'bg-white border-light-border text-light-text'
                      }`}
                    />
                  </div>
                  <div className="w-28">
                    <div className="relative">
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={(e) => updateCostItem(item.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        className={`w-full px-3 py-2 pr-8 rounded-lg border text-sm text-right ${
                          isDark
                            ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                            : 'bg-white border-light-border text-light-text'
                        }`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                        isDark ? 'text-cream/50' : 'text-light-muted'
                      }`}>€</span>
                    </div>
                  </div>
                  {costItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCostItem(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'text-cream/40 hover:text-coral hover:bg-coral/10'
                          : 'text-light-muted hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {Icons.trash}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-4 p-4 rounded-xl flex justify-between items-center ${
              isDark ? 'bg-purple-500/10' : 'bg-purple-50'
            }`}>
              <span className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Gesamtsumme
              </span>
              <span className={`text-xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {totalAmount.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Documents */}
          <div className={`border-t pt-6 ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
              Belege & Dokumente
            </h3>

            <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
              isDark ? 'border-navy-700' : 'border-light-border'
            }`}>
              <input
                type="file"
                id="documents"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="documents"
                className={`cursor-pointer block ${isDark ? 'text-cream/60' : 'text-light-muted'}`}
              >
                <span className={`w-12 h-12 mx-auto mb-3 block ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
                  {Icons.upload}
                </span>
                <span className="text-sm">
                  Klicke oder ziehe Dateien hierher<br />
                  (PDF, JPG, PNG)
                </span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isDark ? 'bg-navy-800' : 'bg-light-border/30'
                    }`}
                  >
                    <span className={`w-5 h-5 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                      {Icons.file}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
                        {doc.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className={`p-1 rounded ${
                        isDark ? 'text-cream/40 hover:text-coral' : 'text-light-muted hover:text-red-500'
                      }`}
                    >
                      {Icons.trash}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/antraege')}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              icon={Icons.check}
            >
              {loading ? 'Wird eingereicht...' : 'Antrag einreichen'}
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}

export default ApplicationFormPage;
