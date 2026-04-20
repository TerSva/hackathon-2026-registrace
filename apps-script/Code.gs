const SHEET_ID        = '1TvRRFUQ7umPuCCSigqbrJgr4kHLk4ZcqLfoDPb619yE';
const SHEET_NAME      = 'Registrace';
const ORGANIZER_EMAIL = 'svanda@praut.cz';
const SENDER_NAME     = 'AI & Programming Hackathon 2026';
const WEB_APP_URL     = 'https://script.google.com/macros/s/AKfycbw0I14fgua_wpOQbsnE8Su-QK2Oh3U1gRh-fAqp41oA7sCMjDsYW17XK5YCLQmbZA-kYQ/exec';
const PUBLIC_BASE_URL = 'https://tersva.github.io/hackathon-2026-registrace';

const COL = {
    TIMESTAMP: 1, FIRST_NAME: 2, LAST_NAME: 3, EMAIL: 4, PHONE: 5, BIRTH_YEAR: 6,
    GITHUB: 7, ROLE: 8, COMPANY: 9, TEAM_NAME: 10, TEAM_SIZE: 11,
    CONSENT_GDPR: 12, CONSENT_NEWSLETTER: 13, CODE: 14,
    TEAM_ID: 15, TEAM_ROLE: 16, STATUS: 17, TOKEN: 18
};

function doGet(e) {
    const action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'teams') {
        return jsonResponse({ ok: true, teams: listJoinableTeams() });
    }
    if (action === 'confirm' || action === 'reject') {
        const newStatus = (action === 'confirm') ? 'confirmed' : 'rejected';
        return jsonResponse(processConfirmation(e.parameter.token, newStatus));
    }
    return jsonResponse({ ok: true, message: 'Hackathon registration webhook is alive.' });
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        if (data.type === 'create_team') {
            return createTeamRegistration(data);
        }
        if (data.type === 'join_team') {
            return joinTeamRegistration(data);
        }
        return jsonResponse({ ok: false, error: 'Unknown type' });
    } catch (err) {
        console.error(err);
        return jsonResponse({ ok: false, error: err.toString() });
    }
}

function listJoinableTeams() {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const teamsMap = {};

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const teamId = row[COL.TEAM_ID - 1];
        const teamRole = row[COL.TEAM_ROLE - 1];
        const status = row[COL.STATUS - 1];

        if (!teamId || status === 'rejected') continue;

        if (!teamsMap[teamId]) {
            teamsMap[teamId] = { id: teamId, name: '', size: 0, memberCount: 0, leaderFirstName: '' };
        }
        const team = teamsMap[teamId];
        team.memberCount++;

        if (teamRole === 'leader') {
            team.name = row[COL.TEAM_NAME - 1];
            team.size = Number(row[COL.TEAM_SIZE - 1]);
            team.leaderFirstName = row[COL.FIRST_NAME - 1];
        }
    }

    const teams = [];
    for (const id in teamsMap) {
        const t = teamsMap[id];
        if (!t.name) continue;
        if (t.size <= 1) continue;
        if (t.memberCount >= t.size) continue;
        teams.push({
            id: t.id,
            name: t.name,
            slotsLeft: t.size - t.memberCount,
            leaderFirstName: t.leaderFirstName
        });
    }
    teams.sort(function(a, b) { return a.name.localeCompare(b.name, 'cs'); });
    return teams;
}

