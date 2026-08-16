# Handoff: droppdd App Shell

The `droppdd` app shell is complete, featuring persistent navigation, a dashboard, workout tracker, meals section, and progress tracking.

## Pages Built
- **Dashboard (`/`)**: Today's snapshot (OMAD status, streak, weight trend), WOD card, upcoming meal card.
- **Workouts (`/workouts`)**: List of guided workouts. Detail page (`/workouts/[id]`) with an interactive `WorkoutTracker` including set-completion tracking and rest timer.
- **Meals (`/meals`)**: Mock meal ideas with nutrition info and preparation protocols. Included a placeholder "AI Meal Planning" section.
- **Progress (`/progress`)**: Simple overview of weight history and progress visualization.

## Key Decisions & Assumptions
- **Styling**: Used Tailwind CSS v4 (`@import "tailwindcss"`) with theme tokens in `globals.css` as requested.
- **Mock Data**: Consolidated all data in `src/lib/mock-data.ts`.
- **Responsive Design**: Mobile-first design with a bottom navigation bar for mobile and a sidebar for desktop.
- **Interactivity**: Added client-side state in `WorkoutTracker` for real-time tracking during a workout.
- **State Management**: Used React `useState` and `useEffect` for the rest timer and progress tracking.

## Open Questions for Next Phase
- **Auth**: Need to integrate an authentication provider.
- **Database**: Need to define a schema and select a database to replace mock data.
- **AI Integration**: Need to determine which API to use for the AI-assisted meal planning section.
- **Deployment**: Need to select a deployment target (e.g., Vercel, AWS, etc.).

## Verification
- `npm run lint`: Passed.
- `npm run build`: Passed.

## Branch
- Work performed on branch: `feat/app-shell`.
