import { RollSet, SolvedStep, SolvedRoll } from "./solver.d.ts";

const MAXLOOPS = 5000000;

const genRoll = (size: number): number => {
	return Math.floor((Math.random() * size) + 1);
};

const compareRolls = (a: RollSet, b: RollSet): number => {
	if (a.roll < b.roll) {
		return -1;
	}
	if (a.roll > b.roll) {
		return 1;
	}
	return 0;
};

const compareOrigidx = (a: RollSet, b: RollSet): number => {
	if (a.origidx < b.origidx) {
		return -1;
	}
	if (a.origidx > b.origidx) {
		return 1;
	}
	return 0;
};

const escapeCharacters = (str: string, esc: string): string => {
	for (let i = 0; i < esc.length; i++) {
		const temprgx = new RegExp(`[${esc[i]}]`, "g");
		str = str.replace(temprgx, ("\\" + esc[i]));
	}
	return str;
};

const roll = (rollStr: string, maximiseRoll: boolean, nominalRoll: boolean): RollSet[] => {
	/* Roll const Capabilities ==>  
	 * Deciphers and rolls a single dice roll set
	 * xdydzracsq!
	 * 
	 * x    [OPT] - number of dice to roll, if omitted, 1 is used
	 * dy   [REQ] - size of dice to roll, d20 = 20 sided die
	 * dz   [OPT] - drops the lowest z dice, cannot be used with kz
	 * kz   [OPT] - keeps the highest z dice, cannot be used with dz
	 * ra   [OPT] - rerolls any rolls that match a, r3 will reroll any dice that land on 3, throwing out old rolls
	 * csq  [OPT] - changes crit score to q, where q can be a single number or a range formatted as q-u
	 * !    [OPT] - exploding, rolls another dy for every crit roll
	 */

	rollStr = rollStr.toLowerCase();

	const dpts = rollStr.split("d");

	const rollConf = {
		dieCount: 0,
		dieSize: 0,
		drop: {
			on: false,
			count: 0
		},
		keep: {
			on: false,
			count: 0
		},
		dropHigh: {
			on: false,
			count: 0
		},
		keepLow: {
			on: false,
			count: 0
		},
		reroll: {
			on: false,
			nums: [0]
		},
		critScore: {
			on: false,
			range: [0]
		},
		critFail: {
			on: false,
			range: [0]
		},
		exploding: false
	};

	if (dpts.length < 2) {
		throw new Error("YouNeedAD");
	}

	const tempDC = dpts.shift();
	rollConf.dieCount = parseInt(tempDC || "1");

	let afterDieIdx = dpts[0].search(/\D/);
	if (afterDieIdx === -1) {
		afterDieIdx = dpts[0].length;
	}

	let remains = dpts.join("");
	rollConf.dieSize = parseInt(remains.slice(0, afterDieIdx));
	remains = remains.slice(afterDieIdx);

	// Finish parsing the roll
	if (remains.length > 0) {
		if (remains.search(/\D/) !== 0 || remains.indexOf("l") === 0 || remains.indexOf("h") === 0) {
			remains = "d" + remains;
		}

		while (remains.length > 0) {
			let afterSepIdx = remains.search(/\d/);
			if (afterSepIdx < 0) {
				afterSepIdx = remains.length;
			}
			const tSep = remains.slice(0, afterSepIdx);
			remains = remains.slice(afterSepIdx);
			let afterNumIdx = remains.search(/\D/);
			if (afterNumIdx < 0) {
				afterNumIdx = remains.length;
			}
			const tNum = parseInt(remains.slice(0, afterNumIdx));

			switch (tSep) {
				case "dl":
				case "d":
					rollConf.drop.on = true;
					rollConf.drop.count = tNum;
					break;
				case "kh":
				case "k":
					rollConf.keep.on = true;
					rollConf.keep.count = tNum;
					break;
				case "dh":
					rollConf.dropHigh.on = true;
					rollConf.dropHigh.count = tNum;
					break;
				case "kl":
					rollConf.keepLow.on = true;
					rollConf.keepLow.count = tNum;
					break;
				case "r":
					rollConf.reroll.on = true;
					rollConf.reroll.nums.push(tNum);
					break;
				case "cs":
				case "cs=":
					rollConf.critScore.on = true;
					rollConf.critScore.range.push(tNum);
					break;
				case "cs>":
					rollConf.critScore.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						rollConf.critScore.range.push(i);
					}
					break;
				case "cs<":
					rollConf.critScore.on = true;
					for (let i = 0; i <= tNum; i++) {
						rollConf.critScore.range.push(i);
					}
					break;
				case "cf":
				case "cf=":
					rollConf.critFail.on = true;
					rollConf.critFail.range.push(tNum);
					break;
				case "cf>":
					rollConf.critFail.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						rollConf.critFail.range.push(i);
					}
					break;
				case "cf<":
					rollConf.critFail.on = true;
					for (let i = 0; i <= tNum; i++) {
						rollConf.critFail.range.push(i);
					}
					break;
				case "!":
					rollConf.exploding = true;
					afterNumIdx = 1;
					break;
				default:
					throw new Error("UnknownOperation_" + tSep);
			}
			remains = remains.slice(afterNumIdx);
		}
	}

	// Verify the parse
	if (rollConf.dieCount < 0) {
		throw new Error("NoZerosAllowed_base");
	}
	if (rollConf.dieCount === 0 || rollConf.dieSize === 0) {
		throw new Error("NoZerosAllowed_base");
	}
	let dkdkCnt = 0;
	[rollConf.drop.on, rollConf.keep.on, rollConf.dropHigh.on, rollConf.keepLow.on].forEach(e => {
		if (e) {
			dkdkCnt++;
		}
	});
	if (dkdkCnt > 1) {
		throw new Error("FormattingError_dk");
	}
	if (rollConf.drop.on && rollConf.drop.count === 0) {
		throw new Error("NoZerosAllowed_drop");
	}
	if (rollConf.keep.on && rollConf.keep.count === 0) {
		throw new Error("NoZerosAllowed_keep");
	}
	if (rollConf.dropHigh.on && rollConf.dropHigh.count === 0) {
		throw new Error("NoZerosAllowed_dropHigh");
	}
	if (rollConf.keepLow.on && rollConf.keepLow.count === 0) {
		throw new Error("NoZerosAllowed_keepLow");
	}
	if (rollConf.reroll.on && rollConf.reroll.nums.indexOf(0) >= 0) {
		throw new Error("NoZerosAllowed_reroll");
	}

	// Roll the roll
	const rollSet = [];
	/* Roll will contain objects of the following format:
	 * 	{
	 *	 	origidx: 0,
	 *		roll: 0,
	 *		dropped: false,
	 * 		rerolled: false,
	 * 		exploding: false,
	 * 		critHit: false,
	 * 		critFail: false
	 * 	}
	 * 
	 * Each of these is defined as following:
	 * 	{
	 * 		origidx: The original index of the roll
	 *		roll: The resulting roll on this die in the set
	 *		dropped: This die is to be dropped as it was one of the dy lowest dice
	 * 		rerolled: This die has been rerolled as it matched rz, it is replaced by the very next die in the set
	 * 		exploding: This die was rolled as the previous die exploded (was a crit hit)
	 * 		critHit: This die matched csq[-u], max die value used if cs not used
	 * 		critFail: This die rolled a nat 1, a critical failure
	 * 	}
	 */

	const templateRoll = {
		origidx: 0,
		roll: 0,
		dropped: false,
		rerolled: false,
		exploding: false,
		critHit: false,
		critFail: false
	};

	let loopCount = 0;

	for (let i = 0; i < rollConf.dieCount; i++) {
		if (loopCount > MAXLOOPS) {
			throw new Error("MaxLoopsExceeded");
		}

		const rolling = JSON.parse(JSON.stringify(templateRoll));
		rolling.roll = maximiseRoll ? rollConf.dieSize : (nominalRoll ? ((rollConf.dieSize / 2) + 0.5) : genRoll(rollConf.dieSize));

		if (rollConf.critScore.on && rollConf.critScore.range.indexOf(rolling.roll) >= 0) {
			rolling.critHit = true;
		} else if (!rollConf.critScore.on) {
			rolling.critHit = (rolling.roll === rollConf.dieSize);
		}
		if (rollConf.critFail.on && rollConf.critFail.range.indexOf(rolling.roll) >= 0) {
			rolling.critFail = true;
		} else if (!rollConf.critFail.on) {
			rolling.critFail = (rolling.roll === 1);
		}

		rollSet.push(rolling);
		loopCount++;
	}

	if (rollConf.reroll.on || rollConf.exploding) {
		for (let i = 0; i < rollSet.length; i++) {
			if (loopCount > MAXLOOPS) {
				throw new Error("MaxLoopsExceeded");
			}

			if (rollConf.reroll.on && rollConf.reroll.nums.indexOf(rollSet[i].roll) >= 0) {
				rollSet[i].rerolled = true;

				const newRoll = JSON.parse(JSON.stringify(templateRoll));
				newRoll.roll = maximiseRoll ? rollConf.dieSize : (nominalRoll ? ((rollConf.dieSize / 2) + 0.5) : genRoll(rollConf.dieSize));

				if (rollConf.critScore.on && rollConf.critScore.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critHit = true;
				} else if (!rollConf.critScore.on) {
					newRoll.critHit = (newRoll.roll === rollConf.dieSize);
				}
				if (rollConf.critFail.on && rollConf.critFail.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critFail = true;
				} else if (!rollConf.critFail.on) {
					newRoll.critFail = (newRoll.roll === 1);
				}

				rollSet.splice(i + 1, 0, newRoll);
			} else if (rollConf.exploding && !rollSet[i].rerolled && rollSet[i].critHit) {
				const newRoll = JSON.parse(JSON.stringify(templateRoll));
				newRoll.roll = maximiseRoll ? rollConf.dieSize : (nominalRoll ? ((rollConf.dieSize / 2) + 0.5) : genRoll(rollConf.dieSize));
				newRoll.exploding = true;

				if (rollConf.critScore.on && rollConf.critScore.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critHit = true;
				} else if (!rollConf.critScore.on) {
					newRoll.critHit = (newRoll.roll === rollConf.dieSize);
				}
				if (rollConf.critFail.on && rollConf.critFail.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critFail = true;
				} else if (!rollConf.critFail.on) {
					newRoll.critFail = (newRoll.roll === 1);
				}

				rollSet.splice(i + 1, 0, newRoll);
			}

			loopCount++;
		}
	}

	let rerollCount = 0;
	for (let i = 0; i < rollSet.length; i++) {
		rollSet[i].origidx = i;

		if (rollSet[i].rerolled) {
			rerollCount++;
		}
	}

	if (rollConf.drop.on || rollConf.keep.on || rollConf.dropHigh.on || rollConf.keepLow.on) {
		rollSet.sort(compareRolls);

		let dropCount = 0;
		const validRolls = rollSet.length - rerollCount;

		if (rollConf.drop.on) {
			dropCount = rollConf.drop.count;
			if (dropCount > validRolls) {
				dropCount = validRolls;
			}
		}

		if (rollConf.keep.on) {
			dropCount = validRolls - rollConf.keep.count;
			if (dropCount < 0) {
				dropCount = 0;
			}
		}

		if (rollConf.dropHigh.on) {
			rollSet.reverse();
			dropCount = rollConf.dropHigh.count;
			if (dropCount > validRolls) {
				dropCount = validRolls;
			}
		}

		if (rollConf.keepLow.on) {
			rollSet.reverse();
			dropCount = validRolls - rollConf.keepLow.count;
			if (dropCount < 0) {
				dropCount = 0;
			}
		}

		let i = 0;
		while (dropCount > 0 && i < rollSet.length) {
			if (!rollSet[i].rerolled) {
				rollSet[i].dropped = true;
				dropCount--;
			}
			i++;
		}

		rollSet.sort(compareOrigidx);
	}

	return rollSet;
};

