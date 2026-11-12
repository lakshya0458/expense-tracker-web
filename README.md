# Expense Tracker (Web)

A simple, fast expense tracker that runs entirely in your browser. Built with React, Vite and Tailwind CSS. It's the web version of my PyQt5 expense tracker.

## Features

- Add, edit and delete expenses with a name, amount (₹), category and date
- 8 categories with icons: Food, Transport, Shopping, Entertainment, Education, Health, Bills & Rent, Other
- Filter by month, category, or search by name
- Monthly summary: total spent, number of transactions, top category
- Category breakdown showing where your money went
- Monthly budget with a progress bar that turns amber at 80% and red when you go over
- Export the current view to CSV
- Data is saved in your browser's localStorage, so no account or server is needed
- "Load sample data" button to try it out quickly

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/lakshya0458/expense-tracker-web.git
cd expense-tracker-web
npm install
npm run dev
```

Then open the link Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
```

The production files go into `dist/`.

## Tech stack

- [React 19](https://react.dev)
- [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Lucide](https://lucide.dev) icons
