#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execa } from "execa";
import inquirer from "inquirer";
import { fileURLToPath } from "url";
import { checkAppName } from "./src/helper/reactApp.js";

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split(".");
const major = semver[0];
const error = chalk.red;

if (major < 17) {
  console.log(
    error(
      "You are running Node " +
        currentNodeVersion +
        ".\n" +
        "npx react-faststart requires Node 17 or higher. \n" +
        "Please update your version of Node."
    )
  );
  process.exit(1);
}

// Validate the project name based on security requirements
const validateProjectName = (name) => {
  checkAppName(name);
  const validName = /^[a-z][a-z0-9_]*$/.test(name);
  if (!validName) {
    console.log(
      error(
        "Error: Project name must start with a letter and can only contain lowercase letters, numbers, and underscores."
      )
    );
    return false;
  }
  return true;
};

const setUpTailwindCSS = async (projectName, templateChoice) => {
  process.chdir(projectName);

  // Step 5: Install dependencies and configure the project
  console.log("Installing Tailwind CSS...");
  await execa(
    "npm",
    ["install", "-D", "tailwindcss", "postcss", "autoprefixer"],
    { stdio: "inherit" }
  );

  console.log(chalk.green("Dependencies installed successfully!"));

  // Step 6: Initialize Tailwind CSS configuration
  console.log("Initializing Tailwind configuration...");
  await execa("npx", ["tailwindcss", "init", "-p"], { stdio: "inherit" });

  // Step 7: Update `tailwind.config.js` file
  console.log("Configuring Tailwind...");
  const tailwindConfigPath = path.resolve("tailwind.config.js");
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

  // Step 8: Create and update the `src/index.css` file
  console.log("Setting up Tailwind styles...");
  const srcDir = path.resolve("src");
  await fs.promises.mkdir(srcDir, { recursive: true });

  const indexCSSPath = path.resolve(srcDir, "index.css");
  const tailwindDirectives = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await fs.promises.writeFile(indexCSSPath, tailwindDirectives);

  // Step 9: Remove `App.css` and create the appropriate `App` file
  const appCssPath = path.resolve(srcDir, "App.css");
  if (fs.existsSync(appCssPath)) {
    console.log("Deleting App.css...");
    await fs.promises.unlink(appCssPath);
  }

  // Step 10: Reset `App.jsx` or `App.tsx` based on the template
  const appFilePath = path.join(
    srcDir,
    templateChoice === "react-ts" ? "App.tsx" : "App.jsx"
  );
  const appFileContent = `import React from 'react';

  const App${templateChoice === "react-ts" ? ": React.FC" : ""} = () => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <header className="text-center">
          <h1 className="text-5xl font-extrabold mb-4">Welcome to My Tailwind App</h1>
          <p className="text-lg font-light">A React project styled with Tailwind CSS</p>
        </header>
        <main className="mt-8">
          <a href="https://www.npmjs.com/package/react-faststart" target="_blank" className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-md shadow-lg hover:bg-blue-100 transition">
            Get Started
          </a>
        </main>
      </div>
    );
  };
  
  export default App;
  `;

  console.log(
    `Resetting ${templateChoice === "react-ts" ? "App.tsx" : "App.jsx"}...`
  );
  await fs.promises.writeFile(appFilePath, appFileContent);
};

const run = async () => {
  try {
    // Step 1: Get project name from the user
    const { projectNameInput } = await inquirer.prompt([
      {
        type: "input",
        name: "projectNameInput",
        message: "Enter the name of your project:",
        validate: (input) =>
          validateProjectName(input) || "Invalid project name.",
      },
    ]);

    let projectName = projectNameInput.toLowerCase().replace(/\s+/g, "_");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectDir = path.resolve(__dirname, projectName);

    // Step 2: Check if the directory already exists
    if (fs.existsSync(projectDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `Directory '${projectName}' already exists. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(error("Operation cancelled."));
        return;
      }

      // Remove existing directory if overwrite is confirmed
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    // Step 3: Choose between JavaScript and TypeScript templates
    const { templateChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "templateChoice",
        message: "Choose a template:",
        choices: ["react", "react-ts"],
        default: "react",
      },
    ]);

    console.log(
      chalk.green(
        `Creating Vite project '${projectName}' with template '${templateChoice}'...`
      )
    );

    // Step 4: Create a new Vite project
    await execa(
      "npx",
      ["create-vite@latest", projectName, "--template", templateChoice],
      { stdio: "inherit" }
    );

    console.log(chalk.green("Project created successfully!"));
    console.log(chalk.blue("-----------------------------------"));

    // Check default or tailwind css installation

    const { setupChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "setupChoice",
        message: "Choose your project setup:",
        choices: ["Default", "Tailwind CSS"],
      },
    ]);

    if (setupChoice === "Tailwind CSS") {
      // Tailwind CSS Setup
      await setUpTailwindCSS(projectName, templateChoice);
    } else {
      await execa("npm", ["install"], { stdio: "inherit" });
    }

    // Step 11: Final instructions to the user
    console.log(
      "Setup complete! Run the following commands to start your development server:"
    );
    console.log(`cd ${projectName}`);
    console.log("npm run dev");
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

run();
