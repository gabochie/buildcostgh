## Summary

<!-- What does this change do and why? Link the issue it closes. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Schema / database change
- [ ] Security fix
- [ ] Refactor / cleanup
- [ ] Docs

## Checklist

### Code quality
- [ ] `npx tsc --noEmit` passes locally
- [ ] `npm run lint` passes locally
- [ ] `npx next build --webpack` passes locally
- [ ] No `.env`, secrets, or keys committed
- [ ] No unnecessary files / debug logging

### Database (only if schema changed)
- [ ] New Prisma migration committed in `prisma/migrations/`
- [ ] Migration verified against a Neon staging/preview branch
- [ ] Seed data updated if needed

### Staging sign-off (required before merge to `main`)
- [ ] Deployed to **staging** and verified against a real DB copy
- [ ] Key flows smoke-tested: calculator, checkout (Paystack test mode), report delivery, emails
- [ ] No regression on existing pages touched

## Screenshots / evidence

<!-- Attach screenshots or preview URL if UI changed -->

## Notes for reviewer

<!-- Anything the reviewer should pay attention to -->
