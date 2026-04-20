const SHEET_ID        = '1TvRRFUQ7umPuCCSigqbrJgr4kHLk4ZcqLfoDPb619yE';
const SHEET_NAME      = 'Registrace';
const ORGANIZER_EMAIL = 'svanda@praut.cz';
const SENDER_NAME     = 'AI & Programming Hackathon 2026';

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        if (!data.firstName || !data.lastName || !data.email || !data.role
            || !data.teamSize || !data.consentGdpr) {
            return jsonResponse({ ok: false, error: 'Missing required fields' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return jsonResponse({ ok: false, error: 'Invalid email' });
        }

        const code = 'HACK-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const timestamp = new Date();

        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        if (!sheet) {
            return jsonResponse({ ok: false, error: 'Sheet not found, run initSheet first.' });
        }

        sheet.appendRow([
            timestamp,
            data.firstName,
            data.lastName,
            data.email,
            data.phone || '',
            data.birthYear || '',
            data.github || '',
            data.role,
            data.company || '',
            data.teamName || '',
            data.teamSize,
            data.consentGdpr ? 'ANO' : 'NE',
            data.consentNewsletter ? 'ANO' : 'NE',
            code
        ]);

        sendConfirmationEmail(data, code);

        return jsonResponse({ ok: true, code: code });

    } catch (err) {
        console.error(err);
        return jsonResponse({ ok: false, error: err.toString() });
    }
}

function doGet() {
    return jsonResponse({ ok: true, message: 'Hackathon registration webhook is alive.' });
}

function sendConfirmationEmail(data, code) {
    const subject = 'Registrace potvrzena - ' + code;

    const html = ''
        + '<!DOCTYPE html>'
        + '<html lang="cs">'
        + '<head><meta charset="UTF-8"></head>'
        + '<body style="margin:0; padding:24px; background:#f8fafc; font-family:Arial,Helvetica,sans-serif;">'
        + '  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; padding:40px; border:1px solid #e2e8f0;">'
        + '    <div style="font-size:28px; font-weight:900; line-height:1.1; margin-bottom:16px; letter-spacing:-0.02em;">'
        + '      <span style="background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 30%,#a855f7 70%,#d946ef 100%); -webkit-background-clip:text; background-clip:text; color:transparent;">Registrace potvrzena!</span>'
        + '    </div>'
        + '    <p style="color:#334155; font-size:15px; line-height:1.7; margin:0 0 16px;">'
        + '      Ahoj <strong>' + escapeHtml(data.firstName) + '</strong>,<br><br>'
        + '      potvrzujeme tvou registraci na <strong>AI &amp; Programming Hackathon 2026</strong>. Těšíme se na tebe!'
        + '    </p>'
        + '    <div style="background:#f1f5f9; border-radius:12px; padding:20px; margin:24px 0;">'
        + '      <div style="color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px; font-weight:600;">Tvůj registrační kód</div>'
        + '      <div style="font-family:\'Courier New\',monospace; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:0.04em;">' + code + '</div>'
        + '    </div>'
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
        + '    </div>'
        + '    <div style="background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 30%,#a855f7 70%,#d946ef 100%); border-radius:12px; padding:24px; margin-top:28px; text-align:center;">'
        + '      <p style="color:#ffffff; font-size:14px; margin:0 0 14px; font-weight:600;">Nejlepší příprava na hackathon</p>'
        + '      <a href="https://ucebnice.praut.cz/" style="display:inline-block; background:#ffffff; color:#0f172a; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px;">'
        + '        Otevřít učebnici &rarr;'
        + '      </a>'
        + '    </div>'
        + '    <p style="color:#64748b; font-size:13px; margin-top:32px; line-height:1.6;">'
        + '      Máš dotaz? Napiš na <a href="mailto:' + ORGANIZER_EMAIL + '" style="color:#3b82f6; text-decoration:none;">' + ORGANIZER_EMAIL + '</a>.'
        + '    </p>'
        + '  </div>'
        + '  <p style="text-align:center; color:#94a3b8; font-size:12px; margin-top:16px;">'
        + '    AI &amp; Programming Hackathon 2026'
        + '  </p>'
        + '</body></html>';

    MailApp.sendEmail({
        to: data.email,
        replyTo: ORGANIZER_EMAIL,
        subject: subject,
        htmlBody: html,
        name: SENDER_NAME
    });
}

function initSheet() {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
    }

    const defaultSheet = ss.getSheetByName('List1') || ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getName() !== SHEET_NAME) {
        try { ss.deleteSheet(defaultSheet); } catch (e) {}
    }

    const headers = [
        'Timestamp', 'Jméno', 'Příjmení', 'Email', 'Telefon', 'Rok narození',
        'GitHub', 'Role', 'Firma/Škola', 'Název týmu', 'Počet členů',
        'GDPR', 'Newsletter', 'Kód'
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

    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(5, 140);
    sheet.setColumnWidth(6, 110);
    sheet.setColumnWidth(7, 180);
    sheet.setColumnWidth(8, 140);
    sheet.setColumnWidth(9, 160);
    sheet.setColumnWidth(10, 150);
    sheet.setColumnWidth(11, 100);
    sheet.setColumnWidth(12, 80);
    sheet.setColumnWidth(13, 100);
    sheet.setColumnWidth(14, 120);

    sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(p) {
        try { p.remove(); } catch (e) {}
    });
    const protection = headerRange.protect().setDescription('Hlavicka - needitovat');
    protection.setWarningOnly(true);

    const emailRange = sheet.getRange('D2:D');
    const rules = sheet.getConditionalFormatRules();
    const duplicateRule = SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=AND($D2<>"", COUNTIF($D$2:$D, $D2) > 1)')
        .setBackground('#fae8ff')
        .setFontColor('#86198f')
        .setRanges([emailRange])
        .build();
    rules.push(duplicateRule);
    sheet.setConditionalFormatRules(rules);

    Logger.log('Sheet initialized: ' + sheet.getName());
}

function testSubmit() {
    const fake = {
        postData: {
            contents: JSON.stringify({
                firstName: 'Test',
                lastName: 'Uživatel',
                email: 'martin.k.svanda@gmail.com',
                phone: '+420 777 000 000',
                birthYear: '1998',
                github: 'github.com/test',
                role: 'student',
                company: 'Test School',
                teamName: 'TestTeam',
                teamSize: '3',
                consentGdpr: true,
                consentNewsletter: false
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
