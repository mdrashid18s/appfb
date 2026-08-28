# Agent Guidelines

## Codebase and Database Maintenance
- **Proactive Cleanup**: Always remove unused code, dead variables, `console.log` statements, and unused files as you work. You do not need to wait for the user to ask you to clean up the code.
- **Database Minimalism**: Keep the database tables and columns as minimal as possible. Drop columns that are no longer used (e.g., `remember_token` if using stateless API tokens).
- **Strict Relationships**: Always implement proper Primary Keys and Foreign Keys for database relationships to ensure data integrity and avoid orphan records.

## Mandatory Code Documentation & Comments
- **Comprehensive Documentation**: Every file (Frontend Components, Pages, Custom Hooks, Backend Controllers, Models, API Resources, Mailers, and Route files) MUST contain clear, detailed, and up-to-date explanatory comments (in clear Hindi/Hinglish or English).
- **Explain 'Why' and 'How'**: Comment on file headers, state variables, component props (`@param`), React hooks (`useEffect`, `useState`, `useRef`), lifecycle logic, security guards, backend methods, validations, API endpoints, and JSX/HTML layout blocks so anyone reading the code immediately understands how every piece works.

## Responsive UI & Dual Device Optimization
- **Dual Device First**: Always design and test UI features for both Mobile and Laptop displays.
- **Adaptive Layouts**: When content or tables risk overflowing or looking cluttered on smaller screens, implement custom mobile-tailored layouts (e.g. mobile card lists, stacked views, touch-friendly buttons) separate from desktop grid/table views.

## Strict MVC Architecture (Fat Model, Skinny Controller)
- **Model Encapsulation**: Always encapsulate database querying logic, filters, searches, and sorting inside **Eloquent Models** using dedicated query scopes (e.g. `scopeActive`, `scopeByCategory`, `scopeSortedBy`, `scopeSearch`) and helper methods.
- **Lean Controllers**: Keep controllers minimal and clean. Controllers should only validate incoming requests, invoke Model scopes/methods, and return formatted responses. Never scatter raw database query logic or multiple sorting if-else blocks across controllers.
