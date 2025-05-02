type MathFunction = (arg: number) => number;

export const legalMath: MathFunction[] = [];
(Object.getOwnPropertyNames(Math) as (keyof Math)[]).forEach((propName) => {
  const mathProp = Math[propName];
  if (typeof mathProp === 'function' && mathProp.length === 1) {
    legalMath.push(mathProp as MathFunction);
  }
});

export const legalMathOperators = legalMath.map((oper) => oper.name);
