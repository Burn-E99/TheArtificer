import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Trigonometric Math Funcs';
const description = `Math functions such as sine and cosine.

I have no idea why you may need this in a dice rolling bot, but have fun!

Documentation from the [MDN Web Docs](${config.links.mathDocs}).`;
const dict = new Map<string, HelpContents>([
  [
    'sin',
    {
      name: 'Sine',
      description: 'Returns the sine of a number in radians.',
      example: ['`[[sin(2)]]` => 0.9092974268256817', '`[[sin(d4)]]` => sin([3]) = 0.1411200080598672'],
    },
  ],
  [
    'sinh',
    {
      name: 'Hyperbolic Sine',
      description: 'Returns the hyperbolic sine of a number.',
      example: ['`[[sinh(2)]]` => 3.626860407847019', '`[[sinh(d4)]]` => sinh([3]) = 10.017874927409903'],
    },
  ],
  [
    'asin',
    {
      name: 'Arc Sine',
      description: 'Returns the inverse/arc sine (in radians) of a number.',
      example: ['`[[asin(1)]]` => 1.5707963267948966', '`[[asin(d4 / 4)]]` => asin([3] / 4) = 0.848062078981481'],
    },
  ],
  [
    'asinh',
    {
      name: 'Arc Hyperbolic Sine',
      description: 'Returns the inverse/arc hyperbolic sine of a number.',
      example: ['`[[asinh(2)]]` => 1.4436354751788103', '`[[asinh(d4)]]` => asinh([3]) = 1.8184464592320668'],
    },
  ],
  [
    'cos',
    {
      name: 'Cosine',
      description: 'Returns the cosine of a number in radians.',
      example: ['`[[cos(2)]]` => -0.4161468365471424', '`[[cos(d4)]]` => cos([3]) = -0.9899924966004454'],
    },
  ],
  [
    'cosh',
    {
      name: 'Hyperbolic Cosine',
      description: 'Returns the hyperbolic cosine of a number.',
      example: ['`[[cosh(2)]]` => 3.7621956910836314', '`[[cosh(d4)]]` => cosh([3]) = 10.067661995777765'],
    },
  ],
  [
    'acos',
    {
      name: 'Arc Cosine',
      description: 'Returns the inverse/arc cosine (in radians) of a number.',
      example: ['`[[acos(0.5)]]` => 1.0471975511965979', '`[[acos(d4 / 4)]]` => acos([3] / 4) = 0.7227342478134157'],
    },
  ],
  [
    'acosh',
    {
      name: 'Arc Hyperbolic Cosine',
      description: 'Returns the inverse/arc hyperbolic cosine of a number.',
      example: ['`[[acosh(2)]]` => 1.3169578969248166', '`[[acosh(d4)]]` => acosh([3]) = 1.7627471740390859'],
    },
  ],
  [
    'tan',
    {
      name: 'Tangent',
      description: 'Returns the tangent of a number in radians.',
      example: ['`[[tan(2)]]` => -2.185039863261519', '`[[tan(d4)]]` => tan([3]) = -0.1425465430742778'],
    },
  ],
  [
    'tanh',
    {
      name: 'Hyperbolic Tangent',
      description: 'Returns the hyperbolic tangent of a number.',
      example: ['`[[tanh(2)]]` => 0.9640275800758169', '`[[tanh(d4)]]` => tanh([3]) = 0.9950547536867305'],
    },
  ],
  [
    'atan',
    {
      name: 'Arc Tangent',
      description: 'Returns the inverse/arc tangent (in radians) of a number.',
      example: ['`[[atan(2)]]` => 1.1071487177940904', '`[[atan(d4)]]` => atan([3]) = 1.2490457723982544'],
    },
  ],
  [
    'atanh',
    {
      name: 'Arc Hyperbolic Tangent',
      description: 'Returns the inverse/arc hyperbolic tangent of a number.',
      example: ['`[[atanh(0.5)]]` => 0.5493061443340548', '`[[atanh(d4 / 4)]]` => atanh([3] / 4) = 0.9729550745276566'],
    },
  ],
]);

export const LegalMathTrigFuncsHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
