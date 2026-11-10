import { CharacterId } from './characterTypes';

export type EquipmentSlot = 'weapon' | 'headgear' | 'cape' | 'aura';

export type EquipmentRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CompetitiveModeId = 'race' | 'dungeon' | 'pvp';

export interface EquipmentItemSpec {
  id: string;
  slot: EquipmentSlot;
  name: string;
  thaiName: string;
  rarity: EquipmentRarity;
  tagline: string;
  /** Used ONLY in Dungeon & PvP Brawler modes. Ignored in Party Race (100% Equalized Fair Play). */
  bonusAtk: number;
  bonusHp: number;
  bonusDef: number;
  bonusCritPct: number;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  dropStageMin: number;
}

export interface EquippedLoadout {
  weapon: string | null;
  headgear: string | null;
  cape: string | null;
  aura: string | null;
}

export interface CombatStats {
  level: number;
  maxHp: number;
  atk: number;
  def: number;
  critPct: number;
  combatPower: number;
}

export const RARITY_META: Record<
  EquipmentRarity,
  {
    label: string;
    thaiLabel: string;
    colorHex: string;
    bgHex: string;
    borderHex: string;
    powerMultiplier: number;
  }
> = {
  common: {
    label: 'Common',
    thaiLabel: 'ทั่วไป',
    colorHex: '#64748B',
    bgHex: '#F1F5F9',
    borderHex: '#94A3B8',
    powerMultiplier: 1.0,
  },
  rare: {
    label: 'Rare',
    thaiLabel: 'หายาก',
    colorHex: '#0284C7',
    bgHex: '#E0F2FE',
    borderHex: '#38BDF8',
    powerMultiplier: 1.35,
  },
  epic: {
    label: 'Epic',
    thaiLabel: 'มหากาพย์',
    colorHex: '#7E22CE',
    bgHex: '#F3E8FF',
    borderHex: '#A855F7',
    powerMultiplier: 1.75,
  },
  legendary: {
    label: 'Legendary',
    thaiLabel: 'ตำนานเทพเจ้า',
    colorHex: '#D97706',
    bgHex: '#FEF3C7',
    borderHex: '#F59E0B',
    powerMultiplier: 2.35,
  },
};

export const SLOT_META: Record<
  EquipmentSlot,
  { label: string; thaiLabel: string; shortLabel: string }
> = {
  weapon: {
    label: 'Weapon',
    thaiLabel: 'อาวุธคู่ใจ',
    shortLabel: 'WEAPON',
  },
  headgear: {
    label: 'Headgear',
    thaiLabel: 'หมวกแฟชั่น',
    shortLabel: 'HAT',
  },
  cape: {
    label: 'Back / Cape',
    thaiLabel: 'ผ้าคลุมหลัง',
    shortLabel: 'CAPE',
  },
  aura: {
    label: '3D Aura',
    thaiLabel: 'ออร่าแสง 3D',
    shortLabel: 'AURA',
  },
};

