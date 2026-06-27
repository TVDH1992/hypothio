import { supabase } from './supabase';
import { TOETSRENTES, AFM_TOETSRENTE } from './normen';

export type RenteTabel = Record<number, number>;

export async function haalActueleRentes(): Promise<RenteTabel> {
  try {
    const { data, error } = await supabase
      .from('rentestand')
      .select('periode, rente')
      .eq('actief', true)
      .order('periode');

    if (error || !data?.length) return TOETSRENTES;

    const rentes: RenteTabel = { ...TOETSRENTES };
    for (const row of data) {
      const periode = Number(row.periode);
      const rente = Number(row.rente);
      // Periodes < 10 jaar: altijd AFM-toetsrente (wettelijk verplicht)
      rentes[periode] = periode < 10 ? AFM_TOETSRENTE : rente;
    }
    return rentes;
  } catch {
    return TOETSRENTES;
  }
}
