# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

Node.js and npm (or yarn): Make sure you have Node.js installed on your system. npm (Node Package Manager) comes with Node.js. You can download it from nodejs.org. This project uses npm based on the package.json and lack of yarn.lock.
Steps to Run Locally:

Download/Clone the Code:

If you have the project files, ensure you're in the root directory of the project (the one containing package.json).
Install Dependencies:

Open your terminal or command prompt.
Navigate to the project's root directory.
Run the following command to install all the necessary packages defined in package.json:
npm install
This might take a few minutes depending on your internet connection.
Run the Development Server:

Once the dependencies are installed, you can start the Next.js development server. The package.json specifies the command for this:
npm run dev
This command executes next dev --turbopack -p 9002.
next dev: Starts Next.js in development mode.
--turbopack: Uses Turbopack for faster development builds.
-p 9002: Specifies that the application should run on port 9002.
Access the Application:

After the server starts successfully, you'll typically see a message in your terminal like:
✓ Ready in x.xxs
STARTED server on 0.0.0.0:9002, url: http://localhost:9002
Open your web browser (like Chrome, Firefox, etc.) and go to the following address: http://localhost:9002
(Optional) Run Genkit Development Server (for AI features):

If you are working on or testing features that use Genkit (the AI toolkit), you'll need to run its development server as well.
Open a new terminal window/tab (keep the Next.js server running in the first one).
Navigate to the project's root directory again.
Run one of the following commands:
For a single start:
npm run genkit:dev
This executes genkit start -- tsx src/ai/dev.ts.
To watch for changes in Genkit files and restart automatically:
npm run genkit:watch
This executes genkit start -- tsx --watch src/ai/dev.ts.
The Genkit server usually runs on a different port (e.g., 4000 or 3100, it will tell you in the terminal) and is used by your Next.js app to communicate with AI models.
That's it! You should now have the "DutchOriental CRM" application running locally on your machine. Changes you make to the code will typically hot-reload in the browser automatically.


