import { STATUS_CODE, STATUS_TEXT } from '@std/http';

export const heatmapPng = (): Response => {
  const file = Deno.readFileSync('./src/endpoints/gets/heatmap.png');
  const headers = new Headers();
  headers.append('Content-Type', 'image/png');
  // Send basic OK to indicate key has been sent
  return new Response(file, {
    status: STATUS_CODE.OK,
    statusText: STATUS_TEXT[STATUS_CODE.OK],
    headers,
  });
};
