# DoProof Frontend

This is the React TypeScript frontend for the DoProof application.

## Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── pages/          # Page components
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Application entry point
├── package.json        # Node.js dependencies
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## Dependencies

- React 18 - UI library
- TypeScript - Type safety
- React Router - Client-side routing
- Tailwind CSS - Utility-first CSS framework

## Development

The frontend is configured to proxy API requests to the backend at `http://localhost:5000`.