const formatRoll = (rollConf: string, maximiseRoll: boolean, nominalRoll: boolean): SolvedStep => {
	let tempTotal = 0;
	let tempDetails = "[";
	let tempCrit = false;
	let tempFail = false;

	const tempRollSet = roll(rollConf, maximiseRoll, nominalRoll);
	tempRollSet.forEach(e => {
		let preFormat = "";
		let postFormat = "";

		if (!e.dropped && !e.rerolled) {
			tempTotal += e.roll;
			if (e.critHit) {
				tempCrit = true;
			}
			if (e.critFail) {
				tempFail = true;
			}
		}
		if (e.critHit) {
			preFormat = "**" + preFormat;
			postFormat = postFormat + "**";
		}
		if (e.critFail) {
			preFormat = "__" + preFormat;
			postFormat = postFormat + "__";
		}
		if (e.dropped || e.rerolled) {
			preFormat = "~~" + preFormat;
			postFormat = postFormat + "~~";
		}

		tempDetails += preFormat + e.roll + postFormat + " + ";
	});
	tempDetails = tempDetails.substr(0, (tempDetails.length - 3));
	tempDetails += "]";

	return {
		total: tempTotal,
		details: tempDetails,
		containsCrit: tempCrit,
		containsFail: tempFail
	};
};

