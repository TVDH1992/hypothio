import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';

export function BevestigingScreen({ onBevestigd }: { onBevestigd: () => void }) {
  const [status, setStatus] = useState<'laden' | 'succes' | 'fout'>('laden');

  useEffect(() => {
    // Supabase verwerkt de token automatisch via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setStatus('succes');
        setTimeout(onBevestigd, 2000);
      }
    });

    // Timeout als er niets gebeurt
    const timer = setTimeout(() => {
      if (status === 'laden') setStatus('fout');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
        <div className="flex items-center gap-2 justify-center mb-2">
          <div className="w-7 h-7 bg-[#99248F] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="font-bold text-[#0D1F3C]">Hypothio</span>
        </div>

        {status === 'laden' && (
          <>
            <Loader2 className="w-12 h-12 text-[#99248F] animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-[#0D1F3C]">Account bevestigen...</h2>
            <p className="text-sm text-gray-400">Even geduld, we activeren je account.</p>
          </>
        )}

        {status === 'succes' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-[#0D1F3C]">Account bevestigd!</h2>
            <p className="text-sm text-gray-400">Je wordt automatisch ingelogd...</p>
          </>
        )}

        {status === 'fout' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-[#0D1F3C]">Bevestiging mislukt</h2>
            <p className="text-sm text-gray-400">De link is verlopen of al gebruikt. Registreer opnieuw.</p>
            <Button onClick={onBevestigd} className="w-full">Terug naar Hypothio</Button>
          </>
        )}
      </div>
    </div>
  );
}
