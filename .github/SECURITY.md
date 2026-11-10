# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Invariants

Career Intelligence OS enforces the following security boundaries:
1. **Multi-Tenant Workspace Isolation**: Every database query is scoped by `workspaceId`. Cross-tenant queries are blocked at the repository layer.
2. **Deterministic Token Indexing**: Refresh tokens, session hashes, and password reset tokens are stored exclusively as deterministic SHA-256 digests (`crypto.createHash('sha256')`).
3. **Password Security**: Bcrypt with 12 rounds of salt is enforced for all human passwords.
4. **CSRF Mitigation**: Double-submit cookie verification pattern (`csrf_token`) is enforced on state-changing browser requests.
5. **Brute-Force Protection**: 5 consecutive failed login attempts trigger an automatic 15-minute account lockout.
6. **Token Expiration**: Access tokens are short-lived (15 minutes). Refresh tokens are rotated upon each renewal.

## Reporting a Vulnerability

If you discover a security vulnerability within Career Intelligence OS, please report it responsibly:

- **Do NOT** open a public issue on GitHub.
- Submit a confidential report using GitHub's Private Vulnerability Reporting feature, or email the security maintainers directly.
- Include detailed steps to reproduce the issue, attack vectors, and potential impact.
- You will receive an acknowledgment within 48 hours and regular updates on resolution.
