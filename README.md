# SquadMatch  Squad Management App ✨

SquadMatch is a dynamic application designed for creating, managing, and balancing teams for various games and activities. It helps organizers and players form equitable teams based on skill levels and tracks match outcomes.

## 🌟 Features

*   **👤 Player Management**: Add, edit, and remove players with skill ratings and DiceBear avatars.
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
*   **🔒 Authentication**: Secure user accounts with Firebase Authentication.
*   **☁️ Cloud & Local Data**:
    *   Player and match data stored in Firebase Firestore for logged-in users.
    *   Fallback to local storage for guest users.
*   **🎨 Modern UI**:
    *   Sleek purple/blue interface built with Tailwind CSS.
    *   Smooth animations using Framer Motion.
    *   Lucide Icons for a clean look.
*   **🌐 Discovery & Search**: Homepage with match discovery and search functionality (details might vary based on implementation).

## 💻 Tech Stack

*   **Frontend**: React 18 + TypeScript
*   **Styling**: Tailwind CSS
*   **Animations**: Framer Motion
*   **Icons**: Lucide Icons
*   **Backend & Database**: Firebase (Authentication & Firestore)
*   **Build Tool**: Vite
*   **Deployment**: Netlify (via GitHub Actions)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm (comes with Node.js)
*   A Firebase project set up with Authentication and Firestore enabled.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd squadmatch-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase configuration:**
    *   Create a `.env.local` file in the root of the project.
    *   Add your Firebase project's configuration details to this file. Example:
        ```env
        VITE_FIREBASE_API_KEY="your_api_key"
        VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
        VITE_FIREBASE_PROJECT_ID="your_project_id"
        VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
        VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
        VITE_FIREBASE_APP_ID="your_app_id"
        ```
    *   You can find these details in your Firebase project settings.
    *   The application uses these environment variables in `src/lib/firebase.ts`.

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
2.  ⚙️ **Set up Node.js**: Configures the Node.js environment (version 18).
3.  📦 **Install Dependencies**: Runs `npm ci` to install all project dependencies.
4.  🛠️ **Build Application**: Executes `npm run build` to create a production-ready build in the `./dist` directory. This step requires Firebase environment variables to be available (see secrets below).
5.  ☁️ **Deploy to Netlify**: Uses the `nwtgck/actions-netlify@v2.0` action to deploy the contents of the `./dist` folder to your Netlify site.

### Required GitHub Secrets for Deployment

To enable successful automated deployments, you must configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions > New repository secret`):

*   `NETLIFY_AUTH_TOKEN`: Your Netlify Personal Access Token. You can generate this from your Netlify user settings (User settings > Applications > Personal access tokens).
*   `NETLIFY_SITE_ID`: The API ID or Site ID of your site on Netlify. You can find this in your Netlify site's settings (Site details > Site information > API ID).
*   `VITE_FIREBASE_API_KEY`: Your Firebase project's API Key.
*   `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase project's Auth Domain.
*   `VITE_FIREBASE_PROJECT_ID`: Your Firebase project's Project ID.
*   `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase project's Storage Bucket.
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase project's Messaging Sender ID.
*   `VITE_FIREBASE_APP_ID`: Your Firebase project's App ID.

These `VITE_FIREBASE_` secrets are used during the `npm run build` step to embed the correct Firebase configuration into your application.

---

Enjoy managing your squads with SquadMatch! 🎉