export const EQUIPMENT_CATALOG: Record<string, EquipmentItemSpec> = {
  // ==================== 1. WEAPONS (อาวุธสุดกวน) ====================
  w_squeaky_duck: {
    id: 'w_squeaky_duck',
    slot: 'weapon',
    name: 'Squeaky Duck Mallet',
    thaiName: 'ค้อนเป็ดยางก๊าบๆ',
    rarity: 'common',
    tagline: 'ตีทีดังก๊าบๆ ศัตรูงงว่าเจ็บหรือฮา',
    bonusAtk: 22,
    bonusHp: 40,
    bonusDef: 5,
    bonusCritPct: 5,
    primaryHex: '#FACC15',
    secondaryHex: '#F97316',
    accentHex: '#EF4444',
    dropStageMin: 1,
  },
  w_mama_slipper: {
    id: 'w_mama_slipper',
    slot: 'weapon',
    name: 'Supreme Mama Slipper',
    thaiName: 'รองเท้าแตะพิฆาตแม่จ๋า',
    rarity: 'rare',
    tagline: 'อาวุธในตำนานประจำบ้าน ความแม่นยำและดาเมจสะท้านทรวง',
    bonusAtk: 42,
    bonusHp: 75,
    bonusDef: 12,
    bonusCritPct: 10,
    primaryHex: '#EC4899',
    secondaryHex: '#FBCFE8',
    accentHex: '#38BDF8',
    dropStageMin: 1,
  },
  w_golden_wok: {
    id: 'w_golden_wok',
    slot: 'weapon',
    name: 'Blazing Chef Wok',
    thaiName: 'กระทะเหล็กไฟลุกเชฟกระทะรั่ว',
    rarity: 'epic',
    tagline: 'ผัดมอนสเตอร์ไฟลุกท่วมหัว ทั้งฟาดหนักและกันดาเมจได้',
    bonusAtk: 68,
    bonusHp: 140,
    bonusDef: 26,
    bonusCritPct: 14,
    primaryHex: '#334155',
    secondaryHex: '#F59E0B',
    accentHex: '#EF4444',
    dropStageMin: 2,
  },
  w_durian_mace: {
    id: 'w_durian_mace',
    slot: 'weapon',
    name: 'King Durian Spiked Club',
    thaiName: 'กระบองหนามทุเรียนหมอนทอง',
    rarity: 'legendary',
    tagline: 'หนามแหลมคมระดับตำนาน ฟาดติดคริติคอลทีสะเทือนทั้งดันเจี้ยน!',
    bonusAtk: 105,
    bonusHp: 210,
    bonusDef: 32,
    bonusCritPct: 24,
    primaryHex: '#65A30D',
    secondaryHex: '#FACC15',
    accentHex: '#A16207',
    dropStageMin: 2,
  },
  w_popsicle_wand: {
    id: 'w_popsicle_wand',
    slot: 'weapon',
    name: 'Rainbow Popsicle Scepter',
    thaiName: 'คทาไอติมเรนโบว์แช่แข็ง',
    rarity: 'legendary',
    tagline: 'คทาหวานเย็นสุดโหด ปล่อยคลื่นน้ำแข็งสตั๊นมอนสเตอร์ยกฝูง',
    bonusAtk: 96,
    bonusHp: 260,
    bonusDef: 38,
    bonusCritPct: 20,
    primaryHex: '#38BDF8',
    secondaryHex: '#F472B6',
    accentHex: '#FDE047',
    dropStageMin: 3,
  },

  // ==================== 2. HEADGEAR (หมวกแฟชั่น) ====================
  h_propeller_cap: {
    id: 'h_propeller_cap',
    slot: 'headgear',
    name: 'Dizzy Propeller Beanie',
    thaiName: 'หมวกใบพัดเด็กแสบ',
    rarity: 'common',
    tagline: 'หมวกใบพัดหมุนติ้วเพิ่มความกวนและพลังชีวิตพื้นฐาน',
    bonusAtk: 6,
    bonusHp: 110,
    bonusDef: 12,
    bonusCritPct: 2,
    primaryHex: '#EF4444',
    secondaryHex: '#3B82F6',
    accentHex: '#FACC15',
    dropStageMin: 1,
  },
  h_noodle_pot: {
    id: 'h_noodle_pot',
    slot: 'headgear',
    name: 'Instant Noodle Pot Helm',
    thaiName: 'หม้อต้มมาม่าครอบหัว',
    rarity: 'rare',
    tagline: 'หม้อทองเหลืองครอบหัวกันกระแทกอย่างดี แถมมีเส้นมาม่าห้อย',
    bonusAtk: 14,
    bonusHp: 210,
    bonusDef: 24,
    bonusCritPct: 5,
    primaryHex: '#F59E0B',
    secondaryHex: '#FEF08A',
    accentHex: '#EF4444',
    dropStageMin: 1,
  },
  h_viking_plunger: {
    id: 'h_viking_plunger',
    slot: 'headgear',
    name: 'Plunger Viking Helmet',
    thaiName: 'หมวกไวกิ้งจุ๊บส้วมทอง',
    rarity: 'epic',
    tagline: 'หมวกนักรบไวกิ้งติดไม้ม็อบจุ๊บยางแดงสุดเกรงขาม',
    bonusAtk: 28,
    bonusHp: 340,
    bonusDef: 38,
    bonusCritPct: 8,
    primaryHex: '#64748B',
    secondaryHex: '#F8FAFC',
    accentHex: '#DC2626',
    dropStageMin: 2,
  },
  h_glacier_crown: {
    id: 'h_glacier_crown',
    slot: 'headgear',
    name: 'Frost Sovereign Crown',
    thaiName: 'มงกุฎจักรพรรดิน้ำแข็ง',
    rarity: 'legendary',
    tagline: 'มงกุฎคริสตัลน้ำแข็งพันปี ส่องประกายระยิบระยับในทุกสนาม',
    bonusAtk: 45,
    bonusHp: 520,
    bonusDef: 55,
    bonusCritPct: 12,
    primaryHex: '#38BDF8',
    secondaryHex: '#E0F2FE',
    accentHex: '#8B5CF6',
    dropStageMin: 3,
  },
  h_disco_afro: {
    id: 'h_disco_afro',
    slot: 'headgear',
    name: 'Funky Disco Crown Wig',
    thaiName: 'มงกุฎดิสโก้ปาร์ตี้ทองคำ',
    rarity: 'legendary',
    tagline: 'โดดเด่นสะดุดตาตั้งแต่จุดสตาร์ทจนถึงห้องบอส',
    bonusAtk: 52,
    bonusHp: 460,
    bonusDef: 48,
    bonusCritPct: 15,
    primaryHex: '#A855F7',
    secondaryHex: '#FACC15',
    accentHex: '#EC4899',
    dropStageMin: 3,
  },

  // ==================== 3. CAPES / BACK (ผ้าคลุมหลัง) ====================
  c_towel_cape: {
    id: 'c_towel_cape',
    slot: 'cape',
    name: 'Bath Towel Hero Cape',
    thaiName: 'ผ้าเช็ดตัวซุปเปอร์ฮีโร่',
    rarity: 'common',
    tagline: 'ผ้าขนหนูผูกคอพร้อมลุยทุกสถานการณ์',
    bonusAtk: 8,
    bonusHp: 95,
    bonusDef: 14,
    bonusCritPct: 2,
    primaryHex: '#38BDF8',
    secondaryHex: '#BAE6FD',
    accentHex: '#FDE047',
    dropStageMin: 1,
  },
  c_cardboard_wings: {
    id: 'c_cardboard_wings',
    slot: 'cape',
    name: 'Cardboard Box Jet-Wings',
    thaiName: 'ปีกกล่องลังไปรษณีย์',
    rarity: 'rare',
    tagline: 'ปีกกล่องกระดาษประดิษฐ์เองแต่เสริมพลังป้องกันแน่นปึ้ก',
    bonusAtk: 18,
    bonusHp: 190,
    bonusDef: 26,
    bonusCritPct: 6,
    primaryHex: '#D97706',
    secondaryHex: '#FDE68A',
    accentHex: '#EF4444',
    dropStageMin: 1,
  },
  c_soda_jetpack: {
    id: 'c_soda_jetpack',
    slot: 'cape',
    name: 'Fizzy Cola Rocket Pack',
    thaiName: 'เจ็ทแพ็คขวดน้ำอัดลมซ่าส์',
    rarity: 'epic',
    tagline: 'ขวดน้ำอัดลมคู่เขย่าฟองฟู่สะพายหลัง เท่เกินต้านทาน',
    bonusAtk: 34,
    bonusHp: 310,
    bonusDef: 36,
    bonusCritPct: 10,
    primaryHex: '#DC2626',
    secondaryHex: '#1E293B',
    accentHex: '#22C55E',
    dropStageMin: 2,
  },
  c_royal_ermine: {
    id: 'c_royal_ermine',
    slot: 'cape',
    name: 'Starlight Sovereign Cloak',
    thaiName: 'ผ้าคลุมราชาขนปุยดาวตก',
    rarity: 'legendary',
    tagline: 'ผ้าคลุมราชันสีแดงขลิบทองระดับตำนาน สง่างามทุกท่วงท่า',
    bonusAtk: 48,
    bonusHp: 490,
    bonusDef: 56,
    bonusCritPct: 14,
    primaryHex: '#B91C1C',
    secondaryHex: '#FEF08A',
    accentHex: '#F59E0B',
    dropStageMin: 3,
  },
  c_dragon_wings: {
    id: 'c_dragon_wings',
    slot: 'cape',
    name: 'Chibi Dragon Wing Pack',
    thaiName: 'ปีกมังกรเพลิงจิ๋ว',
    rarity: 'legendary',
    tagline: 'ปีกมังกรคู่สีม่วง-ทองเพิ่มพลังโจมตีและบารมีขั้นสุด',
    bonusAtk: 64,
    bonusHp: 430,
    bonusDef: 44,
    bonusCritPct: 18,
    primaryHex: '#7C3AED',
    secondaryHex: '#F59E0B',
    accentHex: '#EC4899',
    dropStageMin: 3,
  },

  // ==================== 4. 3D AURAS (ออร่าแสงรอบตัว) ====================
  a_soap_bubbles: {
    id: 'a_soap_bubbles',
    slot: 'aura',
    name: 'Fizzy Soap Bubble Ring',
    thaiName: 'ออร่าฟองสบู่ปุดๆ',
    rarity: 'common',
    tagline: 'วงแหวนฟองสบู่ใสลอยหมุนรอบตัวสุดน่ารัก',
    bonusAtk: 10,
    bonusHp: 75,
    bonusDef: 8,
    bonusCritPct: 5,
    primaryHex: '#38BDF8',
    secondaryHex: '#E0F2FE',
    accentHex: '#F472B6',
    dropStageMin: 1,
  },
  a_chili_sparks: {
    id: 'a_chili_sparks',
    slot: 'aura',
    name: 'Spicy Chili Ember Orbit',
    thaiName: 'ออร่าพริกขี้หนูไฟแลบ',
    rarity: 'rare',
    tagline: 'ลูกไฟพริกเผ็ดร้อนหมุนวนรอบตัว เพิ่มความดุดัน',
    bonusAtk: 28,
    bonusHp: 140,
    bonusDef: 16,
    bonusCritPct: 10,
    primaryHex: '#F97316',
    secondaryHex: '#EF4444',
    accentHex: '#FDE047',
    dropStageMin: 1,
  },
  a_frost_blizzard: {
    id: 'a_frost_blizzard',
    slot: 'aura',
    name: 'Sub-Zero Crystal Swirl',
    thaiName: 'ออร่าพายุเกล็ดหิมะคริสตัล',
    rarity: 'epic',
    tagline: 'ผลึกน้ำแข็งเรืองแสงหมุนวนรอบตัว เย็นยะเยือกจับใจ',
    bonusAtk: 46,
    bonusHp: 250,
    bonusDef: 30,
    bonusCritPct: 15,
    primaryHex: '#06B6D4',
    secondaryHex: '#67E8F9',
    accentHex: '#3B82F6',
    dropStageMin: 2,
  },
  a_thunder_god: {
    id: 'a_thunder_god',
    slot: 'aura',
    name: 'Thunder God Volt Halo',
    thaiName: 'ออร่าสายฟ้าฟาด 8 ทิศ',
    rarity: 'legendary',
    tagline: 'วงแหวนสายฟ้าสีทอง-ม่วงระดับเทพเจ้า ใครเห็นในโหมดวิ่งต้องเหลียวมอง!',
    bonusAtk: 78,
    bonusHp: 340,
    bonusDef: 40,
    bonusCritPct: 22,
    primaryHex: '#FACC15',
    secondaryHex: '#A855F7',
    accentHex: '#38BDF8',
    dropStageMin: 3,
  },
  a_rainbow_party: {
    id: 'a_rainbow_party',
    slot: 'aura',
    name: 'Cosmic Rainbow Star Halo',
    thaiName: 'ออร่าจักรวาลเรนโบว์สตาร์',
    rarity: 'legendary',
    tagline: 'ดวงดาวเรืองแสง 6 สีหมุนรอบตัว สุดยอดแฟชั่นแรร์ประจำซีซั่น!',
    bonusAtk: 72,
    bonusHp: 410,
    bonusDef: 48,
    bonusCritPct: 20,
    primaryHex: '#EC4899',
    secondaryHex: '#FACC15',
    accentHex: '#06B6D4',
    dropStageMin: 3,
  },
};

