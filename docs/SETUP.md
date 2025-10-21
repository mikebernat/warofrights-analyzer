# Setup Instructions

## Prerequisites

You need Node.js and npm installed. Here are the installation steps:

### For WSL/Ubuntu:

```bash
# Update package list
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### For Windows:

Download and install Node.js from: https://nodejs.org/ (LTS version recommended)

## Installation Steps

1. Navigate to the project directory:
```bash
cd /home/mike/Sites/WarOfRights-LogAnalyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown (typically http://localhost:5173)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Troubleshooting

### npm command not found
- Make sure Node.js is installed: `node --version`
- If not installed, follow the prerequisites section above

### Port already in use
- The dev server will automatically try another port
- Or specify a port: `npm run dev -- --port 3000`

### Module not found errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Quick Start

If you just want to test the application without installing dependencies:

1. Make sure you have the 4 example log files in the project root
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Upload one of the example log files to see the analysis
