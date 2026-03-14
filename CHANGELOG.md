# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.0] - 2026-03-13

### Added
- **Initial Release**: Complete core functionality for Mise en Place.
- **Recipe Management**:
    - Recipe bank with AI-powered URL parsing.
    - Manual recipe creation and editing.
    - 1-Click Rating System (Loved, Okay, Skip).
    - Edit mode for recipes (update image, details, ingredients, steps, tags).
- **Meal Planning**:
    - Weekly rotation engine to generate menus based on preferences.
    - Interactive weekly menu view.
- **Shopping & Pantry**:
    - Automated shopping list generation from the weekly menu.
    - Split shopping lists (Order 1 / Order 2).
    - Pantry staples management.
- **Deployment**:
    - configured for GitHub Pages deployment (`gh-pages`).
    - Added `404.html` handling for SPA routing on GitHub Pages.

### Security
- **Credentials**: Removed sensitive `.env` files from version control and added strict `.gitignore` rules.
