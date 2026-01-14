-- ============================================
-- TSC-Jugendportal: Equipment Display Order Fix
-- Migration: 005_equipment_display_order.sql
-- Datum: 2026-01-12
-- ============================================
-- 
-- Problem: DataContext.jsx sortiert nach 'display_order',
--          aber das Feld existiert nicht in der Tabelle.
-- Lösung:  Feld hinzufügen und Default-Werte setzen.
-- ============================================

-- Feld hinzufügen (falls nicht existiert)
ALTER TABLE equipment_types 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Sortierreihenfolge setzen
UPDATE equipment_types SET display_order = 1 WHERE name = 'segelboot';
UPDATE equipment_types SET display_order = 2 WHERE name = 'motorboot';
UPDATE equipment_types SET display_order = 3 WHERE name = 'haenger';

-- Index für schnellere Sortierung
CREATE INDEX IF NOT EXISTS idx_equipment_types_display_order 
ON equipment_types(display_order ASC);

-- ============================================
-- Verification Query (zum Testen)
-- ============================================
-- SELECT name, display_name, display_order 
-- FROM equipment_types 
-- ORDER BY display_order;
