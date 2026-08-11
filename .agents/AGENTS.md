# Agent Guidelines

## Codebase and Database Maintenance
- **Proactive Cleanup**: Always remove unused code, dead variables, `console.log` statements, and unused files as you work. You do not need to wait for the user to ask you to clean up the code.
- **Database Minimalism**: Keep the database tables and columns as minimal as possible. Drop columns that are no longer used (e.g., `remember_token` if using stateless API tokens).
- **Strict Relationships**: Always implement proper Primary Keys and Foreign Keys for database relationships to ensure data integrity and avoid orphan records.

## Responsive UI & Dual Device Optimization
- **Dual Device First**: Always design and test UI features for both Mobile and Laptop displays.
- **Adaptive Layouts**: When content or tables risk overflowing or looking cluttered on smaller screens, implement custom mobile-tailored layouts (e.g. mobile card lists, stacked views, touch-friendly buttons) separate from desktop grid/table views.

