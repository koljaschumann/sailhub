import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTheme, GlassCard, Button, Icons, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function ReportFormPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { equipmentTypes, getEquipmentByType, addDamageReport, loading } = useData();

  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [photos, setPhotos] = useState([]);

  // Optimist-spezifische Felder
  const [boatName, setBoatName] = useState('');
  const [sailNumber, setSailNumber] = useState('');

  const filteredEquipment = getEquipmentByType(selectedTypeId);

  // Pruefen ob Optimist ausgewaehlt ist
  const selectedEquipment = filteredEquipment.find(eq => eq.id === selectedEquipmentId);
  const isOptimist = selectedEquipment?.name?.toLowerCase().includes('optimist');

  const onDrop = useCallback((acceptedFiles) => {
    const newPhotos = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEquipmentId) {
      addToast('Bitte wähle ein Objekt aus', 'error');
      return;
    }

    // Validierung fuer Optimist-Felder
    if (isOptimist && !boatName.trim()) {
      addToast('Bitte gib den Bootsnamen an', 'error');
      return;
    }

    if (isOptimist && !sailNumber.trim()) {
      addToast('Bitte gib die Segelnummer an', 'error');
      return;
    }

    if (!description.trim()) {
      addToast('Bitte beschreibe den Schaden', 'error');
      return;
    }

    if (!reporterName.trim()) {
      addToast('Bitte gib deinen Namen an', 'error');
      return;
    }

    if (!reporterEmail.trim()) {
      addToast('Bitte gib deine E-Mail-Adresse an', 'error');
      return;
    }

    // Einfache E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reporterEmail.trim())) {
      addToast('Bitte gib eine gültige E-Mail-Adresse an', 'error');
      return;
    }

    // Beschreibung mit Bootsdetails erweitern fuer Optimist
    let fullDescription = description.trim();
    if (isOptimist && boatName && sailNumber) {
      fullDescription = `Boot: ${boatName.trim()}, Segelnummer: ${sailNumber.trim()}

${fullDescription}`;
    }

    try {
      await addDamageReport({
        equipment_id: selectedEquipmentId,
        description: fullDescription,
        reporter_name: reporterName.trim(),
        reporter_email: reporterEmail.trim(),
        photos,
      });

      addToast('Schadensmeldung erfolgreich eingereicht!', 'success');

      // Reset form
      setSelectedTypeId('');
      setSelectedEquipmentId('');
      setDescription('');
      setPhotos([]);

      // Navigate to list
      setCurrentPage('list');
    } catch (err) {
      console.error('Error submitting report:', err);
      addToast('Fehler beim Einreichen der Meldung', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Schaden melden
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Melde Schäden an Booten, Motorbooten oder Hängern
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="space-y-6">
          {/* Equipment Type Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Art des Equipments *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {equipmentTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setSelectedEquipmentId('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedTypeId === type.id
                      ? isDark
                        ? 'border-gold-400 bg-gold-400/10'
                        : 'border-teal-500 bg-teal-500/10'
                      : isDark
                        ? 'border-navy-700 hover:border-gold-400/50'
                        : 'border-light-border hover:border-teal-500/50'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 ${
                    selectedTypeId === type.id
                      ? isDark ? 'text-gold-400' : 'text-teal-600'
                      : isDark ? 'text-cream/60' : 'text-light-muted'
                  }`}>
                    {type.name === 'segelboot' && Icons.sailboat}
                    {type.name === 'motorboot' && Icons.motorboat}
                    {type.name === 'haenger' && Icons.truck}
                  </div>
                  <span className={`text-sm font-medium ${
                    selectedTypeId === type.id
                      ? isDark ? 'text-cream' : 'text-light-text'
                      : isDark ? 'text-cream/60' : 'text-light-muted'
                  }`}>
                    {type.display_name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Selection */}
          {selectedTypeId && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Welches {equipmentTypes.find(t => t.id === selectedTypeId)?.display_name}? *
              </label>
              <select
                value={selectedEquipmentId}
                onChange={(e) => {
                  setSelectedEquipmentId(e.target.value);
                  setBoatName('');
                  setSailNumber('');
                }}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              >
                <option value="">Bitte wählen...</option>
                {filteredEquipment.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} {eq.description && `(${eq.description})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optimist-spezifische Felder */}
          {isOptimist && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Bootsname *
                </label>
                <input
                  type="text"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  placeholder="z.B. Speedy, Blitz..."
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                  Segelnummer *
                </label>
                <input
                  type="text"
                  value={sailNumber}
                  onChange={(e) => setSailNumber(e.target.value)}
                  placeholder="z.B. GER 12345"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Schadensbeschreibung *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Beschreibe den Schaden möglichst genau..."
              className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
              Fotos (optional)
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragActive
                  ? isDark ? 'border-gold-400 bg-gold-400/10' : 'border-teal-500 bg-teal-500/10'
                  : isDark ? 'border-navy-700 hover:border-gold-400/50' : 'border-light-border hover:border-teal-500/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
              }`}>
                {Icons.camera}
              </div>
              <p className={isDark ? 'text-cream' : 'text-light-text'}>
                {isDragActive ? 'Fotos hier ablegen...' : 'Fotos hier ablegen oder klicken'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                JPG, PNG, WebP bis 10MB
              </p>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {Icons.x}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reporter Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Dein Name *
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Max Mustermann"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                E-Mail *
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="deine@email.de"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCurrentPage('list')}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              icon={Icons.send}
            >
              {loading ? 'Wird gesendet...' : 'Schaden melden'}
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}

export default ReportFormPage;
