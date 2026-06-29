import { supabase } from './supabase';
import type { Profiel, GeslaagdeWoning, Sessie } from '../types/profiel';

const SESSIE_KEY = 'hypothio_sessie';

// --- Sessie (lokaal — is gewoon Supabase auth state cache) ---

export function laadSessie(): Sessie | null {
  try {
    const raw = localStorage.getItem(SESSIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function slaSessionOp(sessie: Sessie): void {
  localStorage.setItem(SESSIE_KEY, JSON.stringify(sessie));
}

export function verwijderSessie(): void {
  localStorage.removeItem(SESSIE_KEY);
}

// --- Profiel (Supabase) ---

export async function laadProfiel(): Promise<Profiel | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profielen')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) return null;

  return {
    id: data.user_id,
    naam: data.naam,
    aangemaakt: new Date(data.aangemaakt_op).toLocaleDateString('nl-NL'),
    maxHypotheek: data.max_hypotheek,
    resultaat: data.resultaat,
    wizardInvoer: data.wizard_invoer ?? undefined,
  };
}

export async function slaProfielOp(profiel: Profiel): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('profielen').upsert({
    user_id: user.id,
    naam: profiel.naam,
    max_hypotheek: profiel.maxHypotheek,
    resultaat: profiel.resultaat,
    wizard_invoer: profiel.wizardInvoer ?? null,
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function verwijderProfiel(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    supabase.from('woningen').delete().eq('user_id', user.id),
    supabase.from('profielen').delete().eq('user_id', user.id),
  ]);
}

// --- Woningen (Supabase) ---

export async function laadWoningen(): Promise<GeslaagdeWoning[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('woningen')
    .select('*')
    .eq('user_id', user.id)
    .order('toegevoegd_op', { ascending: false });

  if (!data) return [];

  return data.map(w => ({
    id: w.id,
    fundaUrl: w.funda_url,
    adres: w.adres,
    stad: w.stad,
    vraagprijs: w.vraagprijs,
    marktwaarde: w.marktwaarde ?? undefined,
    toegevoegd: new Date(w.toegevoegd_op).toLocaleDateString('nl-NL'),
    analyseData: w.analyse_data ?? undefined,
  }));
}

export async function voegWoningToe(woning: Omit<GeslaagdeWoning, 'id' | 'toegevoegd'>): Promise<GeslaagdeWoning | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('woningen').insert({
    user_id: user.id,
    funda_url: woning.fundaUrl,
    adres: woning.adres,
    stad: woning.stad,
    vraagprijs: woning.vraagprijs,
    marktwaarde: woning.marktwaarde ?? null,
    analyse_data: woning.analyseData ?? null,
  }).select().single();

  if (!data) return null;

  return {
    id: data.id,
    fundaUrl: data.funda_url,
    adres: data.adres,
    stad: data.stad,
    vraagprijs: data.vraagprijs,
    marktwaarde: data.marktwaarde ?? undefined,
    toegevoegd: new Date(data.toegevoegd_op).toLocaleDateString('nl-NL'),
  };
}

export async function verwijderWoning(id: string): Promise<void> {
  await supabase.from('woningen').delete().eq('id', id);
}

// --- Funda URL parser ---

export function parseFundaUrl(url: string): { adres: string; stad: string; geldig: boolean } {
  try {
    const clean = url.trim().replace(/\/$/, '');
    const parts = clean.split('/').filter(Boolean);

    const koopIdx = parts.findIndex(p => p === 'koop' || p === 'huur');
    if (koopIdx === -1 || parts.length < koopIdx + 3) {
      return { adres: '', stad: '', geldig: false };
    }

    const stad = parts[koopIdx + 1];
    const slug = parts[koopIdx + 2];
    const slugParts = slug.split('-');
    const isOudFormaat = /^\d{8}$/.test(slugParts[1] ?? '');
    const raw = isOudFormaat ? slugParts.slice(2) : slugParts.slice(1);
    const adresDelen = raw.filter(d => !/^\d{4}[a-z]{2}$/i.test(d));
    const adres = adresDelen
      .map(d => d.charAt(0).toUpperCase() + d.slice(1))
      .join(' ');

    return {
      adres: adres || slug,
      stad: stad.charAt(0).toUpperCase() + stad.slice(1),
      geldig: adres.length > 0,
    };
  } catch {
    return { adres: '', stad: '', geldig: false };
  }
}
