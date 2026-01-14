# 🐛 Bug: E-Mail-Bestätigung bei Registrierung fehlt

> **Erstellt:** 12. Januar 2026  
> **Status:** 🔴 Offen  
> **Priorität:** Hoch (Sicherheitsrelevant)

---

## Problem-Beschreibung

**Was sollte passieren:**
1. User registriert sich
2. User erhält Bestätigungs-E-Mail
3. User klickt Link in E-Mail
4. Erst DANN ist der Account aktiv
5. Admin erhält Benachrichtigung über neue Registrierung

**Was passiert stattdessen:**
1. User registriert sich
2. User wird SOFORT zum Dashboard weitergeleitet
3. Keine E-Mail kommt an
4. Admin erfährt nichts von der Registrierung

**Reproduzierbar?** ✅ Ja, 100%

---

## Root Cause Analyse

### Ursache 1: Supabase-Konfiguration
Die Self-Hosted Supabase-Instanz hat **E-Mail-Bestätigung deaktiviert**.

**Wo:** Supabase Dashboard → Authentication → Settings → Email Auth

**Einstellung:** `Enable email confirmations` ist wahrscheinlich **OFF**

### Ursache 2: Fehlende Admin-Benachrichtigung
Im Code existiert keine Logik für Admin-Notifications. Mögliche Lösungen:
- Database Trigger (INSERT on auth.users → notify admins)
- Edge Function
- Webhook

---

## Lösungsplan

### Fix 1: E-Mail-Bestätigung aktivieren

**Option A: Supabase Dashboard**
1. Öffne https://studio.aitema.de
2. Gehe zu Authentication → Settings
3. Aktiviere "Enable email confirmations"
4. Konfiguriere SMTP (falls nicht schon geschehen)

**Option B: Supabase Config (Docker)**
```bash
ssh root@49.13.15.44
cd /root/hetzner-stack
# In .env oder docker-compose.yml:
# GOTRUE_MAILER_AUTOCONFIRM=false
```

### Fix 2: Admin-Benachrichtigung implementieren

**Option A: Database Trigger + Edge Function**
```sql
-- Migration: 005_admin_notification.sql
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Hier: E-Mail an Admin senden oder in Notification-Tabelle schreiben
  INSERT INTO admin_notifications (type, user_id, created_at)
  VALUES ('new_registration', NEW.id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_user_registration
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION notify_admin_new_user();
```

**Option B: Im Frontend nach erfolgreicher Registrierung**
```javascript
// Nach signUp() in Register.jsx
await supabase.from('admin_notifications').insert({
  type: 'new_registration',
  user_email: email,
  user_name: fullName,
  requested_role: role
});
```

---

## Zu prüfen

- [ ] SMTP-Konfiguration auf dem Server (kann Supabase überhaupt E-Mails senden?)
- [ ] Supabase Auth Settings im Dashboard
- [ ] Existiert eine `admin_notifications` Tabelle?

---

## Betroffene Dateien

| Datei | Änderung nötig |
|-------|----------------|
| Supabase Config (Server) | E-Mail-Bestätigung aktivieren |
| `apps/web/src/pages/Register.jsx` | Optional: Admin-Notification nach signUp |
| `supabase/migrations/` | Neue Migration für Notification-Trigger |
| `packages/supabase/src/useAuth.jsx` | Keine Änderung nötig |

---

## Notizen

- Self-Hosted Supabase auf Hetzner (49.13.15.44)
- Studio URL: https://studio.aitema.de
- Die Register.jsx zeigt zwar "Bitte bestätige deine E-Mail" an, aber das wird ignoriert weil Supabase sofort eine Session erstellt
