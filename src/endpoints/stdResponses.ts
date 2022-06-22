import {
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../deps.ts';

const genericResponse = (customText: string, status: Status) => new Response(customText || STATUS_TEXT.get(status), { status: status, statusText: STATUS_TEXT.get(status) });

export default {
	BadRequest: (customText: string) => genericResponse(customText, Status.BadRequest),
	FailedDependency: (customText: string) => genericResponse(customText, Status.FailedDependency),
	InternalServerError: (customText: string) => genericResponse(customText, Status.InternalServerError),
	Forbidden: (customText: string) => genericResponse(customText, Status.Forbidden),
	MethodNotAllowed: (customText: string) => genericResponse(customText, Status.MethodNotAllowed),
	NotFound: (customText: string) => genericResponse(customText, Status.NotFound),
	OK: (customText: string) => genericResponse(customText, Status.OK),
	RequestTimeout: (customText: string) => genericResponse(customText, Status.RequestTimeout),
	TooManyRequests: (customText: string) => genericResponse(customText, Status.TooManyRequests),
};