const fullSolver = (conf: (string | number | SolvedStep)[], wrapDetails: boolean): SolvedStep => {
	const signs = ["^", "*", "/", "%", "+", "-"];
	const stepSolve = {
		total: 0,
		details: "",
		containsCrit: false,
		containsFail: false
	};

	let singleNum = false;
	if (conf.length === 1) {
		singleNum = true;
	}

	// Evaluate all parenthesis
	while (conf.indexOf("(") > -1) {
		const openParen = conf.indexOf("(");
		let closeParen = -1;
		let nextParen = 0;

		for (let i = openParen; i < conf.length; i++) {
			if (conf[i] === "(") {
				nextParen++;
			} else if (conf[i] === ")") {
				nextParen--;
			}

			if (nextParen === 0) {
				closeParen = i;
				break;
			}
		}

		if (closeParen === -1 || closeParen < openParen) {
			throw new Error("UnbalancedParens");
		}

		conf.splice(openParen, closeParen, fullSolver(conf.slice((openParen + 1), closeParen), true));
		let insertedMult = false;
		if (((openParen - 1) > -1) && (signs.indexOf(conf[openParen - 1].toString()) === -1)) {
			insertedMult = true;
			conf.splice(openParen, 0, "*");
		}
		if (!insertedMult && (((openParen + 1) < conf.length) && (signs.indexOf(conf[openParen + 1].toString()) === -1))) {
			conf.splice((openParen + 1), 0, "*");
		} else if (insertedMult && (((openParen + 2) < conf.length) && (signs.indexOf(conf[openParen + 2].toString()) === -1))) {
			conf.splice((openParen + 2), 0, "*");
		}
	}

	// Evaluate all EMMDAS
	const allCurOps = [["^"], ["*", "/", "%"], ["+", "-"]];
	allCurOps.forEach(curOps => {
		for (let i = 0; i < conf.length; i++) {
			if (curOps.indexOf(conf[i].toString()) > -1) {
				const operand1 = conf[i - 1];
				const operand2 = conf[i + 1];
				let oper1 = NaN;
				let oper2 = NaN;
				const subStepSolve = {
					total: NaN,
					details: "",
					containsCrit: false,
					containsFail: false
				};

				if (typeof operand1 === "object") {
					oper1 = operand1.total;
					subStepSolve.details = operand1.details + "\\" + conf[i];
					subStepSolve.containsCrit = operand1.containsCrit;
					subStepSolve.containsFail = operand1.containsFail;
				} else {
					oper1 = parseFloat(operand1.toString());
					subStepSolve.details = oper1.toString() + conf[i];
				}

				if (typeof operand2 === "object") {
					oper2 = operand2.total;
					subStepSolve.details += operand2.details;
					subStepSolve.containsCrit = subStepSolve.containsCrit || operand2.containsCrit;
					subStepSolve.containsFail = subStepSolve.containsFail || operand2.containsFail;
				} else {
					oper2 = parseFloat(operand2.toString());
					subStepSolve.details += oper2;
				}

				if (isNaN(oper1) || isNaN(oper2)) {
					throw new Error("OperandNaN");
				}

				if ((typeof oper1 === "number") && (typeof oper2 === "number")) {
					switch (conf[i]) {
						case "^":
							subStepSolve.total = Math.pow(oper1, oper2);
							break;
						case "*":
							subStepSolve.total = oper1 * oper2;
							break;
						case "/":
							subStepSolve.total = oper1 / oper2;
							break;
						case "%":
							subStepSolve.total = oper1 % oper2;
							break;
						case "+":
							subStepSolve.total = oper1 + oper2;
							break;
						case "-":
							subStepSolve.total = oper1 - oper2;
							break;
						default:
							throw new Error("OperatorWhat");
					}
				} else {
					throw new Error("EMDASNotNumber");
				}

				conf.splice((i - 1), (i + 2), subStepSolve);
				i--;
			}
		}
	});

	if (conf.length > 1) {
		throw new Error("ConfWhat");
	} else if (singleNum && (typeof (conf[0]) === "number")) {
		stepSolve.total = conf[0];
		stepSolve.details = conf[0].toString();
	} else {
		stepSolve.total = (<SolvedStep>conf[0]).total;
		stepSolve.details = (<SolvedStep>conf[0]).details;
		stepSolve.containsCrit = (<SolvedStep>conf[0]).containsCrit;
		stepSolve.containsFail = (<SolvedStep>conf[0]).containsFail;
	}

	if (wrapDetails) {
		stepSolve.details = "(" + stepSolve.details + ")";
	}

	if (stepSolve.total === undefined) {
		throw new Error("UndefinedStep");
	}

	return stepSolve;
};

