# End-to-end tests

Playwright is intentionally **not** a dependency yet - add it when the API is
available to test against:

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

Then add a `playwright.config.js` in this folder pointing `testDir` here and
`webServer` at `npm run preview`, and wire `npm run test:e2e` into `ci.yml`.

Suggested first specs:

- `auth.spec.js` - sign in, wrong password, session expiry redirect
- `course-crud.spec.js` - instructor creates, edits and publishes a course
- `learning.spec.js` - student resumes a lesson and progress persists
