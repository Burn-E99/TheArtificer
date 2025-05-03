// SolvedStep is used to preserve information while math is being performed on the roll
export interface SolvedStep {
  total: number;
  details: string;
  containsCrit: boolean;
  containsFail: boolean;
}

// Joined type for mathConf as its a "WIP" variable and moved everything from string->number->SolvedStep
export type MathConf = string | number | SolvedStep;
