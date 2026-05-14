# Match Squad  Squad Management App ✨

Match Squad is a dynamic application designed for creating, managing, and balancing teams for various games and activities. It helps organizers and players form equitable teams based on skill levels and tracks match outcomes.


## 🌟 Features

*   **👤 Player Management**: Add, edit, and remove players with skill ratings, DiceBear avatars, and multi-position tags (primary + secondary/tertiary) for smarter auto-placement.
*   **🛠️ Skill-Based Team Generation**: Automatically create balanced teams using a snake draft algorithm.
*   **🔄 Drag & Drop Team Editor**:
    *   Rearrange players within a team.
    *   Move players between teams.
    *   Swap players between teams.
    *   Real-time visual skill balance indicators.
*   **🏆 Match Creation & Tracking**:
    *   Set up matches with generated or manually edited teams.
    *   Record match results and winners.
    *   Public/private match visibility options.
*   **📊 Match History & Stats**: View past matches and player performance (wins, matches played).
*   **🔒 Authentication**: Secure user accounts with Supabase Auth (Google OAuth).
*   **☁️ Cloud & Local Data**:
    *   Player and match data stored in Supabase (PostgreSQL) for logged-in users.
    *   Fallback to local storage for guest users.
*   **🎨 Modern UI**:
    *   Sleek purple/blue interface built with Tailwind CSS.
    *   Smooth animations using Framer Motion.
    *   Lucide Icons for a clean look.
*   **🌐 Discovery & Search**: Homepage with match discovery and search functionality (details might vary based on implementation).

## 💻 Tech Stack

*   **Frontend**: React 19 + TypeScript
*   **Styling**: Tailwind CSS v4
*   **Animations**: Framer Motion
*   **Icons**: Lucide Icons
*   **Backend & Database**: Supabase (Auth & PostgreSQL)
*   **Build Tool**: Vite
*   **Deployment**: Netlify (via GitHub Actions)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v20 LTS or later recommended)
*   npm (comes with Node.js)
*   A Supabase project set up with Auth (Google OAuth) and database tables for players and matches.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd matchsquad-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase configuration:**
    *   Create a `.env.local` file in the root of the project.
    *   Add your Supabase project's configuration details to this file. Example:
        ```env
        VITE_SUPABASE_URL="https://your-project.supabase.co"
        VITE_SUPABASE_ANON_KEY="your_anon_key"
        ```
    *   You can find these details in your Supabase project settings under API.
    *   The application uses these in `src/lib/supabase.ts`.

### Running the Development Server

1.  **Start the Vite development server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to `http://localhost:5173` (or the port Vite assigns).

## CI/CD & Deployment 🚀

This project is configured for continuous deployment to **Netlify** via **GitHub Actions**. The workflow is defined in `.github/workflows/deploy-netlify.yml`.

### Automated Workflow

On every push to the `main` branch, the GitHub Action will automatically perform the following steps:
1.  🛎️ **Checkout Code**: Fetches the latest code from your repository.
2.  ⚙️ **Set up Node.js**: Configures the Node.js environment (version 20 LTS).
3.  📦 **Install Dependencies**: Runs `npm ci` to install all project dependencies.
4.  🛠️ **Build Application**: Executes `npm run build` to create a production-ready build in the `./dist` directory. This step requires Firebase environment variables to be available (see secrets below).
5.  ☁️ **Deploy to Netlify**: Uses the `nwtgck/actions-netlify@v2.0` action to deploy the contents of the `./dist` folder to your Netlify site.

### Required GitHub Secrets for Deployment

To enable successful automated deployments, you must configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions > New repository secret`):

*   `NETLIFY_AUTH_TOKEN`: Your Netlify Personal Access Token. You can generate this from your Netlify user settings (User settings > Applications > Personal access tokens).
*   `NETLIFY_SITE_ID`: The API ID or Site ID of your site on Netlify. You can find this in your Netlify site's settings (Site details > Site information > API ID).
*   `VITE_SUPABASE_URL`: Your Supabase project URL.
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.

These `VITE_SUPABASE_` secrets are used during the `npm run build` step to embed the correct Supabase configuration into your application.

---


Enjoy managing your squads with Match Squad! 🎉
