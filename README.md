
# aqualeads CRM (Next.js Application)

This is a Next.js CRM application designed for aqualeads. It utilizes Next.js for the frontend and backend API routes, React for UI components, ShadCN UI for pre-built components, Tailwind CSS for styling, and connects to a MySQL database.

## Prerequisites

*   **Node.js and npm:** Make sure you have Node.js installed (which includes npm). Download from [nodejs.org](https://nodejs.org/).
*   **Git:** For version control.
*   **(Required) WAMP/MAMP/LAMP or standalone MySQL Server:** You need a MySQL server running. WAMP (for Windows), MAMP (for macOS), or LAMP (for Linux) are common stacks that include MySQL. This project expects MySQL for its database.

## Environment Configuration

Before running the application, you need to set up your environment variables for the database connection.

1.  **Create `.env.local` file:**
    In the root directory of your project, create a file named `.env.local`.
2.  **Add Database Credentials:**
    Add the following lines to your `.env.local` file, replacing the placeholder values with your actual WAMP/MySQL credentials:

    ```env
    DB_HOST=localhost
    DB_USER=dutchcrm          # Your WAMP/MySQL username (e.g., root or a specific user)
    DB_PASSWORD=Dutchoriental     # Your WAMP/MySQL password
    DB_DATABASE=megabauk_dutchcrm # The name of your database
    DB_PORT=3306              # The MySQL port (default is 3306)

    # Example for Genkit (if using AI features, update with your API key)
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_STUDIO_API_KEY
    ```

**Important:** Add `.env.local` to your `.gitignore` file to prevent committing sensitive credentials to your Git repository.

## Running the Application Locally (Development Mode)

This is the recommended way to run the application while you are developing features. In this setup, WAMP (or your chosen MySQL server) primarily provides the MySQL database service. The Next.js application runs its own development server.

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

2.  **Install Dependencies:**
    Open your terminal in the project root directory and run:
    ```bash
    npm install
    ```

3.  **Ensure MySQL Server is Running:**
    *   Start the MySQL service from your WAMP/MAMP/LAMP control panel.
    *   Ensure your database (`megabauk_dutchcrm`) exists and the user specified in `.env.local` has the necessary permissions.
    *   If you haven't populated your database yet, you can run the data migration script (see "Data Migration" section below) after ensuring your tables are created.

4.  **Run the Next.js Development Server:**
    In your terminal, run:
    ```bash
    npm run dev
    ```
    This command starts the Next.js development server, usually on port `9003` (e.g., `http://localhost:9003` as per your `package.json`). Check your terminal output for the exact URL.

5.  **Access the Application:**
    Open your web browser and navigate to the URL shown in your terminal (e.g., `http://localhost:9003`).
    Your Next.js app will connect to the MySQL database provided by WAMP. Apache is not serving the Next.js app directly in this development mode.

6.  **(Optional) Run Genkit Development Server (for AI features):**
    If you are working on or testing AI features using Genkit:
    *   Open a **new terminal window/tab**.
    *   Navigate to the project's root directory.
    *   Run: `npm run genkit:dev` or `npm run genkit:watch`.
    *   The Genkit server will run on a separate port (usually 4000 or 3100).

## Data Migration (Populating MySQL Database)

If you have created your database tables (e.g., `agents`, `leads`, `yachts`, `invoices`, `users`) and want to populate them with the initial placeholder data:

1.  Ensure your MySQL server is running and your `.env.local` is correctly configured.
2.  Make sure your database tables are created and their column names match the `INSERT` statements in `scripts/migrate-data.ts`. You might need to adjust the script if your table/column names differ from the script's defaults.
3.  Run the migration script:
    ```bash
    npm run migrate:data
    ```
    This script uses `tsx` to execute the TypeScript migration file. It will attempt to insert the data from `src/lib/placeholder-data.ts` into your database. Note: While the UI refers to "Bookings," the underlying database table is named `leads`.

## Running the Application in a Production-like Mode with WAMP/Apache (Advanced Local Setup)

If you want to test a setup where Apache (from WAMP) serves your Next.js application (e.g., to access it via `http://localhost/` instead of `http://localhost:9003/`), you need to configure Apache as a reverse proxy. This is more complex and simulates a deployment scenario.

1.  **Build the Next.js Application for Production:**
    In your project root, run:
    ```bash
    npm run build
    ```
    This creates an optimized build in the `.next` folder.

2.  **Start the Next.js Production Server:**
    Run:
    ```bash
    npm start
    ```
    This command executes `node server.js` (as per your `package.json`), which starts your Next.js application in production mode. It will typically listen on port 3000 (or the port specified by the `PORT` environment variable if set).

3.  **Configure Apache as a Reverse Proxy:**
    *   This step involves editing Apache's configuration files (e.g., `httpd.conf`, or a virtual host configuration file for `localhost`). **These files are part of your WAMP installation, not your Next.js project.**
    *   You'll need to ensure Apache modules like `mod_proxy` and `mod_proxy_http` are enabled.
    *   Add directives to proxy requests from Apache to your running Next.js application.
    *   **Example (conceptual, actual directives may vary based on your WAMP version and setup):**
        ```apache
        # Ensure these modules are loaded in your httpd.conf
        # LoadModule proxy_module modules/mod_proxy.so
        # LoadModule proxy_http_module modules/mod_proxy_http.so

        <VirtualHost *:80>
            ServerName localhost
            # Or ServerName your-local-project.test if you've set up a custom local domain

            ProxyPreserveHost On
            ProxyRequests Off # Important for security

            # Forward requests to your Next.js app running on port 3000
            ProxyPass / http://localhost:3000/
            ProxyPassReverse / http://localhost:3000/

            <Location />
                Require all granted
                </Location>

                ErrorLog "logs/yourproject-error.log"
                CustomLog "logs/yourproject-access.log" common
            </VirtualHost>
            ```
            *   You might need to place this configuration within your WAMP Apache's virtual host setup (e.g., in `httpd-vhosts.conf` if you are using it).
            *   **Consult WAMP/Apache documentation for detailed instructions on configuring reverse proxies and virtual hosts.**

            4.  **Restart Apache:**
            After modifying Apache's configuration, restart the Apache service using your WAMP control panel.

            5.  **Access Your Application via Apache:**
            Open your web browser and go to `http://localhost` (or the `ServerName` you configured). Apache should now forward requests to your Next.js application.

            **Important Notes for WAMP/Apache Setup:**

            *   **Node.js on Server:** The machine running WAMP must also have Node.js installed to execute `node server.js`.
            *   **Environment Variables:** Ensure any necessary environment variables (like database credentials from `.env.local`) are accessible to the Node.js process when started via `npm start`. If you are running `npm start` manually in a terminal, it should pick up `.env.local`.
            *   **This is for Local Simulation:** This reverse proxy setup on a local WAMP server is primarily for testing how your app might behave behind a proxy. For actual production deployment, dedicated Node.js hosting platforms are generally preferred.

            ## Deployment

            For deploying to a live server, Vercel (from the creators of Next.js) is highly recommended. Other options include Netlify, AWS Amplify, Google Cloud Run, or traditional Node.js hosting. These platforms typically handle the build and server running process for you.

            If deploying to a cPanel environment that supports Node.js, you would typically:
            1.  Upload your project files (including the `.next` folder after running `npm run build` locally, `package.json`, `server.js`, and your `public` folder).
            2.  Use cPanel's "Setup Node.js App" feature.
            3.  Set the "Application root" to the directory where you uploaded your files.
            4.  Set the "Application startup file" to `server.js`.
            5.  Run `npm install` via the cPanel interface.
            6.  Ensure your production environment variables (like database credentials) are set in the cPanel Node.js app settings.
            7.  Start the application.
