# MEI em Dia

**An independent guide to help Brazil's individual micro-entrepreneurs (MEIs) understand debt-related guidance, find official channels, and organize tasks and deadlines.**

> **Important notice:** MEI em Dia is not a Brazilian government service. It does not query a user's tax status or confirm individual eligibility for debt relief. Information and dates are educational references and must be verified through official channels. This project does not replace accounting or legal advice.

## Goals

- Explain tax-related information in plain language.
- Direct users to official sources without requiring an account.
- Provide a task checklist whose progress is saved in the browser.
- Export pending tasks to a calendar file (.ics).
- Allow manual backup and restoration of progress (.json).
- Provide an installable web app (PWA) with offline support intended after the first online visit.

## Implemented features

- Guided flow with one question per screen, four starting paths, and basic scam-prevention guidance.
- Links to official PGFN and Receita Federal channels.
- Task checklist, progress indicator, and reference dates.
- Calendar export for pending deadlines, including a reminder configured for one day before. Delivery depends on the calendar app and device settings.
- Local persistence of completed tasks in browser storage.
- Manual export and restore of progress using JSON.
- Web app manifest, icons, and service worker for PWA/offline support.

## Limitations

There is no backend, user account, cross-device synchronization, or built-in push notification service. Offline behavior must be tested after an initial online visit to a production build served over HTTPS or through Vite preview. External links require an internet connection. Do not claim offline support is verified until the published version has been tested in the target browser.

## Requirements

- Node.js 20 or later recommended.
- npm (included with Node.js).
- Git (optional).

## Run locally — Windows PowerShell

From the directory containing package.json:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Build and preview

```powershell
npm run build
npm run preview
```

Open the URL printed by the preview command, usually `http://localhost:4173`. Test the service worker with the production preview rather than relying only on the development server.

## Offline verification checklist

1. Run the build and preview commands.
2. Open the application while online and wait for it to finish loading.
3. In browser DevTools, open **Application → Service Workers** and confirm the worker is active.
4. Check **Application → Cache Storage** for cached assets.
5. Enable offline mode and reload the page.
6. Repeat after a version update and confirm the app does not render a blank screen.

Behavior may vary by browser. Treat offline support as unverified until these checks pass on the published URL.

## Data and privacy

- The app does not send guided-flow answers to a project-owned backend.
- Completed tasks are stored in the browser's localStorage.
- The exported backup contains completed task identifiers and an export date; it is not a tax document.
- Browser or system cleanup may erase local storage. Export a backup if progress needs to be transferred.
- Do not put passwords, CPF/CNPJ identifiers, tax documents, or other personal data in issues, commits, or repository files.

## Official sources

- [PGFN — FAQ about MEI debt relief](https://www.gov.br/pgfn/pt-br/servicos/perguntas-frequentes/perguntas-frequentes-perdao-do-mei)
- [Receita Federal — digital services](https://servicos.receitafederal.gov.br/)
- [PGMEI — DAS issuance and consultation](https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao)
- [Regularize / PGFN](https://www.regularize.pgfn.gov.br/)

Always confirm applicable rules, current deadlines, and individual status through official portals. Dates shown in the checklist are organizational reminders, not a live official status check.

## Publishing

The repository includes an initial GitLab Pages CI configuration in `.gitlab-ci.yml`. Before publishing, review the `base` setting in `vite.config.ts`, confirm the project path for GitLab Pages, and test links, PWA installation, and offline behavior on the actual public URL.

## Validation status

The candidate version includes the guided flow and initial suspicious-message guidance. Dependency installation did not finish in the preparation environment, so the build has not been verified there. Before publishing, run the build and test backup export/import, calendar import, offline behavior, and deployment path.

## License

No distribution license has been defined in this repository yet. Choose and add an explicit license before presenting the project as open source.

## Deadline organization

- The primary action is calendar export: the app prepares an .ics file for the user's chosen calendar.
- Backup and restore are grouped under **More options** to keep the main screen focused.
- Task progress is saved automatically in browser storage.
- Reminders depend on the selected calendar and device settings. Verify deadlines through official channels.
