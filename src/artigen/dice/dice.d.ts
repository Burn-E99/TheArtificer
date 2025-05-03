// RollModifiers is the structure to keep track of the decorators applied to a roll command
export type RollModifiers = {
  noDetails: boolean;
  superNoDetails: boolean;
  spoiler: string;
  maxRoll: boolean;
  minRoll: boolean;
  nominalRoll: boolean;
  gmRoll: boolean;
  gms: string[];
  order: string;
  count: boolean;
  commaTotals: boolean;
  valid: boolean;
  apiWarn: string;
};