const parseRoll = (fullCmd: string, localPrefix: string, localPostfix: string, maximiseRoll: boolean, nominalRoll: boolean): SolvedRoll => {
	const returnmsg = {
		error: false,
		errorMsg: "",
		line1: "",
		line2: "",
		line3: ""
	};

	try {
		const sepRolls = fullCmd.split(localPrefix);

		const tempReturnData = [];

		for (let i = 0; i < sepRolls.length; i++) {
			const [tempConf, tempFormat] = sepRolls[i].split(localPostfix);

			const mathConf: (string | number | SolvedStep)[] = <(string | number | SolvedStep)[]>tempConf.replace(/ /g, "").split(/([-+()*/%^])/g);

			let parenCnt = 0;
			mathConf.forEach(e => {
				if (e === "(") {
					parenCnt++;
				} else if (e === ")") {
					parenCnt--;
				}
			});

			if (parenCnt !== 0) {
				throw new Error("UnbalancedParens");
			}

			// Evaluate all rolls into stepSolve format and all numbers into floats
			for (let i = 0; i < mathConf.length; i++) {
				if (mathConf[i].toString().length === 0) {
					mathConf.splice(i, 1);
					i--;
				} else if (mathConf[i] == parseFloat(mathConf[i].toString())) {
					mathConf[i] = parseFloat(mathConf[i].toString());
				} else if (/([0123456789])/g.test(mathConf[i].toString())) {
					mathConf[i] = formatRoll(mathConf[i].toString(), maximiseRoll, nominalRoll);
				}
			}

			const tempSolved = fullSolver(mathConf, false);

			tempReturnData.push({
				rollTotal: tempSolved.total,
				rollPostFormat: tempFormat,
				rollDetails: tempSolved.details,
				containsCrit: tempSolved.containsCrit,
				containsFail: tempSolved.containsFail,
				initConfig: tempConf
			});
		}

		if (fullCmd[fullCmd.length - 1] === " ") {
			fullCmd = escapeCharacters(fullCmd.substr(0, (fullCmd.length - 1)), "|");
		}

		let line1 = "";
		let line2 = "";
		let line3 = "";

		if (maximiseRoll) {
			line1 = " requested the theoretical maximum of: `[[" + fullCmd + "`";
			line2 = "Theoretical Maximum Results: ";
		} else if (nominalRoll) {
			line1 = " requested the theoretical nominal of: `[[" + fullCmd + "`";
			line2 = "Theoretical Nominal Results: ";
		} else {
			line1 = " rolled: `[[" + fullCmd + "`";
			line2 = "Results: ";
		}

		tempReturnData.forEach(e => {
			let preFormat = "";
			let postFormat = "";
			if (e.containsCrit) {
				preFormat = "**" + preFormat;
				postFormat = postFormat + "**";
			}
			if (e.containsFail) {
				preFormat = "__" + preFormat;
				postFormat = postFormat + "__";
			}

			line2 += preFormat + e.rollTotal + postFormat + escapeCharacters(e.rollPostFormat, "|*_~`");

			line3 += "`" + e.initConfig + "` = " + e.rollDetails + " = " + preFormat + e.rollTotal + postFormat + "\n";
		});

		returnmsg.line1 = line1;
		returnmsg.line2 = line2;
		returnmsg.line3 = line3;

	} catch (solverError) {
		const [errorName, errorDetails] = solverError.message.split("_");

		let errorMsg = "";
		switch (errorName) {
			case "YouNeedAD":
				errorMsg = "Formatting Error: Missing die size and count config";
				break;
			case "FormattingError":
				errorMsg = "Formatting Error: Cannot use Keep and Drop at the same time, remove all but one and repeat roll";
				break;
			case "NoMaxWithDash":
				errorMsg = "Formatting Error: CritScore range specified without a maximum, remove - or add maximum to correct";
				break;
			case "UnknownOperation":
				errorMsg = "Error: Unknown Operation " + errorDetails;
				if (errorDetails === "-") {
					errorMsg += "\nNote: Negative numbers are not supported";
				} else if (errorDetails === " ") {
					errorMsg += "\nNote: Every roll must be closed by " + localPostfix;
				}
				break;
			case "NoZerosAllowed":
				errorMsg = "Formatting Error: ";
				switch (errorDetails) {
					case "base":
						errorMsg += "Die Size and Die Count";
						break;
					case "drop":
						errorMsg += "Drop (d or dl)";
						break;
					case "keep":
						errorMsg += "Keep (k or kh)";
						break;
					case "dropHigh":
						errorMsg += "Drop Highest (dh)";
						break;
					case "keepLow":
						errorMsg += "Keep Lowest (kl)";
						break;
					case "reroll":
						errorMsg += "Reroll (r)";
						break;
					case "critScore":
						errorMsg += "Crit Score (cs)";
						break;
					default:
						errorMsg += "Unhandled - " + errorDetails;
						break;
				}
				errorMsg += " cannot be zero";
				break;
			case "CritScoreMinGtrMax":
				errorMsg = "Formatting Error: CritScore maximum cannot be greater than minimum, check formatting and flip min/max";
				break;
			case "MaxLoopsExceeded":
				errorMsg = "Error: Roll is too complex or reaches infinity";
				break;
			case "UnbalancedParens":
				errorMsg = "Formatting Error: At least one of the equations contains unbalanced parenthesis";
				break;
			case "EMDASNotNumber":
				errorMsg = "Error: One or more operands is not a number";
				break;
			case "ConfWhat":
				errorMsg = "Error: Not all values got processed, please report the command used";
				break;
			case "OperatorWhat":
				errorMsg = "Error: Something really broke with the Operator, try again";
				break;
			case "OperandNaN":
				errorMsg = "Error: One or more operands reached NaN, check input";
				break;
			case "UndefinedStep":
				errorMsg = "Error: Roll became undefined, one ore more operands are not a roll or a number, check input";
				break;
			default:
				console.error(errorName, errorDetails);
				errorMsg = "Unhandled Error: " + solverError.message;
				break;
		}

		returnmsg.error = true;
		returnmsg.errorMsg = errorMsg;
	}

	return returnmsg;
};

export default { parseRoll };