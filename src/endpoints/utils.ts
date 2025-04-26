export const verifyQueryHasParams = (query: Map<string, string>, desiredParams: Array<string>): boolean =>
  desiredParams.every((param) => {
    return query.has(param) && (query.get(param) || '').length > 0;
  });
