# BookApp 📚

A feature-rich React Native mobile application for reading and managing books with support for multiple file formats (PDF and TXT). Built with Expo and optimized for smooth performance.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Important: Development Build for PDF Support](#important-development-build-for-pdf-support)
- [Key Architecture Decisions](#key-architecture-decisions)
- [Tech Stack](#tech-stack)
- [Development Workflow](#development-workflow)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [References & Resources](#references--resources)

## Features

✨ **Core Reading Capabilities**
- 📖 PDF and TXT file support
- 📄 Smooth continuous scrolling with stable PDF rendering
- 🎯 Jump to specific pages
- 🔄 Auto-save reading progress
- 📍 Resume from saved position

🎨 **User Experience**
- Clean, intuitive interface
- Dark/Light theme support
- Reading session tracking with start/pause functionality
- Real-time progress indication
- Toast notifications for user feedback

📚 **Book Management**
- Add books from device storage
- View reading streaks and statistics
- Persistent local storage with AsyncStorage
- Reading history and session management

⚡ **Performance**
- Imperative PDF rendering (no prop feedback loops)
- Optimized page change handling with debouncing
- Efficient state management with Zustand
- Memory-efficient file handling

## Project Structure

```
bookApp/
├── app/                          # App routes & screens (file-based routing)
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Home/Library screen
│   │   └── explore.tsx          # Explore screen
│   ├── reader/
│   │   └── [bookId].tsx         # PDF/TXT reader with session management
│   ├── modal.tsx                # Modal navigation setup
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── reader/                  # Reader-specific components
│   │   ├── ReaderHeader.tsx     # Header with title & page counter
│   │   ├── Toast.tsx            # Toast notification component
│   │   ├── ConfirmationDialog.tsx # Reusable confirmation modal
│   │   ├── JumpToPageModal.tsx  # Jump to page input modal
│   │   ├── TxtNavigation.tsx    # TXT file navigation controls
│   │   └── PdfNavigation.tsx    # PDF file navigation & orientation
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui/
│       ├── collapsible.tsx
│       └── icon-symbol.tsx
├── constants/                    # App-wide constants
│   └── theme.ts                 # Colors, spacing, typography
├── hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
├── stores/                       # Zustand state management
│   ├── useBooksStore.ts         # Books/library state
│   └── useReadingStore.ts       # Reading sessions state
├── services/                     # Business logic & services
│   └── booksStorage.ts          # File system operations
├── assets/                       # Static assets
│   └── images/
├── scripts/
│   └── reset-project.js
├── app.json                      # Expo app configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md
```

## Installation

### Prerequisites
- **Node.js** >= 18.x
- **npm** or **pnpm** (this project uses pnpm)
- **Expo CLI** (optional, but recommended)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookApp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment** (optional)
   - Edit `app.json` for app name, version, and platform-specific settings
   - Platform-specific config plugins are already configured for PDF support

⚠️ **Important**: PDF reading functionality requires a **development build**. See [Development Build for PDF Support](#important-development-build-for-pdf-support) section below.

## Running the App

### Development Mode

Start the development server:
```bash
pnpm start
# or
npm run start
```

**Open on different platforms:**
- **Android**: Press `a` in terminal (requires Android Studio Emulator)
- **iOS**: Press `i` in terminal (requires Xcode on macOS)
- **Web**: Press `w` in terminal
- **⚠️ Expo Go**: ~~Scan QR code with Expo Go app~~ **NOT SUPPORTED** - PDF functionality requires native modules

> **Note**: The app requires a development build to run on physical devices or emulators due to native PDF support.

### Android Build
```bash
pnpm android
```

### iOS Build
```bash
pnpm ios
```

### Web Build
```bash
pnpm web
```

### Linting
```bash
pnpm lint
```

## Important: Development Build for PDF Support

**PDF reading functionality in this app requires a development build** because the app uses native modules (`react-native-pdf`) that cannot run in the bare Expo Go environment.

### Why Development Build is Required

- **Native Dependencies**: The `react-native-pdf` library requires native code compilation
- **Config Plugins**: Dependencies on `@config-plugins/react-native-pdf` for native module integration
- **File System Access**: PDF rendering requires low-level file system permissions

### Supported Runners

✅ **Supported:**
- Android Studio Emulator
- iOS Simulator (macOS only)
- Physical Android/iOS devices with development build installed
- Web (limited PDF support)

❌ **Not Supported:**
- Expo Go (no native module support)
- Snack (no native compilation)

### Creating a Development Build

To create a development build for testing on a physical device:

**For Android:**
```bash
eas build --platform android --profile preview
```

**For iOS:**
```bash
eas build --platform ios --profile preview
```

This requires EAS (Expo Application Services) account setup. See [Expo Development Build Docs](https://docs.expo.dev/develop/development-builds/introduction/) for detailed instructions.

### Alternative: Use Emulator/Simulator

For development, use the emulator/simulator locally:
```bash
pnpm android    # Android emulator
pnpm ios        # iOS simulator
```

## Key Architecture Decisions

### PDF Rendering Strategy
The app uses **imperative ref-based control** for PDF navigation instead of prop-driven state to prevent rendering loops:
- Direct page control via `ref.setPage()` for jumps and resumed sessions
- Page tracking through `onPageChanged` callbacks without prop feedback
- 300ms debounce on page change saves to optimize storage operations

### State Management
- **Zustand**: Global state for books, reading sessions, and streaks
- **AsyncStorage**: Persistent local storage for reading history
- **React Hooks**: Component-level state for UI (modals, toasts, etc.)

### Component Architecture
- **Extracted Components**: All UI elements abstracted into reusable, testable components
- **Separation of Concerns**: Reader logic isolated from presentation
- **Props-based Communication**: Clean component interfaces for flexibility

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React Native | 0.81.5 |
| **Platform** | Expo | ~54.0.33 |
| **Language** | TypeScript | 5.9.2 |
| **Navigation** | Expo Router | ~6.0.23 |
| **State** | Zustand | ^5.0.12 |
| **Storage** | AsyncStorage | ^2.2.0 |
| **PDF** | react-native-pdf | ^7.0.4 |
| **File System** | expo-file-system | ~19.0.21 |
| **Icons** | @expo/vector-icons | ^15.0.3 |
| **UI Feedback** | expo-haptics | ~15.0.8 |
| **Safe Area** | react-native-safe-area-context | ~5.6.0 |

## Development Workflow

### Key Screens

**Home Screen** (`app/(tabs)/index.tsx`)
- Display all books in library
- Quick access to continue reading
- Show reading streaks

**Reader Screen** (`app/reader/[bookId].tsx`)
- Full-featured PDF/TXT reader
- Automatic reading session tracking
- Jump to page functionality
- Responsive controls for file type

**Reader Components** (`components/reader/`)
- Modular, reusable UI for reader features
- Independent styling and logic
- Easy to test and maintain

### Adding New Features

1. **New Route**: Create file in `app/` directory (file-based routing)
2. **New Component**: Create in `components/` with props interface
3. **New State**: Add to appropriate Zustand store or create new store
4. **New Service**: Add to `services/` directory
5. **New Constants**: Update `constants/theme.ts`

### Code Standards

- TypeScript strictly enforced
- Components use functional syntax with hooks
- Proper typing for all props and state
- Memoization for performance-critical components
- Descriptive naming conventions

## Performance Optimization

- **Code Splitting**: Lazy-loaded screens via Expo Router
- **Image Optimization**: Proper caching and sizing
- **State Updates**: Debounced heavy operations
- **Memory Management**: Ref cleanup and circular dependency avoidance
- **PDF Rendering**: Imperative navigation prevents re-render loops

## Troubleshooting

### PDF crashes on fast scrolling
- ✅ **Solution**: App uses imperative ref-based navigation to prevent render loops
- Check `app/reader/[bookId].tsx` for debounce configuration

### Reading progress not saving
- Verify AsyncStorage permissions
- Check `services/booksStorage.ts` for save logic
- Confirm 300ms debounce delay is adequate

### App won't start
```bash
# Clear cache and reinstall
pnpm install
pnpm start -c
```

### TypeScript errors
```bash
# Validate TypeScript
npx tsc --noEmit
```

## References & Resources

### Expo Documentation
- [Expo Docs](https://docs.expo.dev/) - Complete framework documentation
- [Expo Router](https://docs.expo.dev/routing/introduction/) - File-based routing
- [Config Plugins](https://docs.expo.dev/config-plugins/introduction/) - Native module configuration

### React Native
- [React Native Docs](https://reactnative.dev/) - Core framework
- [React Hooks](https://react.dev/reference/react/hooks) - Hook API reference
- [React Native API Reference](https://reactnative.dev/docs/flatlist)

### Libraries
- [Zustand Docs](https://github.com/pmndrs/zustand) - State management
- [react-native-pdf](https://github.com/wonday/react-native-pdf) - PDF rendering
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) - Persistent storage
- [@expo/vector-icons](https://icons.expo.fyi/) - Icon library

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Language reference
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) - React + TS patterns

## Contributing

1. Create feature branches for new features
2. Follow TypeScript and code standards
3. Test on multiple platforms before commit
4. Update documentation for significant changes

## License

This project is private and proprietary.

## Support & Contact

For issues, questions, or suggestions, please refer to the project documentation or create an issue in the repository.

---

**Last Updated**: March 2026  
**Status**: Active Development
