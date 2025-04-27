import {
  STATUS_CODE,
  STATUS_TEXT,
  // httpd deps
  StatusCode,
} from '../../deps.ts';

const genericResponse = (customText: string, status: StatusCode) => new Response(customText || STATUS_TEXT[status], { status: status, statusText: STATUS_TEXT[status] });

export default {
  BadRequest: (customText: string) => genericResponse(customText, STATUS_CODE.BadRequest),
  FailedDependency: (customText: string) => genericResponse(customText, STATUS_CODE.FailedDependency),
  InternalServerError: (customText: string) => genericResponse(customText, STATUS_CODE.InternalServerError),
  Forbidden: (customText: string) => genericResponse(customText, STATUS_CODE.Forbidden),
  MethodNotAllowed: (customText: string) => genericResponse(customText, STATUS_CODE.MethodNotAllowed),
  NotFound: (customText: string) => genericResponse(customText, STATUS_CODE.NotFound),
  OK: (customText: string) => genericResponse(customText, STATUS_CODE.OK),
  RequestTimeout: (customText: string) => genericResponse(customText, STATUS_CODE.RequestTimeout),
  TooManyRequests: (customText: string) => genericResponse(customText, STATUS_CODE.TooManyRequests),
  Strings: {
    missingParams: 'Missing Parameters.',
    restricted: 'This API is restricted.',
  },
};
