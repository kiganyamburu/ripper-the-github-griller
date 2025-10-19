$env:NX_GENERATE_PACKAGE_LOCK_FILE = 'false'
pnpm nx build genkit
if ($LASTEXITCODE -eq 0) {
    Copy-Item -Path apps/genkit/.env -Destination dist/apps/genkit/.env -ErrorAction SilentlyContinue
    Copy-Item -Path .env -Destination dist/apps/genkit/.env -ErrorAction SilentlyContinue
    firebase emulators:start --only functions
}
