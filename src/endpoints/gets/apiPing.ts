import { STATUS_CODE, STATUS_TEXT } from '@std/http/status';

export const apiPing = (): Response => {
  const headers = new Headers();
  headers.append('Content-Type', 'text/json');
  return new Response(
    JSON.stringify({
      timestamp: new Date(),
    }),
    {
      status: STATUS_CODE.OK,
      statusText: STATUS_TEXT[STATUS_CODE.OK],
      headers,
    },
  );
};
