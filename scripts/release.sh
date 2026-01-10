#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check argument
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <major|minor|patch>${NC}"
    exit 1
fi

RELEASE_TYPE=$1

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Invalid release type. Use: major, minor, or patch${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(grep -E '"version"' frontend/package.json | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')

echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $RELEASE_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Confirm
read -p "Proceed with release v${NEW_VERSION}? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Update versions
echo -e "${YELLOW}Updating version numbers...${NC}"

# Update frontend package.json
cd frontend
npm version $NEW_VERSION --no-git-tag-version
cd ..

# Update backend __init__.py
if [ -f "backend/app/__init__.py" ]; then
    sed -i.bak "s/__version__ = \".*\"/__version__ = \"${NEW_VERSION}\"/" backend/app/__init__.py
    rm -f backend/app/__init__.py.bak
fi

# Update root pyproject.toml if exists
if [ -f "pyproject.toml" ]; then
    sed -i.bak "s/^version = \".*\"/version = \"${NEW_VERSION}\"/" pyproject.toml
    rm -f pyproject.toml.bak
fi

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add -A
git commit -m "chore(release): v${NEW_VERSION}"

# Create tag
echo -e "${YELLOW}Creating tag...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

# Push
echo -e "${YELLOW}Pushing to remote...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"

echo -e "${GREEN}✅ Release v${NEW_VERSION} created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. GitHub Actions will automatically create the release"
echo "  2. Docker images will be built and pushed"
echo "  3. Update CHANGELOG.md with release notes"