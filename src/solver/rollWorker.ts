import { parseRoll } from './parser.ts';

self.onmessage = async (e: any) => {
	const payload = e.data;
	const returnmsg = parseRoll(payload.rollCmd, payload.modifiers) || {
		error: true,
		errorCode: 'EmptyMessage',
		errorMsg: 'Error: Empty message',
		line1: '',
		line2: '',
		line3: '',
		counts: {
			total: 0,
			successful: 0,
			failed: 0,
			rerolled: 0,
			dropped: 0,
			exploded: 0,
		},
	};
	self.postMessage(returnmsg);
	self.close();
};
