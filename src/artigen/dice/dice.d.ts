import { SolvedStep } from 'artigen/math/math.d.ts';

// Available Roll Types
type RollType = '' | 'roll20' | 'fate' | 'cwod' | 'ova';

// RollSet is used to preserve all information about a calculated roll
export interface RollSet {
  type: RollType;
  origIdx: number;
  roll: number;
  size: number;
  dropped: boolean;
  rerolled: boolean;
  exploding: boolean;
  critHit: boolean;
  critFail: boolean;
}

// CountDetails is the object holding the count data for creating the Count Embed
export interface CountDetails {
  total: number;
  successful: number;
  failed: number;
  rerolled: number;
  dropped: number;
  exploded: number;
}

// RollDistribution is used for storing the raw roll distribution
// use rollDistKey to generate the key
export type RollDistributionMap = Map<string, number[]>;

// RollFormat is the return structure for the rollFormatter
export interface FormattedRoll {
  solvedStep: SolvedStep;
  countDetails: CountDetails;
  rollDistributions: RollDistributionMap;
}

// RollModifiers is the structure to keep track of the decorators applied to a roll command
export interface RollModifiers {
  noDetails: boolean;
  superNoDetails: boolean;
  hideRaw: boolean;
  spoiler: string;
  maxRoll: boolean;
  minRoll: boolean;
  nominalRoll: boolean;
  gmRoll: boolean;
  gms: string[];
  order: string;
  count: boolean;
  commaTotals: boolean;
  confirmCrit: boolean;
  rollDist: boolean;
  apiWarn: string;
  valid: boolean;
  error: Error;
}

// Basic conf interfaces
interface CountConf {
  on: boolean;
  count: number;
}
interface RangeConf {
  on: boolean;
  range: number[];
}

// D% configuration
export interface DPercentConf {
  on: boolean;
  sizeAdjustment: number;
  critVal: number;
}

// RollConf is used by the roll20 setup
export interface RollConf {
  type: RollType;
  dieCount: number;
  dieSize: number;
  dPercent: DPercentConf;
  drop: CountConf;
  keep: CountConf;
  dropHigh: CountConf;
  keepLow: CountConf;
  reroll: {
    on: boolean;
    once: boolean;
    nums: number[];
  };
  critScore: RangeConf;
  critFail: RangeConf;
  exploding: {
    on: boolean;
    once: boolean;
    compounding: boolean;
    penetrating: boolean;
    nums: number[];
  };
}
