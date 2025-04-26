import {
  // httpd deps
  STATUS_CODE,
  STATUS_TEXT,
} from '../../../deps.ts';

export const heatmapPng = async (requestEvent: Deno.RequestEvent) => {
  const file = Deno.readFileSync('./src/endpoints/gets/heatmap.png');
  const imageHeaders = new Headers();
  imageHeaders.append('Content-Type', 'image/png');
  // Send basic OK to indicate key has been sent
  requestEvent.respondWith(
    new Response(file, {
      status: STATUS_CODE.OK,
      statusText: STATUS_TEXT[STATUS_CODE.OK],
      headers: imageHeaders,
    }),
  );
};
