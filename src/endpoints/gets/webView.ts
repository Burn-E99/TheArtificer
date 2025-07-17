import { DiscordenoMember, getChannel, getMember, getMessage, getRoles } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';
import showdown from '@showdown';
import { STATUS_CODE, STATUS_TEXT } from '@std/http/status';

import config from '~config';

import { disabledStr } from 'artigen/utils/embeds.ts';

import utils from 'utils/utils.ts';

// globalName is added with discord's new username system
interface ModernMemberHOTFIX extends DiscordenoMember {
  globalName: string;
}

const converter = new showdown.Converter({
  emoji: true,
  underline: true,
});

// Utilize the pre-existing stylesheets, do a little tweaking to make it ours
const wrapBasic = (str: string) =>
  `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>The Artificer Roll Web View</title>
<meta name="distribution" content="web">
<meta name="web_author" content="Ean Milligan (ean@milligan.dev)">
<meta name="author" content="Ean Milligan (ean@milligan.dev)">
<meta name="designer" content="Ean Milligan (ean@milligan.dev)">
<meta name="publisher" content="Ean Milligan (ean@milligan.dev)">
<meta name="robots" content="noindex, nofollow">
<link rel="shortcut icon" href="https://discord.burne99.com/TheArtificer/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@100..900&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cinzel|Play">
<link rel="stylesheet" href="https://discord.burne99.com/TheArtificer/theme.css">
<link rel="stylesheet" href="https://discord.burne99.com/TheArtificer/main.css">
<style>
p {
margin: 0;
}
button {
font-family: 'Play', sans-serif;
height: 2.5rem;
cursor: pointer;
color: var(--header-font-color);
background-color: var(--footer-bg-color);
border: 2px solid var(--slug-bg);
border-radius: 8px;
}
button:hover {
background-color: var(--code-bg);
}
.selected {
background-color: var(--page-bg-color);
}
strong {
font-weight: 900;
}
</style>
</head>
<body id="page">
${str}
</body>
</html>`;
const centerHTML = (str: string) => `<center>${str}</center>`;

const badRequestMD = '# Invalid URL for Web View!';
const badRequestHTML = wrapBasic(centerHTML(converter.makeHtml(badRequestMD)));

const notAuthorizedMD = '# Web View is Disabled for this roll!';
const notAuthorizedHTML = wrapBasic(centerHTML(converter.makeHtml(notAuthorizedMD)));

const failedToGetAttachmentMD = '# Failed to get attachment from Discord!';
const failedToGetAttachmentHTML = wrapBasic(centerHTML(converter.makeHtml(failedToGetAttachmentMD)));

interface HtmlResp {
  name: string;
  html: string;
}

const headerHeight = '3rem';
const generatePage = (files: HtmlResp[]): string =>
  wrapBasic(`<header id="fileBtns" style="display: flex; align-items: center; height: ${headerHeight}; line-height: ${headerHeight}; font-size: 1.5rem;">
<a href="https://discord.burne99.com/TheArtificer/" target="_blank" rel="noopener">${config.name} Roll Web View</a>
<span style="margin-left: auto; font-family: 'Play', sans-serif; font-size: 1rem;">Available Files:</span>
${
    files
      .map(
        (f, idx) =>
          `<button style="margin-left: 1rem;" id="${f.name}-btn" class="${
            idx === 0 ? 'selected' : ''
          }" onclick="for (var child of document.getElementById('fileBody').children) {child.style.display = 'none'} document.getElementById('${f.name}').style.display = 'block'; for (var child of document.getElementById('fileBtns').children) {child.className = ''} document.getElementById('${f.name}-btn').className = 'selected';">${f.name}</button>`,
      )
      .join('')
  }
<button style="margin-left: auto;" onclick="document.getElementById('fileBody').style.whiteSpace = (document.getElementById('fileBody').style.whiteSpace === 'pre' ? 'pre-wrap' : 'pre')">Toggle Word Wrap</button>
</header>
<div id="fileBody" style="height: calc(100vh - ${headerHeight}); margin: 0 0.5rem; overflow: auto; white-space: pre-wrap; font-family: 'Roboto', sans-serif; font-weight: 300;">
${files.map((f, idx) => `<div id="${f.name}" style="display: ${idx === 0 ? 'block' : 'none'};">${f.html}</div>`).join('')}
</div>`);

const colorShade = (col: string, amt: number) => {
  col = col.replace(/^#/, '');
  if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];

  const parts = col.match(/.{2}/g) ?? [];
  let r = parts.shift() ?? '00';
  let g = parts.shift() ?? '00';
  let b = parts.shift() ?? '00';
  const [rInt, gInt, bInt] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt];

  r = Math.max(Math.min(255, rInt), 0).toString(16);
  g = Math.max(Math.min(255, gInt), 0).toString(16);
  b = Math.max(Math.min(255, bInt), 0).toString(16);

  const rr = (r.length < 2 ? '0' : '') + r;
  const gg = (g.length < 2 ? '0' : '') + g;
  const bb = (b.length < 2 ? '0' : '') + b;

  return `#${rr}${gg}${bb}`;
};

