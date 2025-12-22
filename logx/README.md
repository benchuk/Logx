# log(x)

A cross-platform Electron application for log file viewing and analysis.

## Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

## Project Setup

Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode (Electron App)

Run the Electron app in development mode with hot-reload:

```bash
npm run electron_serve
```

This will:
- Start the Vue.js development server
- Launch the Electron application window
- Enable hot-reload for code changes

### Web Development Mode (Browser Only)

Run the Vue.js app in the browser (for web-only development):

```bash
npm run serve
```

The app will be available at `http://localhost:8080/`

## Building for Production

### Build Electron App (Cross-Platform)

Build the Electron application for your current platform:

```bash
npm run electron_build
```

This will create platform-specific installers in the `dist_electron/` directory:
- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: AppImage or other distribution format

### Build Web Version Only

Build the Vue.js app for web deployment:

```bash
npm run build
```

Output will be in the `dist/` directory.

## Other Commands

### Lint Code

```bash
npm run lint
```

## Platform-Specific Notes

- **macOS**: The build will create a `.dmg` file
- **Windows**: The build will create an `.exe` installer
- **Linux**: The build will create an AppImage or other format depending on configuration

## Troubleshooting

If you encounter OpenSSL errors, make sure you're using Node.js 17+ with the `--openssl-legacy-provider` flag (already configured in the scripts).

## References

- [Vue CLI Configuration](https://cli.vuejs.org/config/)
- [Electron Builder](https://www.electron.build/)
- [Vue CLI Plugin Electron Builder](https://github.com/nklayman/vue-cli-plugin-electron-builder)

Slider component:
https://jqueryui.com/slider/#slider-vertical