export const EQUIPMENT_LIST: EquipmentItemSpec[] =
  Object.values(EQUIPMENT_CATALOG);

export const DEFAULT_STARTER_LOADOUT: EquippedLoadout = {
  weapon: 'w_squeaky_duck',
  headgear: 'h_propeller_cap',
  cape: 'c_towel_cape',
  aura: 'a_soap_bubbles',
};

/**
 * Computes total combat stats for Dungeon Raid & 3D Brawler PvP modes.
 * NOTE: Party Race mode explicitly DOES NOT use these stats (100% Equalized Fair Play).
 */
export function computeCharacterCombatStats(
  level: number,
  loadout: EquippedLoadout
): CombatStats {
  const safeLevel = Math.max(1, Math.min(99, Math.floor(level || 1)));
  let maxHp = 450 + (safeLevel - 1) * 65;
  let atk = 38 + (safeLevel - 1) * 8;
  let def = 18 + (safeLevel - 1) * 4;
  let critPct = 8;

  const equippedIds = [
    loadout.weapon,
    loadout.headgear,
    loadout.cape,
    loadout.aura,
  ];
  for (const itemId of equippedIds) {
    if (!itemId) continue;
    const spec = EQUIPMENT_CATALOG[itemId];
    if (!spec) continue;
    maxHp += spec.bonusHp;
    atk += spec.bonusAtk;
    def += spec.bonusDef;
    critPct += spec.bonusCritPct;
  }

  critPct = Math.min(75, critPct);
  const combatPower = Math.round(
    atk * 4.2 + maxHp * 0.45 + def * 3.1 + critPct * 9.5
  );

  return {
    level: safeLevel,
    maxHp,
    atk,
    def,
    critPct,
    combatPower,
  };
}

