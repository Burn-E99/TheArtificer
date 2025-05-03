import { CountDetails } from 'artigen/dice/dice.d.ts';

// ReturnData is the temporary internal type used before getting turned into SolvedRoll
export interface ReturnData {
  rollTotal: number;
  rollPreFormat: string;
  rollPostFormat: string;
  rollDetails: string;
  containsCrit: boolean;
  containsFail: boolean;
  initConfig: string;
}

// SolvedRoll is the complete solved and formatted roll, or the error said roll created
export interface SolvedRoll {
  error: boolean;
  errorMsg: string;
  errorCode: string;
  line1: string;
  line2: string;
  line3: string;
  counts: CountDetails;
}
