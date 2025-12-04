Musi Windows - Standalone EXE Build (Ready-to-Build)

This package is configured to build a Windows installer (.exe) using electron-builder.
I cannot compile a Windows exe inside this environment, but this repository is fully prepared so you can:

A) Build locally on a Windows machine with Node.js installed:
   1. Open PowerShell in the project folder
   2. npm install
   3. npm run dist
   The installer will be created in the dist/ folder.

B) Build automatically on GitHub Actions (recommended):
   1. Create a new GitHub repository and push this project
   2. On GitHub, go to Actions -> run the workflow (or push to main)
   3. After the workflow finishes, download the artifact named 'musi-windows-installer' from the workflow run.

Notes:
- For YouTube search, add your API key to src/renderer.js into the apiKey variable.
- For distribution, obtain a code-signing certificate and configure electron-builder signing options.
