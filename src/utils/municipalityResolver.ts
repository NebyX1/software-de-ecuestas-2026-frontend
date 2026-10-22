import type {
  LocalityId,
  MunicipalityId,
  MunicipalityMembershipAnswer,
} from '../types';
import { MUNICIPALITIES, MUNICIPALITY_LABELS } from '../data/surveyOptions';

export interface ResolvedMunicipality {
  municipality: MunicipalityId | null;
  known: boolean;
  label: string | null;
}

export function resolveMunicipality(
  locality: LocalityId | undefined,
  membership: MunicipalityMembershipAnswer | undefined,
): ResolvedMunicipality {
  if (!locality) {
    return { municipality: null, known: false, label: null };
  }

  if (MUNICIPALITIES.includes(locality as MunicipalityId)) {
    const id = locality as MunicipalityId;
    return { municipality: id, known: true, label: MUNICIPALITY_LABELS[id] };
  }

  if (locality === 'minas' || locality === 'ns_nc') {
    return { municipality: null, known: false, label: null };
  }

  if (locality === 'otra_urbana' || locality === 'otra_rural') {
    if (
      membership && MUNICIPALITIES.includes(membership as MunicipalityId)
    ) {
      const id = membership as MunicipalityId;
      return { municipality: id, known: true, label: MUNICIPALITY_LABELS[id] };
    }
    return { municipality: null, known: false, label: null };
  }

  return { municipality: null, known: false, label: null };
}

export function municipalityName(id: MunicipalityId): string {
  return MUNICIPALITY_LABELS[id];
}
