import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';

export function EquipmentPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { equipmentTypes, equipment, addEquipment, updateEquipment, deleteEquipment } = useData();

  const [selectedTypeId, setSelectedTypeId] = useState(equipmentTypes[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const filteredEquipment = equipment.filter(e => e.type_id === selectedTypeId);
  const selectedType = equipmentTypes.find(t => t.id === selectedTypeId);

  const handleAdd = async () => {
    if (!newName.trim()) {
      addToast('Bitte Name eingeben', 'error');
      return;
    }

    await addEquipment({
      type_id: selectedTypeId,
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    });

    addToast(`${selectedType?.display_name} hinzugefügt`, 'success');
    setNewName('');
    setNewDescription('');
    setShowAddForm(false);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      addToast('Bitte Name eingeben', 'error');
      return;
    }

    await updateEquipment(id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
    });

    addToast('Änderungen gespeichert', 'success');
    setEditingId(null);
  };

  const handleDelete = async (id, name) => {
    if (confirm(`"${name}" wirklich deaktivieren?`)) {
      await deleteEquipment(id);
      addToast(`"${name}" deaktiviert`, 'success');
    }
  };

  const startEdit = (eq) => {
    setEditingId(eq.id);
    setEditName(eq.name);
    setEditDescription(eq.description || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Equipment verwalten
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Boote, Motorboote und Hänger hinzufügen und bearbeiten
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          Zurück
        </Button>
      </div>

      {/* Type Tabs */}
      <div className={`flex gap-2 p-1 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
        {equipmentTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedTypeId(type.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
              selectedTypeId === type.id
                ? isDark ? 'bg-navy-700 text-cream' : 'bg-white text-light-text shadow-sm'
                : isDark ? 'text-cream/60 hover:text-cream' : 'text-light-muted hover:text-light-text'
            }`}
          >
            <span className="w-5 h-5">
              {type.name === 'segelboot' && Icons.sailboat}
              {type.name === 'motorboot' && Icons.boat}
              {type.name === 'haenger' && Icons.truck}
            </span>
            <span className="font-medium">{type.display_name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              isDark ? 'bg-navy-600' : 'bg-light-border'
            }`}>
              {filteredEquipment.filter(e => e.active).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <GlassCard>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Neues {selectedType?.display_name} hinzufügen
          </h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`z.B. Opti 4`}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>
                Beschreibung
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="z.B. Optimist mit gelbem Segel"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Hinzufügen</Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>Abbrechen</Button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <Button onClick={() => setShowAddForm(true)} icon={Icons.plus}>
          {selectedType?.display_name} hinzufügen
        </Button>
      )}

      {/* Equipment List */}
      <GlassCard>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          {selectedType?.display_name}e ({filteredEquipment.filter(e => e.active).length})
        </h3>

        {filteredEquipment.filter(e => e.active).length > 0 ? (
          <div className="space-y-2">
            {filteredEquipment
              .filter(e => e.active)
              .map(eq => (
                <div
                  key={eq.id}
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-navy-800/30 border-navy-700' : 'bg-light-border/20 border-light-border'
                  }`}
                >
                  {editingId === eq.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-navy-800 border-navy-700 text-cream'
                            : 'bg-white border-light-border text-light-text'
                        }`}
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Beschreibung"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-navy-800 border-navy-700 text-cream'
                            : 'bg-white border-light-border text-light-text'
                        }`}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(eq.id)}>Speichern</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Abbrechen</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                          {eq.name}
                        </div>
                        {eq.description && (
                          <div className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
                            {eq.description}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(eq)}
                          className={`p-2 rounded-lg ${
                            isDark ? 'hover:bg-navy-700 text-cream/60' : 'hover:bg-light-border text-light-muted'
                          }`}
                        >
                          {Icons.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(eq.id, eq.name)}
                          className={`p-2 rounded-lg ${
                            isDark ? 'hover:bg-coral/20 text-coral' : 'hover:bg-red-100 text-red-500'
                          }`}
                        >
                          {Icons.trash}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
              Noch keine {selectedType?.display_name}e vorhanden.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default EquipmentPage;
