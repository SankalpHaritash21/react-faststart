#!/usr/bin/env node

import { execa } from "execa";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

// Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt user for input
const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const run = async () => {
  try {
    // Step 1: Get project name from the user
    const projectName = await askQuestion("Enter the name of your project: ");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectDir = path.resolve(__dirname, projectName);

    // Step 2: Check if the directory already exists
    if (fs.existsSync(projectDir)) {
      const overwrite = await askQuestion(
        `Directory '${projectName}' already exists. Overwrite? (y/n): `
      );
      if (overwrite.toLowerCase() !== "y") {
        console.log("Operation cancelled.");
        rl.close();
        return;
      }

      // Remove existing directory if overwrite is confirmed
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    // Step 3: Choose between JavaScript and TypeScript templates
    const templateChoice = await askQuestion(
      "Choose a template (react or react-ts): "
    );
    const template = ["react", "react-ts"].includes(templateChoice)
      ? templateChoice
      : "react"; // Default to React (JavaScript)

    console.log(
      `Creating Vite project '${projectName}' with template '${template}'...`
    );

    // Step 4: Create a new Vite project
    await execa(
      "npx",
      ["create-vite@latest", projectName, "--template", template],
      { stdio: "inherit" }
    );

    // Step 5: Change directory into the newly created project
    process.chdir(projectDir);
    console.log("Vite project created successfully.");

    // Step 6: Install Tailwind CSS and dependencies
    console.log("Installing Tailwind CSS...");
    await execa(
      "npm",
      ["install", "-D", "tailwindcss", "postcss", "autoprefixer"],
      { stdio: "inherit" }
    );

    // Step 7: Initialize Tailwind CSS configuration
    console.log("Initializing Tailwind configuration...");
    await execa("npx", ["tailwindcss", "init", "-p"], { stdio: "inherit" });

    // Step 8: Update `tailwind.config.js` file
    console.log("Configuring Tailwind...");
    const tailwindConfigPath = path.resolve(projectDir, "tailwind.config.js");
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
    await fs.promises.writeFile(tailwindConfigPath, tailwindConfig);

    // Step 9: Create and update the `src/index.css` file
    console.log("Setting up Tailwind styles...");
    const srcDir = path.resolve(projectDir, "src");
    await fs.promises.mkdir(srcDir, { recursive: true }); // Ensure the `src` directory exists

    const indexCSSPath = path.resolve(srcDir, "index.css");
    const tailwindDirectives = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    await fs.promises.writeFile(indexCSSPath, tailwindDirectives);

    // Step 10: Remove `App.css` and create the appropriate `App` file
    const appCssPath = path.resolve(srcDir, "App.css");
    if (fs.existsSync(appCssPath)) {
      console.log("Deleting App.css...");
      await fs.promises.unlink(appCssPath); // Remove App.css
    }

    // Step 11: Reset `App.jsx` or `App.tsx` based on the template
    let appFilePath;
    let appFileContent;

    if (template === "react-ts") {
      // For TypeScript, create `App.tsx`
      appFilePath = path.resolve(srcDir, "App.tsx");
      appFileContent = `import React from 'react';

const App: React.FC = () => {
  return (
    <div>App</div>
  );
}

export default App;
`;
    } else {
      // For JavaScript, create `App.jsx`
      appFilePath = path.resolve(srcDir, "App.jsx");
      appFileContent = `import React from 'react';

const App = () => {
  return (
    <div>App</div>
  );
}

export default App;
`;
    }

    console.log(
      `Resetting ${template === "react-ts" ? "App.tsx" : "App.jsx"}...`
    );
    await fs.promises.writeFile(appFilePath, appFileContent); // Create the appropriate App file

    // Step 12: Final instructions to the user
    console.log(
      "Setup complete! Run the following commands to start your development server:"
    );
    console.log(`cd ${projectName}`);
    console.log("npm run dev");
  } catch (error) {
    console.error("An error occurred:", error.message);
  } finally {
    rl.close();
  }
};

run();
