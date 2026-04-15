---
name: security-review
description: Security review checklist. Auto-activates when the security-reviewer agent runs or when reviewing auth, payment, or access control code.
---

# Security review checklist

## OWASP Top 10 checks
1. Injection (SQL, NoSQL, OS command, LDAP)
2. Broken authentication (weak passwords, missing MFA, session fixation)
3. Sensitive data exposure (unencrypted PII, excessive logging)
4. XML external entities (if applicable)
5. Broken access control (IDOR, privilege escalation, missing checks)
6. Security misconfiguration (default creds, verbose errors, open CORS)
7. XSS (reflected, stored, DOM-based)
8. Insecure deserialization
9. Using components with known vulnerabilities
10. Insufficient logging and monitoring

## Auth-specific checks
- Passwords hashed with bcrypt/argon2 (never MD5/SHA)
- JWT: verify signature, check expiry, validate issuer
- Refresh token rotation on use
- Rate limiting on login endpoints (prevent brute force)
- Account lockout after N failed attempts
- Session invalidation on password change

## Data handling
- PII encrypted at rest and in transit
- Minimum data collection principle
- No sensitive data in URL parameters
- No secrets in client-side code or git history
- Database queries parameterized (never string concatenation)

## API security
- Authentication required on all non-public endpoints
- Authorization checked at every endpoint (not just middleware)
- Input validation with strict schemas
- Rate limiting on all endpoints
- CORS restricted to known origins
- No stack traces or internal errors exposed to clients
