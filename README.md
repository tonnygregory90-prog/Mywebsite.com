# CampusDesk Student Directory

A responsive, dependency-free student directory built with HTML, CSS, and JavaScript.

## Features

- Search students by name, student ID, phone, email, or identification
- Sort the directory by name or student ID
- Add and persist records in browser local storage
- Validate student form fields and detect duplicate IDs
- Export the filtered directory to CSV
- Responsive desktop and mobile layouts
- Keyboard-accessible dialog and reduced-motion support

## Run locally

Open `index.html` directly in a modern browser, or serve the folder locally:

```powers
cd "C:\Users\Other users\Desktop\Mywebsite.com"
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Data storage

The initial records are the two records from the original HTML table. New records and changes are stored in the current browser's local storage; no server or database is required.
