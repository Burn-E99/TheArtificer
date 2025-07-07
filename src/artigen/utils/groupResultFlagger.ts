import { GroupResultFlags } from 'artigen/dice/dice.d.ts';

export const applyFlags = (rollDetails: string, flags: GroupResultFlags): string => {
  if (flags.dropped) {
    return `~~${rollDetails.replaceAll('~', '')}~~`;
  } else if (flags.success) {
    return `S:${rollDetails}`;
  } else if (flags.failed) {
    return `F:${rollDetails}`;
  } else {
    return rollDetails;
  }
};
