import {
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';

export const heatmapPng = async (requestEvent: Deno.RequestEvent) => {
	const file = Deno.readFileSync('./src/endpoints/gets/heatmap.png');
	const imageHeaders = new Headers();
	imageHeaders.append('Content-Type', 'image/png');
	// Send basic OK to indicate key has been sent
	requestEvent.respondWith(
		new Response(file, {
			status: Status.OK,
			statusText: STATUS_TEXT[Status.OK],
			headers: imageHeaders,
		}),
	);
};
