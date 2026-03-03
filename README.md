# CampusConnect2 (Hushh)

A gig-economy and tutoring marketplace designed exclusively for university students. 

## 🏗️ 1. Core Tech Stack

The application is built as a modern full-stack JavaScript/TypeScript application using the **PERN-like stack** (PostgreSQL, Express, React, Node), supercharged with modern tooling.

### Frontend (Client)
*   **React 18**: Core library for building the user interface.
*   **Vite**: Extremely fast frontend build tool and development server. Replaces traditional Webpack/Create React App.
*   **Wouter**: A minimalist, hook-based routing solution used instead of React Router for lighter bundle size.
*   **Tailwind CSS**: Utility-first CSS framework for styling. It allows for rapid UI development without writing custom CSS files.
*   **shadcn/ui & Radix UI**: Accessible, unstyled UI components (Radix) styled with Tailwind (shadcn). This provides the beautiful baseline for components like Cards, Buttons, Inputs, and Dialogs.
*   **React Query (@tanstack/react-query)**: Handles asynchronous state management, API data fetching, caching, and synchronization between the server and the UI.
*   **Lucide React**: The library used for all the clean, consistent SVG icons across the app (e.g., Star, GraduationCap, Sparkles).

### Backend (Server)
*   **Node.js & Express.js**: The core server runtime and API framework.
*   **TypeScript**: Used extensively across both frontend and backend for type safety.
*   **Zod**: Schema validation library. Ensures that data coming into the API endpoints (and going out) exactly matches expected formats.
*   **tsx**: Execution environment for running TypeScript files directly without compiling to JavaScript first (used via `--import=tsx server/index.ts`).

### Database & ORM
*   **PostgreSQL**: The relational database storing all persistent data.
*   **Drizzle ORM**: A modern, lightweight, type-safe Object Relational Mapper. It translates TypeScript code into SQL queries efficiently.
*   **express-session & connect-pg-simple**: Manages user authentication sessions and stores them securely in the PostgreSQL database.

---

## ✨ 2. Key Features & Implementation Flow

### A. The "Find Teachers" Directory & Sorting
**Goal**: Allow students to browse available teachers, view their ratings, and sort them logically.

*   **Database Flow (`server/storage.ts`)**: 
    *   The `searchTutors` function performs a complex `JOIN` operation. It finds active tutor profiles, joins their specific subjects and availability schedules, and dynamically groups and averages their ratings from the `reviews` table.
*   **API Boundary (`shared/routes.ts`)**: 
    *   Defines the `/api/tutors` GET endpoint. Zod schemas ensure the data safely includes `averageRating` and `totalReviews`.
*   **Frontend Data Layer (`client/src/hooks/use-tutors.ts`)**: 
    *   React Query fetches the data automatically when filters change, keeping a cache so switching views is instant.
*   **UI Component (`FindTutorsPage.tsx`)**: 
    *   Uses a `useMemo` hook to intercept the backend data and physically sort the array *in memory* (e.g., Highest Rated, Price Low -> High) right before mapping over it to render the UI Cards.
    *   **Visuals**: Uses tailored badges (`bg-green-100` for Teachers) and the dynamic `<StarRating />` component built with Lucide icons.

### B. The Gig Board (Teach vs. Learn)
**Goal**: Create a marketplace board where users can post either "I want to teach" or "I want to learn" requests.

*   **Data Strategy**: To avoid migrating the database schema, the concept of "Teach vs. Learn" is handled virtually. 
*   **Posting (`PostGigPage.tsx`)**: 
    *   The user clicks a UI toggle (Teacher/Student). When they submit, the frontend forcibly prepends a hidden tag `[TEACH]` or `[LEARN]` into the text of the `description` string before sending it to the database.
*   **Displaying (`GigBoardPage.tsx`)**: 
    *   When pulling the gigs back from the database to display, a helper function `stripTag()` removes the `[TEACH]`/`[LEARN]` text from the screen so it's invisible to the user.
    *   Another helper function `getPostType()` reads that prefix tag to determine if a Gig card should get a Green "Teaching" badge or a Blue "Learning" badge.

### C. Authentication & Session Management
*   **Flow**: When a user logs in, `bcryptjs` compares their password hash. If valid, `express-session` assigns them a secure cookie tied to a session ID.
*   **Security**: That session ID lives in the `sessions` table in Postgres. Future API requests read that cookie to recognize the user as `req.user`.

### D. System Seeding (`scripts/seed.ts`)
**Goal**: Rapidly populate realistic mock data for testing.
*   **Tool**: A standalone Node script executed via `tsx`.
*   **Flow**: It hashes a default password (`password123`) using `bcryptjs`. It bypasses the API completely and uses Drizzle ORM to `INSERT` records directly into `users`, `tutorProfiles`, `gigs`, `sessions`, and `reviews` tables sequentially to build fully-fleshed out dummy accounts (like Arjun Sharma).

---

## 🛠️ 3. Commonly Used Commands

*   **Start the full stack (Dev mode)**:
    ```bash
    NODE_ENV=development node --env-file=.env --import=tsx server/index.ts
    ```
    *(This runs Vite middleware to serve the frontend and starts the Express API simultaneously on port 5000).*

*   **Push Database Schema Changes**:
    ```bash
    npx drizzle-kit push
    ```
    *(If you alter tables in `shared/schema.ts`, this syncs the PostgreSQL database to match the new schema).*

*   **Seed the Database**:
    ```bash
    NODE_ENV=development node --env-file=.env --import=tsx scripts/seed.ts
    ```
