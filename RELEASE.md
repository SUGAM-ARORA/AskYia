# Release Process

This document describes the release process for Askyia.

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for bug fixes (backwards-compatible)

Examples:
- `1.0.0` - First stable release
- `1.1.0` - New feature added
- `1.1.1` - Bug fix
- `2.0.0` - Breaking changes

## Pre-release Versions

- `1.0.0-alpha.1` - Alpha release (early testing)
- `1.0.0-beta.1` - Beta release (feature complete, testing)
- `1.0.0-rc.1` - Release candidate (final testing)

## Release Checklist

### Before Release

- [ ] All tests passing on CI
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers updated in:
  - [ ] `backend/app/__init__.py`
  - [ ] `frontend/package.json`
  - [ ] `pyproject.toml`
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Breaking changes documented

### Creating a Release

1. **Update version numbers**:

```bash
# Update backend version
# Edit backend/app/__init__.py
__version__ = "1.2.0"

# Update frontend version
cd frontend && npm version 1.2.0

# Update root pyproject.toml
# Edit pyproject.toml
version = "1.2.0"
Update CHANGELOG.md:
markdown
## [1.2.0] - 2024-01-15

### Added
- New feature X
- New feature Y

### Changed
- Improved performance of Z

### Fixed
- Bug fix for issue #123

### Security
- Updated dependency A to fix CVE-XXXX
Create release commit:
bash
git add -A
git commit -m "chore(release): v1.2.0"
Create and push tag:
bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main
git push origin v1.2.0
GitHub Release will be automatically created by CI
After Release
 Verify Docker images published
 Verify GitHub Release created
 Update documentation site
 Announce release (Twitter, Discord, etc.)
 Monitor for issues
Hotfix Process
For critical bugs in production:

Create hotfix branch from the release tag:
bash
git checkout -b hotfix/1.2.1 v1.2.0
Make the fix and test thoroughly

Update version to patch number:

bash
# 1.2.0 -> 1.2.1
Create PR to main and release

Cherry-pick to develop branch if needed

Rollback Process
If a release has critical issues:

Revert to previous version:
bash
# Docker
docker pull ghcr.io/yourusername/askyia-backend:1.1.0
docker pull ghcr.io/yourusername/askyia-frontend:1.1.0
For Kubernetes:
bash
kubectl rollout undo deployment/backend -n askyia
kubectl rollout undo deployment/frontend -n askyia
Document the issue and plan a hotfix
Release Schedule
Major releases: As needed (with 3-month notice for breaking changes)
Minor releases: Monthly
Patch releases: As needed for bug fixes
Security patches: Immediate
Support Policy
Version	Support Status
1.x	Active
0.x	End of Life
We support the current major version and provide security fixes for the previous major version for 6 months after a new major release.