export interface RankTierInfo {
  tierName: string;
  thaiTierName: string;
  colorHex: string;
  bgHex: string;
  minRp: number;
}

export function getRankTierByRp(rp: number): RankTierInfo {
  if (rp >= 2200) {
    return {
      tierName: 'Grand Champion',
      thaiTierName: 'แกรนด์แชมเปี้ยน',
      colorHex: '#F59E0B',
      bgHex: '#FEF3C7',
      minRp: 2200,
    };
  }
  if (rp >= 1650) {
    return {
      tierName: 'Crystal Master',
      thaiTierName: 'คริสตัลมาสเตอร์',
      colorHex: '#A855F7',
      bgHex: '#F3E8FF',
      minRp: 1650,
    };
  }
  if (rp >= 1250) {
    return {
      tierName: 'Gold Striker',
      thaiTierName: 'โกลด์สไตรเกอร์',
      colorHex: '#EAB308',
      bgHex: '#FEF9C3',
      minRp: 1250,
    };
  }
  if (rp >= 950) {
    return {
      tierName: 'Silver Dash',
      thaiTierName: 'ซิลเวอร์แดช',
      colorHex: '#0284C7',
      bgHex: '#E0F2FE',
      minRp: 950,
    };
  }
  return {
    tierName: 'Bronze Pal',
    thaiTierName: 'บรอนซ์พาล',
    colorHex: '#B45309',
    bgHex: '#FFEDD5',
    minRp: 0,
  };
}

export interface UserProfileData {
  id: number;
  username: string;
  displayName: string;
  isGuest: boolean;
  sessionToken: string;
  selectedCharacterId: CharacterId;
  activeSkillId: string;
  passiveSkillId: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  coins: number;
  loadout: EquippedLoadout;
  inventory: string[];
  rankings: {
    seasonNumber: number;
    seasonName: string;
    raceRp: number;
    raceWins: number;
    raceMatches: number;
    dungeonRp: number;
    highestStage: number;
    bossesDefeated: number;
    pvpRp: number;
    pvpWins: number;
    pvpMatches: number;
  };
}
