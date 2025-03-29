# Changelog

## [Unreleased] - 2025-03-29

### Added

- Comprehensive documentation for the login loop fix:
  - Architecture Decision Record (ADR) explaining the root cause and solution
  - Detailed implementation guide with testing instructions
  - Standalone test pages for visualizing and verifying the fix

- New developer documentation:
  - Detailed onboarding guide for new team members
  - Project evolution document explaining the history and key decisions
  - Troubleshooting guide for common issues
  - Frontend architecture patterns documentation
  - Team playbook with standardized development practices

### Fixed

- React dependency management issue causing login loop:
  - Changed from object dependencies to primitive value dependencies
  - Added fetch state tracking to prevent concurrent API calls
  - Implemented proper early return guards and cleanup

### Improved

- Enhanced main README with better project explanation
- Updated installation and setup instructions
- Added documentation cross-references for easier navigation
- Standardized React hooks usage patterns
