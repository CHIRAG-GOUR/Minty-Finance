# Skillizee apps

A workspace holding one self-contained application per folder under `apps/`.

| App | Folder | What it is |
|---|---|---|
| Minty Finance | [`apps/minty`](apps/minty) | Android investment-practice app for students (virtual money, real market data) |

## Working on an app

Each app owns its own `package.json`, `node_modules`, native project and tests,
so they never share dependencies or build state. Run every command from inside
the app's folder:

```bash
cd apps/minty
npm install
npm test
npx expo run:android
```

## Adding another app

```bash
mkdir apps/<name>
```

Keep it self-contained the same way: its own manifest, its own native folder,
its own tests. Nothing at the repository root should be required to build an
individual app.
