# PromptLens

PromptLens is a local Windows application for viewing AI-generation metadata stored in PNG files. It is intended for images saved by AI image tools and browser extensions that write prompts and related information into PNG metadata.

The application is read-only: it never changes the source image. Files are parsed locally on the user's computer and no image, prompt, URL, or file history is uploaded or saved.

Project repository: https://github.com/thejohnd0e/prompt-lens

## What It Shows

For each selected PNG, PromptLens can display:

- Original prompt
- AI system name
- Source URL
- Image preview
- File processing state

Several PNG files can be opened at once. The file list shows the processing state of each file, and selecting a file displays its metadata. Individual values can be copied without changing their text.

## Metadata Sources

PromptLens reads the following PNG metadata sources in this order:

1. XMP from the `iTXt` chunk with keyword `XML:com.adobe.xmp`
2. Prompt fallback from the `iTXt` chunk with keyword `parameters`
3. Source URL from the `tEXt` chunk with keyword `Source`

The XMP reader supports these IPTC AI fields:

- `Iptc4xmpExt:AIPromptInformation`
- `Iptc4xmpExt:AISystemUsed`
- `Iptc4xmpExt:AISystemVersionUsed`
- `Iptc4xmpExt:DigitalSourceType`

EXIF is intentionally not parsed in the current MVP.

## File States

- `ready` - supported metadata was read successfully
- `partial` - only some supported fields are present
- `absent` - no supported AI metadata was found
- `malformed` - PNG, text chunk, or XMP data is damaged
- `unsupported` - the file is not a supported PNG
- `too_large` - the file exceeds the 100 MiB limit
- `read_error` - the file could not be opened or read

An error in one file does not stop processing of the other selected files.

## Privacy And Security

- Windows-only, local operation
- No network requests, telemetry, accounts, or external resources
- Source PNG files are never modified
- No recent-file history or settings are stored
- Maximum input size is 100 MiB
- XML DTDs and entities are rejected
- XML depth, element count, attribute count, and text length are limited
- UTF-8 metadata is validated
- Metadata is rendered as text and is never interpreted as HTML

## User Interface

- Use **Open PNG** to choose one or more files through the system dialog.
- Drag PNG files from Windows Explorer into the application window.
- Select a file in the left-hand list to view its preview and metadata.
- Use **Copy** next to a field to copy its exact value.
- Use the remove button to remove one file from the list.

The application uses a dark theme and adjusts the window height to the displayed content when possible. Windows systems must have Microsoft WebView2 installed. If WebView2 is unavailable, the application should show a native error instead of crashing.

## Technology

- Tauri 2
- Rust stable with the MSVC target
- Vite
- TypeScript
- Vanilla DOM APIs, without React
- `saxes` for restricted XML parsing
- `fflate` for browser-compatible decompression
- Vitest for unit tests

## Development

Install dependencies:

```powershell
npm install
```

Run the frontend development server:

```powershell
npm run dev
```

Run unit tests:

```powershell
npx vitest
```

Run a production frontend build:

```powershell
npm run build
```

Build the Windows release:

```powershell
npm run tauri build -- --no-bundle
```

The portable executable is copied to:

```text
dist/portable/PromptLens.exe
```

The Tauri build also requires Rust, the MSVC build tools, and WebView2 on the target Windows system.

## Testing Scope

The test suite uses synthetic fixtures only. It covers CRC validation, PNG chunks, XMP parsing, XML safety checks, IPTC AI fields, Unicode text, and missing metadata. Real personal prompts and URLs must not be added to fixtures.

## Current Scope

PromptLens currently supports PNG reading only. It does not edit metadata, export JSON or CSV, scan folders, maintain file history, associate itself with `.png` files, update automatically, or provide macOS/Linux/ARM64 builds.

## License

No license has been selected for this project yet.
