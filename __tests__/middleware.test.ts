// Scaffold for SEC-03: Protected route redirects to /login when no session (T-02-02)
// Fleshed out in Plan 02-04

test.todo('proxy redirects unauthenticated request to /dashboard to /login?next=/dashboard (SEC-03)')
test.todo('proxy redirects unauthenticated request to /admin to /login?next=/admin (SEC-03)')
test.todo('proxy redirects unauthenticated request to /account to /login?next=/account (SEC-03)')
test.todo('proxy passes authenticated request to protected route without redirect (SEC-03)')
