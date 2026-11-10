# Troubleshooting

## Common Issues

### MongoDB connection refused

Ensure Docker Compose is running:
```
docker compose -f infrastructure/docker/docker-compose.yml up -d
```
Verify with: `docker compose ps`

### TypeScript errors in workspace packages

Run `pnpm install` to ensure workspace symlinks are correct, then
`pnpm run typecheck`.

### Lockfile conflicts

Run `pnpm install` to regenerate `pnpm-lock.yaml`, then commit the lockfile.

### Extension not loading in Chrome

1. Build: `pnpm --filter @career-intelligence/extension build`
2. Go to `chrome://extensions`
3. Enable Developer mode
4. Click "Load unpacked" → select `apps/extension`

### Tests failing

Run `pnpm run validate` to check typecheck, lint, and tests together.
Fix typecheck errors first, then lint, then test failures.

## Debugging

- Backend logs use structured format via `LoggingInterceptor`.
- Worker logs queue processing events.
- Check `docker compose logs` for infrastructure issues.
- Browser DevTools for extension content scripts and popup.