const makeMention = (mentionType: string, name: string, backgroundColor: string, color = 'var(--page-font-color)') =>
  `<span style="background-color: ${backgroundColor}; color: ${color}; padding: 2px 4px; border-radius: 4px;">${mentionType}${name}</span>`;

export const generateWebView = async (query: Map<string, string>): Promise<Response> => {
  const headers = new Headers();
  headers.append('Content-Type', 'text/html');

  const messageId = BigInt(query.get('m') ?? '0');
  const channelId = BigInt(query.get('c') ?? '0');

  if (!messageId || !channelId) {
    return new Response(badRequestHTML, {
      status: STATUS_CODE.BadRequest,
      statusText: STATUS_TEXT[STATUS_CODE.BadRequest],
      headers,
    });
  }

  const attachmentMessage = await getMessage(channelId, messageId).catch((e) => utils.commonLoggers.messageGetError('webView.ts:23', channelId, messageId, e));
  const discordAttachments = attachmentMessage?.attachments ?? [];
  const embed = attachmentMessage?.embeds.shift();
  const webViewField = embed?.fields?.shift();

  if (!attachmentMessage || discordAttachments.length === 0 || !embed || !webViewField) {
    return new Response(badRequestHTML, {
      status: STATUS_CODE.BadRequest,
      statusText: STATUS_TEXT[STATUS_CODE.BadRequest],
      headers,
    });
  }

  if (webViewField.value.includes(disabledStr)) {
    return new Response(notAuthorizedHTML, {
      status: STATUS_CODE.Forbidden,
      statusText: STATUS_TEXT[STATUS_CODE.Forbidden],
      headers,
    });
  }

  const htmlArr: HtmlResp[] = [];
  for (const discordAttachment of discordAttachments) {
    const attachment = await fetch(discordAttachment.url).catch((e) => log(LT.LOG, `Failed to get attachment: ${discordAttachment}`, e));
    const bodyText = (await attachment?.text()) ?? '';

    htmlArr.push({
      name: discordAttachment.filename,
      html: bodyText ? converter.makeHtml(bodyText) : failedToGetAttachmentHTML,
    });
  }

  let fullPage = generatePage(htmlArr);

  if (fullPage.indexOf('<@&')) {
    const guildRoles = (await getRoles(attachmentMessage.guildId).catch((e) => log(LT.LOG, `Failed to get Guild Roles: ${attachmentMessage.guildId}`, e))) ?? [];
    const rolesToReplace = fullPage.matchAll(/<@&(\d+)>/g);
    for (const roleToReplace of rolesToReplace) {
      const role = guildRoles.filter((r) => r.id === BigInt(roleToReplace[1] ?? '-1')).shift() ?? { name: 'unknown-role', color: 4211819 };
      fullPage = fullPage.replaceAll(
        roleToReplace[0],
        makeMention('@', role.name, colorShade(`#${role.color.toString(16)}`, -100), colorShade(`#${role.color.toString(16)}`, 50)),
      );
    }
  }

  if (fullPage.indexOf('<#')) {
    const channelsToReplace = fullPage.matchAll(/<#(\d+)>/g);
    for (const channelToReplace of channelsToReplace) {
      const channel = (await getChannel(BigInt(channelToReplace[1] ?? '-1')).catch((e) => log(LT.LOG, `Failed to get Channel: ${channelToReplace[1]}`, e))) ?? {
        name: 'unknown',
      };
      fullPage = fullPage.replaceAll(channelToReplace[0], makeMention('#', channel.name ?? 'unknown', '#40446b'));
    }
  }

  if (fullPage.indexOf('<@')) {
    const usersToReplace = fullPage.matchAll(/<@(\d+)>/g);
    for (const userToReplace of usersToReplace) {
      const rawUser = await getMember(attachmentMessage.guildId, BigInt(userToReplace[1] ?? '-1')).catch((e) => log(LT.LOG, `Failed to get Channel: ${userToReplace[1]}`, e));
      const user = rawUser ? (rawUser as ModernMemberHOTFIX) : {
        name: (_gId: bigint) => 'unknown-user',
        username: 'unknown-user',
        globalName: 'unknown-user',
      };
      const nickName = user.name(attachmentMessage.guildId);
      const name = nickName === user.username ? user.globalName : nickName ?? user.globalName;
      fullPage = fullPage.replaceAll(userToReplace[0], makeMention('@', name ?? user.username, '#40446b'));
    }
  }

  return new Response(fullPage, {
    status: STATUS_CODE.OK,
    statusText: STATUS_TEXT[STATUS_CODE.OK],
    headers,
  });
};
