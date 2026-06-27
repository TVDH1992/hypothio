import { supabase } from './supabase';
import { TOETSRENTES, AFM_TOETSRENTE, LTI_NORMEN, type LtiRij } from './normen';

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
      rentes[periode] = periode < 10 ? AFM_TOETSRENTE : rente;
    }
    return rentes;
  } catch {
    return TOETSRENTES;
  }
}

export async function haalActueleNormen(): Promise<LtiRij[]> {
  try {
    const { data, error } = await supabase
      .from('nibud_normen')
      .select('max_inkomen, factor')
      .eq('actief', true)
      .order('max_inkomen');

    if (error || !data?.length) return LTI_NORMEN;

    return data.map(row => ({
      maxInkomen: Number(row.max_inkomen) >= 9_000_000 ? Infinity : Number(row.max_inkomen),
      factor: Number(row.factor),
    }));
  } catch {
    return LTI_NORMEN;
  }
}
