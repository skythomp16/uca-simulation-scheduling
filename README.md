# UCA Simulation Scheduling
This project was written for UCA to determine student availability throughout the week based on student schedules dumped from Banner.

## 🧪 Build Matrix

This project uses GitHub Actions to automatically build and release installers for all major platforms whenever a new version tag (e.g., `v1.0`) is pushed.

| Platform | Status                                                                                                                                 |
|----------|----------------------------------------------------------------------------------------------------------------------------------------|
| 🪟 Windows | ![Windows Build](https://github.com/skythomp16/uca-simulation-scheduling/actions/workflows/build.yml/badge.svg?branch=main&event=push) |
| 🍎 macOS | ![macOS Build](https://github.com/skythomp16/uca-simulation-scheduling/actions/workflows/build.yml/badge.svg?branch=main&event=push)                |
| 🐧 Linux | ![Linux Build](https://github.com/skythomp16/uca-simulation-scheduling/actions/workflows/build.yml/badge.svg?branch=main&event=push)                |

## 🚀 Releasing

To create a new release with installable artifacts:

Push a new version tag, e.g.:
   ```bash
   git tag v1.0
   git push origin v1.0 
   ```

🛠️ Developing

Want to make a change?  To run in dev mode, just do:
   ```bash
   npm run start
   ```