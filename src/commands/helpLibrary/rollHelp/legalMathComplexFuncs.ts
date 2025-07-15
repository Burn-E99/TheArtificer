import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Complex Math Functions';
const description = `All the weird extras.

I really have no idea what these could be used for, but if you find a cool use, please use \`${config.prefix}report\` to let me know what cool things you are doing!

Have fun!

Documentation from the [MDN Web Docs](${config.links.mathDocs}).`;
const dict = new Map<string, HelpContents>([
  [
    'cbrt',
    {
      name: 'Cube Root',
      description: 'Returns the cube root of a number.',
      example: ['`[[cbrt(27)]]` => 3', '`[[cbrt(d20 * 4)]]` => cbrt([10] * 6.4) = 4'],
    },
  ],
  [
    'exp',
    {
      name: 'e^x',
      description: 'Returns `e` raised to the power of a number.',
      example: ['`[[exp(2)]]` => 7.38905609893065', '`[[exp(d8)]]` => exp([6]) = 403.4287934927351'],
    },
  ],
  [
    'expm1',
    {
      name: 'e^x - 1',
      description: 'Returns `e` raised to the power of a number, subtracted by `1`.',
      example: ['`[[expm1(2)]]` => 6.38905609893065', '`[[expm1(d8)]]` => expm1([6]) = 402.4287934927351'],
    },
  ],
  [
    'sign',
    {
      name: 'Sign',
      description: 'Returns `1` or `-1`, indicating the sign of the number passed as argument.',
      example: ['`[[sign(-456)]]` => -1', '`[[sign(d20)]]` => sign([14]) = 1'],
    },
  ],
  [
    'f16round',
    {
      name: '16bit Float Round',
      description: 'Returns the nearest 16-bit half precision float representation of a number.',
      example: ['`[[f16round(4.1)]]` => 4.1015625', '`[[f16round(d4 / 3)]]` => f16round([2] / 3) = 0.66650390625'],
    },
  ],
  [
    'fround',
    {
      name: '32bit Float Round',
      description: 'Returns the nearest 32-bit single precision float representation of a number.',
      example: ['`[[fround(4.1)]]` => 4.099999904632568', '`[[fround(d4 / 3)]]` => fround([2] / 3) = 0.6666666865348816'],
    },
  ],
  [
    'log',
    {
      name: 'Natural Log (ln(x))',
      description: 'Returns the natural logarithm (base e) of a number.',
      example: ['`[[log(2)]]` => 0.6931471805599453', '`[[log(d8)]]` => log([4]) = 1.3862943611198906'],
    },
  ],
  [
    'log1p',
    {
      name: 'Natural Log (ln(x + 1))',
      description: 'Returns the natural logarithm (base e) of `1 + x`, where `x` is the argument.',
      example: ['`[[log1p(2)]]` => 1.0986122886681096', '`[[log1p(d8)]]` => log1p([4]) = 1.6094379124341003'],
    },
  ],
  [
    'log2',
    {
      name: 'Log Base 2',
      description: 'Returns the base 2 logarithm of a number.',
      example: ['`[[log2(2)]]` => 1', '`[[log2(d8)]]` => log2([4]) = 2'],
    },
  ],
  [
    'log10',
    {
      name: 'Log Base 10',
      description: 'Returns the base 10 logarithm of a number.',
      example: ['`[[log10(2)]]` => 0.3010299956639812', '`[[log10(d8)]]` => log10([4]) = 0.6020599913279624'],
    },
  ],
  [
    'clz32',
    {
      name: 'Count Leading Zeros 32',
      description: 'Returns the number of leading zero bits in the 32-bit binary representation of a number.',
      example: ['`[[clz32(1)]]` => 31', '`[[clz32(d20)]]` => clz32([19] * 4) = 25'],
    },
  ],
]);

export const LegalMathComplexFuncsHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
