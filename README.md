# Spinematch 📚

A feature-rich React Native mobile application for reading and managing books with support for multiple file formats (EPUB, PDF and TXT). Books sit in a swipeable card deck: swipe right to read, left or up to skip. Built with Expo and optimized for smooth performance.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Important: Development Build Required](#important-development-build-required)
- [Key Architecture Decisions](#key-architecture-decisions)
- [Tech Stack](#tech-stack)
- [Development Workflow](#development-workflow)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [References & Resources](#references--resources)

## Features

✨ **Core Reading Capabilities**
- 📖 EPUB, PDF and TXT file support
- 📄 EPUB and PDF rendering through Readium, with vertical or horizontal PDF scrolling
- 🎯 Jump to specific pages
- 🔄 Auto-save reading progress
- 📍 Resume from saved position

🎨 **User Experience**
- Clean, intuitive interface with a swipeable card deck
- Dark/Light theme support
- Automatic reading session tracking (starts on open, saves on close or when the app goes to the background)
- Real-time progress indication
- Toast notifications and in-app confirmation dialogs

📚 **Book Management**
- Add books from device storage through the system file picker
- Title, author, genre and cover read automatically from the file (EPUB metadata and embedded cover, PDF properties and first page)
- Generated covers for books without one, with the option to pick a custom cover
- Edit book details and covers, or delete books, from Profile → My Books
- View reading streaks and statistics
- Persistent local storage with AsyncStorage
- Reading history and session management
- Delete all books and data from Settings

⚡ **Performance**
- Readium native rendering for EPUB and PDF
- Debounced position saves, flushed immediately when the reader closes
- Efficient state management with Zustand
- Memory-efficient file handling (size limits on metadata parsing)

## Project Structure

```
bookApp/
├── app/                          # App routes & screens (file-based routing)
│   ├── index.tsx                # Home screen: swipeable book deck and streak
│   ├── add-book.tsx             # Add a book: file picker, auto-filled details and cover
│   ├── edit-book/
│   │   └── [bookId].tsx         # Edit details and cover, delete a book
│   ├── my-books.tsx             # Full list of the user's books
│   ├── profile.tsx              # Profile with recent books preview
│   ├── settings.tsx             # Data deletion, version, privacy policy
│   ├── reader/
│   │   ├── _layout.tsx
│   │   └── [bookId].tsx         # EPUB/PDF/TXT reader with automatic session tracking
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── BookCard.tsx             # Swipeable deck card with cover and details overlay
│   ├── ConfirmationDialog.tsx   # Reusable confirmation modal
│   ├── FloatingMenu.tsx         # Home screen menu
│   ├── GeneratedCover.tsx       # Cover drawn from title and author
│   ├── StreakDisplay.tsx        # Reading streak card
│   ├── book/                    # Book form and list components
│   │   ├── BookDetailsFields.tsx # Title, author and genre inputs
│   │   ├── BookListItem.tsx     # Book row with cover and progress
│   │   └── CoverEditor.tsx      # Cover preview with change/remove actions
│   └── reader/                  # Reader-specific components
│       ├── ReaderHeader.tsx     # Header with title & page counter
│       ├── ReadiumReader.tsx    # EPUB/PDF view, positions and table of contents
│       ├── Toast.tsx            # Toast notification component
│       ├── JumpToPageModal.tsx  # Jump to page input modal
│       ├── TxtNavigation.tsx    # TXT file navigation controls
│       └── PdfNavigation.tsx    # PDF navigation & orientation
├── constants/                    # App-wide constants
│   ├── colors.ts                # Colors and shadows
│   ├── spacing.ts               # Spacing and border radius
│   ├── typography.ts            # Fonts and text styles
│   ├── genres.ts                # Genre list
│   └── links.ts                 # External URLs (privacy policy)
├── stores/                       # Zustand state management
│   ├── booksStore.ts            # Books/library state
│   ├── readingStore.ts          # Reading sessions, streaks and stats
│   └── uiStore.ts               # UI state
├── services/                     # Business logic & services
│   ├── localStorage.ts          # AsyncStorage persistence
│   ├── bookFiles.ts             # Copies book and cover files into app storage
│   ├── bookMetadata.ts          # Picks the metadata reader for a file type
│   ├── epubMetadata.ts          # EPUB title, author, subjects and cover
│   └── pdfMetadata.ts           # PDF document properties
├── types/                        # Shared TypeScript types
├── utils/                        # Helpers (dates, base64, sorting, cover picking)
├── plugins/                      # Expo config plugins for Android build settings
├── patches/                      # pnpm patches for third-party packages
├── docs/                         # Privacy policy (published with GitHub Pages)
├── assets/                       # Fonts, images and branding sources
├── app.config.ts                 # Expo app configuration
├── eas.json                      # EAS build profiles
├── pnpm-workspace.yaml           # pnpm settings, build approvals and patches
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md
```

## Installation

### Prerequisites
- **Node.js** >= 18.x
- **pnpm** (this project uses pnpm; its lockfile and patches require it)
- **EAS CLI** (`npm install -g eas-cli`) for development and release builds

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookApp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment** (optional)
   - Edit `app.config.ts` for app name, version, permissions and platform-specific settings
   - Native build settings are applied by the config plugins in `plugins/` and `expo-build-properties`

⚠️ **Important**: The app requires a **development build**. See [Development Build Required](#important-development-build-required) section below.

## Running the App

### Development Mode

Start the development server:
```bash
pnpm start
```

**Open on different platforms:**
- **Android**: Press `a` in terminal (requires a development build installed on the emulator or device)
- **iOS**: Press `i` in terminal (requires Xcode on macOS)
- **Web**: Press `w` in terminal
- **⚠️ Expo Go**: ~~Scan QR code with Expo Go app~~ **NOT SUPPORTED** - the reader and PDF covers require native modules

> **Note**: The app requires a development build to run on physical devices or emulators due to its native modules.

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

## Important: Development Build Required

**The app requires a development build** because it uses native modules that cannot run in the bare Expo Go environment.

### Why Development Build is Required

- **Native Dependencies**: `react-native-readium` (EPUB/PDF rendering) and `react-native-pdf-thumbnail` (PDF covers) require native code compilation
- **Config Plugins**: Custom plugins in `plugins/` adjust the Android build (desugaring, Kotlin opt-in for Readium, network security)
- **Patched Packages**: `patches/` modifies `react-native-readium` native code, which only takes effect in a native build

### Supported Runners

✅ **Supported:**
- Android Studio Emulator
- iOS Simulator (macOS only)
- Physical Android/iOS devices with development build installed
- Web (limited reader support)

❌ **Not Supported:**
- Expo Go (no native module support)
- Snack (no native compilation)

### Creating a Development Build

To create a development build for testing on a physical device:

**For Android:**
```bash
eas build --platform android --profile development
```

**For iOS:**
```bash
eas build --platform ios --profile development
```

Rebuild the development client whenever native dependencies, patches or `app.config.ts` change. This requires EAS (Expo Application Services) account setup. See [Expo Development Build Docs](https://docs.expo.dev/develop/development-builds/introduction/) for detailed instructions.

### Build Profiles

| Profile | Command | Output |
|---------|---------|--------|
| development | `eas build -p android --profile development` | Dev client APK, connects to `pnpm start` |
| preview | `eas build -p android --profile preview` | Standalone release APK for testing |
| production | `eas build -p android --profile production` | Signed AAB for Google Play |

Release builds are minified with R8. Test a `preview` build before shipping, because debug builds do not catch missing keep rules.

### Alternative: Use Emulator/Simulator

For development, use the emulator/simulator locally:
```bash
pnpm android    # Android emulator
pnpm ios        # iOS simulator
```

Local Android builds need a JDK (`JAVA_HOME`) and the Android SDK (`ANDROID_HOME`).

## Key Architecture Decisions

### Reading Engine
EPUB and PDF are both rendered by **Readium** (`react-native-readium`) through one `ReadiumReader` component; TXT is split into pages in JavaScript:
- Reading position is stored as a Readium locator and restored when the book opens
- Position saves are debounced by 500ms and flushed immediately when the reader closes
- Readium Kotlin toolkit 3.3.0 reports PDF pages one too high, so displayed pages, jumps and restored positions are corrected, and a PDF counts as finished on its second-to-last page because the last page is never reported
- Readium's own position label is hidden by a patch because the header already shows the page

### Reading Sessions
- Sessions start when a book has loaded and are saved when the reader closes or the app goes to the background
- Sessions shorter than 10 seconds are ignored as accidental opens
- Sessions drive the reading streak and total reading time

### Book Metadata
- **EPUB**: unzipped with `fflate` to read the package document (title, author, subjects) and the embedded cover (EPUB 2 and EPUB 3 cover markers)
- **PDF**: document properties read with `pdf-lib`; the first page is rendered as the cover with `react-native-pdf-thumbnail`
- **TXT**: title from the file name; generated cover
- Subjects are mapped onto the app's genre list; very large files skip metadata parsing

### State Management
- **Zustand**: Global state for books, reading sessions, and streaks
- **AsyncStorage**: Persistent local storage for books, progress and reading history
- **App storage**: Book files and covers are copied into the app's document directory so the OS cannot purge them
- **React Hooks**: Component-level state for UI (modals, toasts, etc.)

### Component Architecture
- **Extracted Components**: All UI elements abstracted into reusable, testable components
- **Separation of Concerns**: Reader logic isolated from presentation
- **Props-based Communication**: Clean component interfaces for flexibility
- **Shared Forms**: Add and edit book screens share the cover and details components

### Android Build
- `withReadiumKotlinOptIn` opts Readium into `kotlin.time.ExperimentalTime`, which it needs under the app's Kotlin version
- `withAndroidDesugaring` enables core library desugaring at the version the Readium toolkit requires
- R8 keep rules for Readium and ViewModel constructors prevent release-build crashes when opening a book
- Storage, media, camera and microphone permissions are blocked; books and covers come through the system file and photo pickers

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React Native | 0.88.1 |
| **Platform** | Expo | ~58.0.23 |
| **Language** | TypeScript | ~5.9.2 |
| **Navigation** | Expo Router | ~58.0.30 |
| **State** | Zustand | ^5.0.16 |
| **Storage** | AsyncStorage | 2.2.0 |
| **EPUB/PDF** | react-native-readium | ^5.3.0 |
| **PDF Covers** | react-native-pdf-thumbnail | ^2.0.0 |
| **PDF Metadata** | pdf-lib | ^1.17.1 |
| **EPUB Metadata** | fflate | ^0.8.3 |
| **File System** | expo-file-system | ~58.0.13 |
| **Image Picker** | expo-image-picker | ~58.0.10 |
| **Icons** | @expo/vector-icons | ^15.0.2 |
| **Safe Area** | react-native-safe-area-context | ~5.11.1 |

## Development Workflow

### Key Screens

**Home Screen** (`app/index.tsx`)
- Swipeable deck of books, most recently active first
- Swipe right to read, left or up to skip
- Show reading streaks

**Reader Screen** (`app/reader/[bookId].tsx`)
- Full-featured EPUB/PDF/TXT reader
- Automatic reading session tracking
- Jump to page functionality
- Responsive controls for file type

**Add / Edit Book** (`app/add-book.tsx`, `app/edit-book/[bookId].tsx`)
- Details and cover filled in from the file
- Custom cover, re-read cover from the book, delete

**Profile, My Books and Settings** (`app/profile.tsx`, `app/my-books.tsx`, `app/settings.tsx`)
- Recent books preview and full book list
- Delete all data, app version, privacy policy

**Reader Components** (`components/reader/`)
- Modular, reusable UI for reader features
- Independent styling and logic
- Easy to test and maintain

### Adding New Features

1. **New Route**: Create file in `app/` directory (file-based routing)
2. **New Component**: Create in `components/` with props interface
3. **New State**: Add to appropriate Zustand store or create new store
4. **New Service**: Add to `services/` directory
5. **New Constants**: Add to the matching file in `constants/`
6. **Native Change**: Update `app.config.ts`, a config plugin or a patch, then create a new development build

### Patching a Dependency

```bash
pnpm patch <package>@<version>
# edit the files in the printed folder, then:
pnpm patch-commit <printed folder>
```

On Windows, deep native paths can exceed the path length limit. Run the commit with git long paths enabled for that command:
```bash
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.longpaths GIT_CONFIG_VALUE_0=true pnpm patch-commit <printed folder>
```

### Code Standards

- TypeScript strictly enforced
- Components use functional syntax with hooks
- Proper typing for all props and state
- Memoization for performance-critical components
- Descriptive naming conventions

## Performance Optimization

- **Code Splitting**: Lazy-loaded screens via Expo Router
- **Image Optimization**: Proper caching and sizing; generated covers need no image files
- **State Updates**: Debounced heavy operations
- **Memory Management**: Ref cleanup and circular dependency avoidance
- **Metadata Parsing**: Size limits keep large EPUB and PDF files from being read into memory

## Troubleshooting

### Release build crashes when opening a book
- ✅ **Solution**: R8 removed a class Readium creates by reflection. Keep rules live in `app.config.ts` under `expo-build-properties` → `extraProguardRules`
- Reproduce with a `preview` build and read the stack trace with `adb logcat -d AndroidRuntime:E '*:S'`

### Reading progress not saving
- Check `services/localStorage.ts` for save logic
- Position saves are debounced in `components/reader/ReadiumReader.tsx` and flushed when the reader closes

### Native change not showing up
- Patches, config plugins and `app.config.ts` changes only apply after a new development build

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
- [react-native-readium](https://github.com/5-stones/react-native-readium) - EPUB and PDF rendering
- [Readium Kotlin Toolkit](https://github.com/readium/kotlin-toolkit) - Native reading engine on Android
- [react-native-pdf-thumbnail](https://github.com/songsterq/react-native-pdf-thumbnail) - PDF page rendering
- [pdf-lib](https://pdf-lib.js.org/) - PDF metadata
- [fflate](https://github.com/101arrowz/fflate) - ZIP decompression for EPUB
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

## Privacy

The app stores everything on the device and makes no network calls. See the [privacy policy](https://sim-codes.github.io/bookApp/privacy.html), published from `docs/privacy.html`.

## License

This project is private and proprietary.

## Support & Contact

For issues, questions, or suggestions, please refer to the project documentation or create an issue in the repository.

---

**Last Updated**: November 2026  
**Status**: Active Development
