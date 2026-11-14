import { SatkerData, UserProfile } from '../types/mongrc';

export const DEFAULT_USER_PASSWORD = 'Defaultuser@12345';
export const DEFAULT_ADMIN_USERNAME = 'admin.p2';
export const DEFAULT_ADMIN_PASSWORD = 'Admin!123';
export const DEFAULT_ADMIN_EMAIL = 'budi.hermawan.a@gmail.com';

export interface SatkerUserSeed {
  satkerNo: number;
  username: string;
  email: string;
}

const ORDERED_SATKER_USERNAMES: string[] = [
  'user_batam',
  'user_denpasar',
  'user_makassar',
  'user_medan',
  'user_soekarno_hatta',
  'user_surabaya',
  'user_tanjung_priok',
  'user_ambon',
  'user_balikpapan',
  'user_banda_aceh',
  'user_bandung',
  'user_banjarmasin',
  'user_banten',
  'user_cilacap',
  'user_dumai',
  'user_gorontalo',
  'user_jayapura',
  'user_kendari',
  'user_kupang',
  'user_manado',
  'user_mataram',
  'user_padang',
  'user_palembang',
  'user_panjang',
  'user_pekanbaru',
  'user_pontianak',
  'user_probolinggo',
  'user_samarinda',
  'user_semarang',
  'user_tanjung_balai_karimun',
  'user_tanjung_pinang',
  'user_tarakan',
  'user_ternate',
  'user_bengkulu',
  'user_biak',
  'user_bitung',
  'user_jambi',
  'user_lhokseumawe',
  'user_manokwari',
  'user_merauke',
  'user_palangkaraya',
  'user_palu',
  'user_pangkal_pinang',
  'user_poso',
  'user_sabang',
  'user_sampit',
  'user_sorong',
  'user_tembilahan',
  'user_yogyakarta',
  'user_entikong',
  'user_labuan_bajo',
  'user_dit_imunisasi',
  'user_dit_kesling',
  'user_dit_pm',
  'user_dit_ptm',
  'user_dit_skk',
  'user_setditjen_p2',
];

export const SATKER_USER_SEEDS: SatkerUserSeed[] = ORDERED_SATKER_USERNAMES.map(
  (username, index) => ({
    satkerNo: index + 1,
    username,
    email: `${username}@gmail.com`,
  })
);

function getInitials(label: string): string {
  const words = label
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return (words[0] || 'US').slice(0, 2).toUpperCase();
}

export function buildInitialSatkerUsers(satkers: SatkerData[]): UserProfile[] {
  return SATKER_USER_SEEDS.map((seed) => {
    const matchedSatker = satkers.find((s) => s.no === seed.satkerNo);
    const satkerLabel = matchedSatker?.satker || seed.username.replace(/^user_/, '').replace(/_/g, ' ');
    const unitKerja = matchedSatker?.unitKerja || `Satuan Kerja #${seed.satkerNo}`;

    return {
      id: `user-${seed.username}`,
      username: seed.username,
      email: seed.email,
      nip: `SATKER-${String(seed.satkerNo).padStart(3, '0')}`,
      name: `PIC ${satkerLabel}`,
      role: 'Satker PIC',
      agency: unitKerja,
      assignedSatker: satkerLabel,
      assignedSatkerNo: seed.satkerNo,
      avatarInitials: getInitials(satkerLabel),
      status: 'active',
      password: DEFAULT_USER_PASSWORD,
      createdAt: '2026-11-13 00:00',
    };
  });
}

export function resolveIdentifierToEmail(
  identifier: string,
  usersPool: UserProfile[]
): string | null {
  const raw = identifier.trim().toLowerCase();
  if (!raw) return null;

  if (raw.includes('@')) {
    return raw;
  }

  const fromPool = usersPool.find(
    (u) =>
      u.username.toLowerCase() === raw ||
      u.nip.toLowerCase() === raw ||
      u.email.toLowerCase() === raw
  );
  if (fromPool) {
    return fromPool.email.trim().toLowerCase();
  }

  const fromSeed = SATKER_USER_SEEDS.find((s) => s.username.toLowerCase() === raw);
  if (fromSeed) {
    return fromSeed.email;
  }

  if (raw === DEFAULT_ADMIN_USERNAME) {
    return DEFAULT_ADMIN_EMAIL;
  }

  return null;
}
