# AI & Programming Hackathon 2026 — Registrace

Registrační systém pro 48hodinový hackathon 19.–21. 6. 2026 v Chebu.

- **Frontend:** čisté HTML + CSS + vanilla JS (bez build kroku)
- **Hosting:** GitHub Pages
- **Backend:** Google Apps Script jako webhook
- **Data:** Google Sheets
- **E-mail:** Gmail (MailApp) přes martin.k.svanda@gmail.com
- **Anti-spam:** honeypot pole (žádná reCAPTCHA)

---

## Struktura

```
hackathon-registration/
├── index.html              # registrační formulář
├── success.html            # potvrzovací stránka
├── apps-script/
│   └── Code.gs             # Google Apps Script webhook (ke zkopírování do editoru)
├── docs/
│   ├── SETUP.md            # kompletní deploy návod
│   ├── TESTING.md          # testovací checklist
│   └── EMAIL_TEMPLATE.md   # šablona potvrzovacího e-mailu
└── README.md
```

---

## Lokální spuštění

Stačí otevřít `index.html` v prohlížeči (dvojklik nebo `file://`). Žádný build, žádné `npm install`.

Formulář ale bez nastaveného Apps Scriptu neuloží data — pro plnou funkčnost projdi [`docs/SETUP.md`](docs/SETUP.md).

---

## Deploy

Plný návod krok za krokem: **[docs/SETUP.md](docs/SETUP.md)**

Rychlý přehled:
1. Vytvoř Google Sheet (nebo použij existující `SHEET_ID`)
2. Nalož `apps-script/Code.gs` do [script.google.com](https://script.google.com)
3. Spusť `initSheet()` → nastaví hlavičku, formátování, ochranu
4. Spusť `testSubmit()` → ověř, že zápis a e-mail fungují
5. Deploy jako Web App (Execute as Me, Anyone access)
6. Vlož Web app URL do `index.html` místo `REPLACE_WITH_APPS_SCRIPT_WEB_APP_URL`
7. Push na GitHub + zapni Pages

---

## Testování

Checklist v [`docs/TESTING.md`](docs/TESTING.md) — 10 bodů, ~10 minut.

---

## Co je třeba ručně nastavit (shrnutí)

| Co                        | Kde                                                   | Status                |
|---------------------------|-------------------------------------------------------|-----------------------|
| `SHEET_ID`                | `apps-script/Code.gs`                                 | ✅ přednastaveno      |
| `APPS_SCRIPT_URL`         | `index.html`                                          | ⚠️ po deploy Apps Scriptu |
| GitHub repo + Pages       | settings Github                                       | ⚠️ ručně              |
| Apps Script deploy        | script.google.com → Deploy → New deployment           | ⚠️ ručně              |

---

## Kontakt

Organizátor: **Martin Švanda** — [svanda@praut.cz](mailto:svanda@praut.cz)
