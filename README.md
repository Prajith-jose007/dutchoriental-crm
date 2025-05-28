
# DutchOriental CRM (Next.js Application)

This is a Next.js CRM application.

## Prerequisites

*   **Node.js and npm:** Make sure you have Node.js installed (which includes npm). Download from [nodejs.org](https://nodejs.org/).
*   **Git:** For version control.
*   **(Optional but Recommended for Database) WAMP/MAMP/LAMP or standalone MySQL Server:** If you intend to connect to a MySQL database, you'll need a MySQL server running. WAMP (for Windows), MAMP (for macOS), or LAMP (for Linux) are common stacks that include MySQL.

## Environment Configuration

Create a `.env.local` file in the root of your project for database credentials and other environment-specific settings:

```env
DB_HOST=localhost
DB_USER=your_mysql_user       # e.g., dutchcrm or root for local WAMP
DB_PASSWORD=your_mysql_password # e.g., Dutchoriental or empty for default local WAMP root
DB_DATABASE=megabauk_dutchcrm
DB_PORT=3306                  # Default MySQL port

# Example for Genkit (if using AI features, update with your API key)
GOOGLE_API_KEY=YOUR_GOOGLE_AI_STUDIO_API_KEY
```
**Important:** Add `.env.local` to your `.gitignore` file to prevent committing sensitive credentials.

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
    *   If using WAMP/MAMP/LAMP, start the MySQL service from its control panel.
    *   Ensure your database (`megabauk_dutchcrm`) exists and the user specified in `.env.local` has the necessary permissions.
    *   If you haven't populated your database yet, you can run the data migration script (see "Data Migration" section below after ensuring your tables are created).

4.  **Run the Next.js Development Server:**
    ```bash
    npm run dev
    ```
    This command usually starts the Next.js development server on port 9003 (e.g., `http://localhost:9003`). Check your terminal output for the exact URL.

5.  **Access the Application:**
    Open your web browser and navigate to the URL shown in your terminal (e.g., `http://localhost:9003`).

6.  **(Optional) Run Genkit Development Server (for AI features):**
    If you are working on or testing AI features using Genkit:
    *   Open a **new terminal window/tab**.
    *   Navigate to the project's root directory.
    *   Run: `npm run genkit:dev` or `npm run genkit:watch`.
    *   The Genkit server will run on a separate port (usually 4000 or 3100).

## Data Migration (Populating MySQL Database)

If you have created your database tables and want to populate them with the initial placeholder data:

1.  Ensure your MySQL server is running and your `.env.local` is correctly configured.
2.  Make sure your database tables (`agents`, `leads`, `yachts`, `invoices`, `users`) are created and their column names match the `INSERT` statements in `scripts/migrate-data.ts`. You might need to adjust the script.
3.  Run the migration script:
    ```bash
    npm run migrate:data
    ```
    This script uses `tsx` to execute the TypeScript migration file.

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
    This command executes `node server.js`, which starts your Next.js application in production mode. It will typically listen on port 3000 (or the port specified by the `PORT` environment variable if set).

3.  **Configure Apache as a Reverse Proxy:**
    *   This step involves editing Apache's configuration files (e.g., `httpd.conf`, or a virtual host configuration file for `localhost`). **These files are part of your WAMP installation, not your Next.js project.**
    *   You'll need to enable Apache modules like `mod_proxy`, `mod_proxy_http`.
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
*   **Environment Variables:** Ensure any necessary environment variables (like database credentials from `.env.local`) are accessible to the Node.js process when started via `npm start`. If you are running `npm start` manually in a terminal, it should pick up `.env.local`. If using a service manager or cPanel's Node.js setup in a real deployment, you'd configure environment variables there.
*   **This is for Local Simulation:** This reverse proxy setup on a local WAMP server is primarily for testing how your app might behave behind a proxy. For actual production deployment, dedicated Node.js hosting platforms (like Vercel, Netlify, or managed Node.js hosting) are generally preferred for Next.js applications due to better optimization and easier configuration.

## Deployment

For deploying to a live server, Vercel (from the creators of Next.js) is highly recommended. Other options include Netlify, AWS Amplify, Google Cloud Run, or traditional Node.js hosting. These platforms typically handle the build and server running process for you.
If deploying to a cPanel environment that supports Node.js, you would typically upload your project files (including the `.next` folder after running `npm run build`), configure the Node.js app selector to point to your `server.js` as the startup file, and ensure `npm install` has been run.
```