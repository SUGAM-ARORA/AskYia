# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

We take the security of Askyia seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do

- **Report the vulnerability privately** to security@askyia.dev
- **Provide detailed information** about the vulnerability
- **Allow time** for us to investigate and fix the issue before public disclosure
- **Act in good faith** to avoid privacy violations, data destruction, or service disruption

### Please Don't

- **Don't** publicly disclose the vulnerability before we've had a chance to fix it
- **Don't** access or modify other users' data
- **Don't** perform actions that could harm the availability of the service
- **Don't** use the vulnerability for any malicious purpose

## What to Include in Your Report

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Location** of the vulnerable code (file path, URL, etc.)
- **Step-by-step instructions** to reproduce the vulnerability
- **Proof of concept** code or screenshots if applicable
- **Potential impact** of the vulnerability
- **Suggested fix** if you have one

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next regular release

## Security Measures

### Authentication & Authorization

- JWT-based authentication with secure token handling
- Role-based access control (RBAC)
- Password hashing using bcrypt
- OAuth 2.0 support for third-party authentication

### Data Protection

- All data encrypted in transit (TLS 1.3)
- Sensitive data encrypted at rest
- API keys and secrets stored securely
- Regular security audits

### Infrastructure Security

- Regular dependency updates
- Container security scanning
- Network segmentation in Kubernetes
- Secrets management with Kubernetes Secrets/Vault

### Code Security

- Pre-commit hooks for secret detection
- Automated security scanning in CI/CD
- Code review requirements
- Regular penetration testing

## Security Best Practices for Users

### API Keys

- Never commit API keys to version control
- Rotate API keys regularly
- Use environment variables for sensitive configuration
- Limit API key permissions to minimum required

### Deployment

- Use HTTPS in production
- Keep all dependencies updated
- Enable logging and monitoring
- Implement rate limiting
- Use a Web Application Firewall (WAF)

### Docker

- Use official base images
- Run containers as non-root
- Scan images for vulnerabilities
- Don't store secrets in images

## Acknowledgments

We appreciate the security research community's efforts in helping keep Askyia secure. Researchers who report valid security issues will be acknowledged in our security advisories (unless they prefer to remain anonymous).

## Contact

- **Security Email**: security@askyia.dev
- **PGP Key**: [Available upon request]

Thank you for helping keep Askyia and its users safe!