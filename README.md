<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1j9NOAZgw4E-7uWAf4vL_cyPnkCgZAur9

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Troubleshooting

### White Screen Issue

If you encounter a white screen when running `npm run dev`, ensure the following:

1. **Entry Script Tag**: The `index.html` file must include the entry point script tag:

   ```html
   <script type="module" src="/index.tsx"></script>
   ```

   This tells Vite to load and process the React application entry point.

2. **No Import Maps**: The `index.html` should NOT contain `<script type="importmap">` tags. Import maps are used for browser-native ESM modules without a bundler, but this project uses Vite which bundles everything from `node_modules`. Having import maps conflicts with Vite's module resolution and causes a white screen.

3. **No Duplicate Declarations**: Ensure there are no duplicate variable/component declarations. For example, if you import `X` from `lucide-react`, don't also declare a local `const X` component in the same file.

### Fixed Issues

The following issues were resolved to make the app work with Vite:

- **Removed importmap script**: The `<script type="importmap">` block was removed from `index.html` as it conflicted with Vite's bundling system.
- **Added entry script tag**: Added `<script type="module" src="/index.tsx"></script>` to `index.html` to properly load the React application.
- **Fixed duplicate X component**: Removed duplicate `X` component declaration in `components/Budget.tsx` (was both imported from `lucide-react` and declared locally).