function createTeamRegistration(data) {
    if (!data.firstName || !data.lastName || !data.email || !data.role
        || !data.teamSize || !data.teamName || !data.consentGdpr) {
        return jsonResponse({ ok: false, error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return jsonResponse({ ok: false, error: 'Invalid email' });
    }
    const teamId = makeTeamId(data.teamName);
    if (!teamId) {
        return jsonResponse({ ok: false, error: 'Neplatný název týmu' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        if (!sheet) return jsonResponse({ ok: false, error: 'Sheet not found, run initSheet first.' });

        if (findLeaderRow(sheet, teamId)) {
            return jsonResponse({ ok: false, error: 'Tento název týmu už existuje. Zvol jiný.' });
        }

        const code = generateCode();
        const token = Utilities.getUuid();
        const timestamp = new Date();

        sheet.appendRow([
            timestamp,
            data.firstName, data.lastName, data.email,
            data.phone || '', data.birthYear || '', data.github || '',
            data.role, data.company || '',
            data.teamName, data.teamSize,
            data.consentGdpr ? 'ANO' : 'NE',
            data.consentNewsletter ? 'ANO' : 'NE',
            code, teamId, 'leader', 'confirmed', token
        ]);

        sendLeaderWelcomeEmail(data, code);
        return jsonResponse({ ok: true, mode: 'leader', code: code });
    } finally {
        lock.releaseLock();
    }
}

function joinTeamRegistration(data) {
    if (!data.firstName || !data.lastName || !data.email || !data.role
        || !data.teamId || !data.consentGdpr) {
        return jsonResponse({ ok: false, error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return jsonResponse({ ok: false, error: 'Invalid email' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        if (!sheet) return jsonResponse({ ok: false, error: 'Sheet not found.' });

        const rows = sheet.getDataRange().getValues();
        let leader = null;
        let memberCount = 0;
        let alreadyJoined = false;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[COL.TEAM_ID - 1] !== data.teamId) continue;
            if (row[COL.STATUS - 1] === 'rejected') continue;

            memberCount++;

            if (row[COL.TEAM_ROLE - 1] === 'leader') {
                leader = {
                    firstName: row[COL.FIRST_NAME - 1],
                    lastName: row[COL.LAST_NAME - 1],
                    email: row[COL.EMAIL - 1],
                    teamName: row[COL.TEAM_NAME - 1],
                    teamSize: Number(row[COL.TEAM_SIZE - 1]),
                    code: row[COL.CODE - 1]
                };
            }
            if (String(row[COL.EMAIL - 1]).toLowerCase() === String(data.email).toLowerCase()) {
                alreadyJoined = true;
            }
        }

        if (!leader) return jsonResponse({ ok: false, error: 'Tým neexistuje.' });
        if (alreadyJoined) return jsonResponse({ ok: false, error: 'S tímto e-mailem už v týmu jsi.' });
        if (memberCount >= leader.teamSize) return jsonResponse({ ok: false, error: 'Tým je plný.' });

        const code = leader.code;
        const token = Utilities.getUuid();
        const timestamp = new Date();

        sheet.appendRow([
            timestamp,
            data.firstName, data.lastName, data.email,
            data.phone || '', data.birthYear || '', data.github || '',
            data.role, data.company || '',
            leader.teamName, leader.teamSize,
            data.consentGdpr ? 'ANO' : 'NE',
            data.consentNewsletter ? 'ANO' : 'NE',
            code, data.teamId, 'member', 'pending', token
        ]);

        sendLeaderConfirmRequestEmail(leader, data, token);
        sendJoinerPendingEmail(data, leader);

        return jsonResponse({ ok: true, mode: 'pending' });
    } finally {
        lock.releaseLock();
    }
}

function processConfirmation(token, newStatus) {
    if (!token) return { ok: false, status: 'invalid', message: 'Token chybí.' };

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        const rows = sheet.getDataRange().getValues();

        for (let i = 1; i < rows.length; i++) {
            if (rows[i][COL.TOKEN - 1] !== token) continue;

            const currentStatus = rows[i][COL.STATUS - 1];
            const memberFirstName = rows[i][COL.FIRST_NAME - 1];
            const memberLastName  = rows[i][COL.LAST_NAME - 1];
            const teamName = rows[i][COL.TEAM_NAME - 1];

            if (currentStatus !== 'pending') {
                return {
                    ok: true,
                    status: 'already',
                    previous: currentStatus,
                    memberFirstName: memberFirstName,
                    memberLastName: memberLastName,
                    teamName: teamName
                };
            }

            sheet.getRange(i + 1, COL.STATUS).setValue(newStatus);

            const memberData = {
                firstName: memberFirstName,
                lastName:  memberLastName,
                email:     rows[i][COL.EMAIL - 1]
            };
            const code = rows[i][COL.CODE - 1];
            const teamId = rows[i][COL.TEAM_ID - 1];

            let leaderFirstName = '';
            for (let j = 1; j < rows.length; j++) {
                if (rows[j][COL.TEAM_ID - 1] === teamId && rows[j][COL.TEAM_ROLE - 1] === 'leader') {
                    leaderFirstName = rows[j][COL.FIRST_NAME - 1];
                    break;
                }
            }

            if (newStatus === 'confirmed') {
                sendMemberConfirmedEmail(memberData, code, teamName, leaderFirstName);
                return {
                    ok: true,
                    status: 'confirmed',
                    memberFirstName: memberFirstName,
                    memberLastName: memberLastName,
                    teamName: teamName,
                    code: code
                };
            } else {
                sendMemberRejectedEmail(memberData, teamName, leaderFirstName);
                return {
                    ok: true,
                    status: 'rejected',
                    memberFirstName: memberFirstName,
                    memberLastName: memberLastName,
                    teamName: teamName
                };
            }
        }

        return { ok: false, status: 'invalid', message: 'Tento odkaz je neplatný nebo už expiroval.' };
    } finally {
        lock.releaseLock();
    }
}

function makeTeamId(name) {
    return String(name).trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateCode() {
    return 'HACK-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function findLeaderRow(sheet, teamId) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][COL.TEAM_ID - 1] === teamId && rows[i][COL.TEAM_ROLE - 1] === 'leader') {
            return i + 1;
        }
    }
    return null;
}

function sendLeaderWelcomeEmail(data, code) {
    const subject = 'Registrace potvrzena – ' + code;
    const html = emailShell(
        'Registrace potvrzena!',
        'Ahoj,<br><br>'
        + 'potvrzujeme tvou registraci na <strong>AI &amp; Programming Hackathon 2026</strong>. '
        + (Number(data.teamSize) > 1
            ? 'Založil/a jsi tým <strong>' + escapeHtml(data.teamName) + '</strong>. Až se bude chtít někdo připojit, dostaneš e-mail s tlačítkem pro potvrzení.'
            : 'Registruješ se jako <strong>sólo</strong> účastník. Těšíme se na tebe!')
        + '<br><br>Těšíme se na tebe!',
        code,
        eventInfoBlock() + ctaBlock()
    );
    MailApp.sendEmail({
        to: data.email, replyTo: ORGANIZER_EMAIL, subject: subject,
        htmlBody: html, name: SENDER_NAME
    });
}

function sendLeaderConfirmRequestEmail(leader, joinerData, token) {
    const confirmUrl = PUBLIC_BASE_URL + '/confirm.html?action=confirm&token=' + encodeURIComponent(token);
    const rejectUrl  = PUBLIC_BASE_URL + '/confirm.html?action=reject&token=' + encodeURIComponent(token);
    const subject = 'Žádost o připojení do týmu ' + leader.teamName;

    const body = 'Ahoj,<br><br>'
        + '<strong>' + escapeHtml(joinerData.firstName) + ' ' + escapeHtml(joinerData.lastName) + '</strong> '
        + '(' + escapeHtml(joinerData.email) + ') se chce připojit do tvého týmu '
        + '<strong>' + escapeHtml(leader.teamName) + '</strong>.';

    const buttons = ''
        + '<div style="text-align:center; margin:24px 0;">'
        + '  <a href="' + confirmUrl + '" style="display:inline-block; background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 30%,#a855f7 70%,#d946ef 100%); color:#ffffff; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:700; font-size:14px; margin:0 8px 12px 0;">Potvrdit připojení</a>'
        + '  <a href="' + rejectUrl  + '" style="display:inline-block; background:#e2e8f0; color:#334155; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:700; font-size:14px;">Odmítnout</a>'
        + '</div>'
        + '<p style="color:#64748b; font-size:12px; margin-top:8px; text-align:center; line-height:1.6;">'
        + 'Pokud tlačítka nefungují, zkopíruj odkaz ručně:<br>'
        + '<a href="' + confirmUrl + '" style="color:#3b82f6; text-decoration:none; word-break:break-all;">Potvrdit: ' + confirmUrl + '</a><br>'
        + '<a href="' + rejectUrl  + '" style="color:#3b82f6; text-decoration:none; word-break:break-all;">Odmítnout: ' + rejectUrl + '</a>'
        + '</p>'
        + '<p style="color:#64748b; font-size:12px; margin-top:16px; text-align:center; line-height:1.6;">Pokud si to rozmyslíš, napiš na <a href="mailto:' + ORGANIZER_EMAIL + '" style="color:#3b82f6; text-decoration:none;">' + ORGANIZER_EMAIL + '</a>.</p>';

    const html = emailShell('Žádost o připojení', body, null, buttons);
    MailApp.sendEmail({
        to: leader.email, replyTo: ORGANIZER_EMAIL, subject: subject,
        htmlBody: html, name: SENDER_NAME
    });
}

function sendJoinerPendingEmail(data, leader) {
    const subject = 'Registrace přijata – čeká na potvrzení vedoucího';
    const body = 'Ahoj,<br><br>'
        + 'přijali jsme tvou žádost o připojení do týmu <strong>' + escapeHtml(leader.teamName) + '</strong>. '
        + 'Právě jsme poslali e-mail vedoucímu <strong>' + escapeHtml(leader.firstName) + '</strong>. '
        + 'Jakmile připojení potvrdí, dostaneš potvrzovací e-mail s registračním kódem.<br><br>'
        + '<em>Čekáme obvykle do 24 hodin — pokud se neozve, napiš na <a href="mailto:' + ORGANIZER_EMAIL + '" style="color:#3b82f6; text-decoration:none;">' + ORGANIZER_EMAIL + '</a>.</em>';

    const html = emailShell('Čeká na potvrzení vedoucího', body, null, eventInfoBlock());
    MailApp.sendEmail({
        to: data.email, replyTo: ORGANIZER_EMAIL, subject: subject,
        htmlBody: html, name: SENDER_NAME
    });
}

function sendMemberConfirmedEmail(memberData, code, teamName, leaderFirstName) {
    const subject = 'Připojení do týmu potvrzeno – ' + code;
    const body = 'Ahoj,<br><br>'
        + 'vedoucí <strong>' + escapeHtml(leaderFirstName) + '</strong> potvrdil/a tvé připojení do týmu '
        + '<strong>' + escapeHtml(teamName) + '</strong>. Vítej v AI &amp; Programming Hackathonu 2026!';

    const html = emailShell('Jsi v týmu ' + escapeHtml(teamName) + '!', body, code, eventInfoBlock() + ctaBlock());
    MailApp.sendEmail({
        to: memberData.email, replyTo: ORGANIZER_EMAIL, subject: subject,
        htmlBody: html, name: SENDER_NAME
    });
}

function sendMemberRejectedEmail(memberData, teamName, leaderFirstName) {
    const subject = 'Připojení do týmu ' + teamName + ' nepotvrzeno';
    const body = 'Ahoj,<br><br>'
        + 'vedoucí týmu <strong>' + escapeHtml(teamName) + '</strong> bohužel nepotvrdil/a tvé připojení. '
        + 'Můžeš se přidat do jiného týmu nebo si založit vlastní — stačí znovu vyplnit <a href="https://tersva.github.io/hackathon-2026-registrace/" style="color:#3b82f6; text-decoration:none;">registrační formulář</a>.<br><br>'
        + '<em>Otázky? Napiš na <a href="mailto:' + ORGANIZER_EMAIL + '" style="color:#3b82f6; text-decoration:none;">' + ORGANIZER_EMAIL + '</a>.</em>';

    const html = emailShell('Připojení nepotvrzeno', body, null, '');
    MailApp.sendEmail({
        to: memberData.email, replyTo: ORGANIZER_EMAIL, subject: subject,
        htmlBody: html, name: SENDER_NAME
    });
}

function emailShell(headline, bodyHtml, code, afterBlock) {
    const codeBlock = code ? ''
        + '    <div style="background:#f1f5f9; border-radius:12px; padding:20px; margin:24px 0;">'
        + '      <div style="color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px; font-weight:600;">Kód vašeho týmu</div>'
        + '      <div style="font-family:\'Courier New\',monospace; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:0.04em;">' + code + '</div>'
        + '      <div style="color:#64748b; font-size:12px; margin-top:10px; line-height:1.5;">Tento kód sdílíš s ostatními členy týmu. Ukaž ho při registraci na místě.</div>'
        + '    </div>'
        : '';
    return ''
        + '<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"></head>'
        + '<body style="margin:0; padding:24px; background:#f8fafc; font-family:Arial,Helvetica,sans-serif;">'
        + '  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; padding:40px; border:1px solid #e2e8f0;">'
        + '    <div style="font-size:28px; font-weight:900; line-height:1.1; margin-bottom:16px; letter-spacing:-0.02em;">'
        + '      <span style="background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 30%,#a855f7 70%,#d946ef 100%); -webkit-background-clip:text; background-clip:text; color:transparent;">' + headline + '</span>'
        + '    </div>'
        + '    <p style="color:#334155; font-size:15px; line-height:1.7; margin:0 0 16px;">' + bodyHtml + '</p>'
        + codeBlock
        + (afterBlock || '')
        + '    <p style="color:#64748b; font-size:13px; margin-top:32px; line-height:1.6;">'
        + '      Máš dotaz? Napiš na <a href="mailto:' + ORGANIZER_EMAIL + '" style="color:#3b82f6; text-decoration:none;">' + ORGANIZER_EMAIL + '</a>.'
        + '    </p>'
        + '  </div>'
        + '  <p style="text-align:center; color:#94a3b8; font-size:12px; margin-top:16px;">AI &amp; Programming Hackathon 2026</p>'
        + '</body></html>';
}

function eventInfoBlock() {
    return ''
        + '    <div style="border-top:1px solid #e2e8f0; padding-top:20px; margin-top:8px;">'
        + '      <div style="color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; font-weight:600;">Kdy &amp; kde</div>'
        + '      <p style="color:#334155; font-size:14px; line-height:1.7; margin:0;">'
        + '        <strong>19.&ndash;21.&nbsp;6.&nbsp;2026</strong><br>'
        + '        Pátek 12:00 &ndash; Neděle 12:00 (48 hodin)<br><br>'
        + '        Integrovaná střední škola Cheb,<br>'
        + '        příspěvková organizace<br>'
        + '        Obrněné brigády 2258/6<br>'
        + '        350 02 Cheb'
        + '      </p>'
        + '    </div>';
}

function ctaBlock() {
    return ''
        + '    <div style="background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 30%,#a855f7 70%,#d946ef 100%); border-radius:12px; padding:24px; margin-top:28px; text-align:center;">'
        + '      <p style="color:#ffffff; font-size:14px; margin:0 0 14px; font-weight:600;">Nejlepší příprava na hackathon</p>'
        + '      <a href="https://ucebnice.praut.cz/" style="display:inline-block; background:#ffffff; color:#0f172a; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px;">'
        + '        Otevřít učebnici &rarr;'
        + '      </a>'
        + '    </div>';
}

function htmlResponse(title, message, tone) {
    const colors = {
        success: { bg: '#22d3ee,#3b82f6,#a855f7,#d946ef', label: 'Hotovo' },
        info:    { bg: '#64748b,#475569,#334155,#1e293b',  label: 'Info' },
        error:   { bg: '#d946ef,#a855f7,#7c3aed,#5b21b6',  label: 'Chyba' }
    };
    const tonePalette = colors[tone] || colors.info;
    const gradient = 'linear-gradient(135deg,' + tonePalette.bg.replace(/,/g, ' 0%,') + ' 100%)';

    const html = ''
        + '<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        + '<title>' + title + '</title>'
        + '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:24px;}'
        + '.card{max-width:480px;width:100%;background:rgba(30,41,59,0.6);border:1px solid rgba(148,163,184,0.2);border-radius:20px;padding:40px;text-align:center;backdrop-filter:blur(12px);}'
        + 'h1{font-size:32px;font-weight:900;margin:0 0 16px;line-height:1.1;letter-spacing:-0.02em;background:' + gradient + ';-webkit-background-clip:text;background-clip:text;color:transparent;}'
        + 'p{color:#cbd5e1;font-size:16px;line-height:1.7;margin:0;}</style></head>'
        + '<body><div class="card"><h1>' + title + '</h1><p>' + message + '</p></div></body></html>';
    return HtmlService.createHtmlOutput(html)
        .setTitle(title)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function initSheet() {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const defaultSheet = ss.getSheetByName('List1') || ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getName() !== SHEET_NAME) {
        try { ss.deleteSheet(defaultSheet); } catch (e) {}
    }

    const headers = [
        'Timestamp', 'Jméno', 'Příjmení', 'Email', 'Telefon', 'Rok narození',
        'GitHub', 'Role', 'Firma/Škola', 'Název týmu', 'Počet členů',
        'GDPR', 'Newsletter', 'Kód',
        'TeamID', 'Role v týmu', 'Stav', 'Token'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
        .setFontWeight('bold')
        .setBackground('#0f172a')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('left')
        .setVerticalAlignment('middle');

    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);

    const widths = [160, 120, 120, 220, 140, 110, 180, 140, 160, 150, 100, 80, 100, 120, 140, 110, 110, 280];
    for (let i = 0; i < widths.length; i++) sheet.setColumnWidth(i + 1, widths[i]);

    sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(p) {
        try { p.remove(); } catch (e) {}
    });
    const protection = headerRange.protect().setDescription('Hlavička - needitovat');
    protection.setWarningOnly(true);

    const emailRange = sheet.getRange('D2:D');
    const statusRange = sheet.getRange('Q2:Q');
    const rules = [];

    rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=AND($D2<>"", COUNTIF($D$2:$D, $D2) > 1)')
        .setBackground('#fae8ff').setFontColor('#86198f')
        .setRanges([emailRange]).build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('pending')
        .setBackground('#fef3c7').setFontColor('#92400e')
        .setRanges([statusRange]).build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('confirmed')
        .setBackground('#d1fae5').setFontColor('#065f46')
        .setRanges([statusRange]).build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('rejected')
        .setBackground('#e5e7eb').setFontColor('#374151')
        .setRanges([statusRange]).build());

    sheet.setConditionalFormatRules(rules);

    Logger.log('Sheet initialized: ' + sheet.getName() + ' (' + headers.length + ' columns)');
}

function testCreateTeam() {
    const fake = {
        postData: {
            contents: JSON.stringify({
                type: 'create_team',
                firstName: 'Tereza', lastName: 'Leader',
                email: 'martin.k.svanda@gmail.com',
                phone: '', birthYear: '', github: '',
                role: 'student', company: 'Test',
                teamName: 'Rychlí Pajdulaci', teamSize: 3,
                consentGdpr: true, consentNewsletter: false
            })
        }
    };
    Logger.log(doPost(fake).getContent());
}

function testJoinTeam() {
    const fake = {
        postData: {
            contents: JSON.stringify({
                type: 'join_team',
                firstName: 'Petr', lastName: 'Joiner',
                email: 'martin.k.svanda@gmail.com',
                phone: '', birthYear: '', github: '',
                role: 'student', company: '',
                teamId: 'rychli-pajdulaci',
                consentGdpr: true, consentNewsletter: false
            })
        }
    };
    Logger.log(doPost(fake).getContent());
}

function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
