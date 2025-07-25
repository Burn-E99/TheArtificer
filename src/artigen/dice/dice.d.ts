import { SolvedStep } from 'artigen/math/math.d.ts';

// Available Roll Types
type RollType = '' | 'custom' | 'roll20' | 'fate' | 'cwod' | 'ova';

// RollSet is used to preserve all information about a calculated roll
export interface RollSet {
  type: RollType;
  rollGrpIdx?: number;
  origIdx: number;
  roll: number;
  size: number;
  dropped: boolean;
  rerolled: boolean;
  exploding: boolean;
  critHit: boolean;
  critFail: boolean;
  isComplex: boolean;
  matchLabel: string;
  success: boolean;
  fail: boolean;
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

export type CustomDiceShapes = Map<string, number[]>;

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
  simulatedNominal: number;
  gmRoll: boolean;
  gms: string[];
  order: string;
  count: boolean;
  commaTotals: boolean;
  confirmCrit: boolean;
  rollDist: boolean;
  numberVariables: boolean;
  customDiceShapes: CustomDiceShapes;
  noSpaces: boolean;
  yVars: Map<string, number>;
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
interface GroupRangeConf extends RangeConf {
  // minValue carries the minimum number for the specified option to trigger
  // ex: if set to 4, 4 and greater will trigger the option
  minValue: number | null;
  // maxValue carries the minimum number for the specified option to trigger
  // ex: if set to 4, 4 and less will trigger the option
  maxValue: number | null;
}

// Sort interface
interface SortDisabled {
  on: false;
  direction: '';
}
interface SortEnabled {
  on: true;
  direction: 'a' | 'd';
}

// D% configuration
export interface DPercentConf {
  on: boolean;
  sizeAdjustment: number;
  critVal: number;
}

interface BaseConf {
  drop: CountConf;
  keep: CountConf;
  dropHigh: CountConf;
  keepLow: CountConf;
}
// GroupConf carries the machine readable group configuration the user specified
export interface GroupConf extends BaseConf {
  success: GroupRangeConf;
  fail: GroupRangeConf;
}

// RollConf carries the machine readable roll configuration the user specified
export interface RollConf extends BaseConf {
  type: RollType;
  customType: string | null;
  dieCount: number;
  dieSize: number;
  dPercent: DPercentConf;
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
  match: {
    on: boolean;
    minCount: number;
    returnTotal: boolean;
  };
  sort: SortDisabled | SortEnabled;
  success: RangeConf;
  fail: RangeConf;
}

export interface SumOverride {
  on: boolean;
  value: number;
}

export interface ExecutedRoll {
  rollSet: RollSet[];
  countSuccessOverride: boolean;
  countFailOverride: boolean;
  sumOverride: SumOverride;
}

export interface GroupResultFlags {
  dropped: boolean;
  success: boolean;
  failed: boolean;
}
