import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons } from '@tsc/ui';

export function ThankYouPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto">
      <GlassCard className="text-center py-12">
        <div className="float inline-block mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
          }`}>
            <span className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}>
              {Icons.check}
            </span>
          </div>
        </div>

        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Vielen Dank für deine Spende!
        </h1>

        <p className={`mb-6 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
          Deine großzügige Unterstützung hilft uns, jungen Segler:innen
          unvergessliche Erlebnisse auf dem Wasser zu ermöglichen.
        </p>

        <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-navy-800' : 'bg-light-border/50'}`}>
          <h3 className={`font-medium mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Was passiert jetzt?
          </h3>
          <ul className={`text-sm text-left space-y-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">{Icons.check}</span>
              Du erhältst eine Bestätigung per E-Mail
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">{Icons.check}</span>
              Deine Spendenquittung wird per Post zugestellt
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">{Icons.check}</span>
              Die Spende ist steuerlich absetzbar
            </li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate('/kampagnen')}>
            Kampagnen ansehen
          </Button>
          <Button onClick={() => navigate('/')}>
            Erneut spenden
          </Button>
        </div>

        <p className={`mt-8 text-xs ${isDark ? 'text-cream/40' : 'text-light-muted'}`}>
          Bei Fragen wende dich an jugend@tegeler-segel-club.de
        </p>
      </GlassCard>
    </div>
  );
}

export default ThankYouPage;
