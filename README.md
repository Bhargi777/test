# Personal Notes App

This is a small web app for writing and organizing personal notes. You can make an account, save notes, add tags, search, and pin notes you want to find quickly.

This guide explains how the app is put together and how its main parts work.

## What the app does

- Lets a user create an account and sign in.
- Lets signed-in users add, edit, and delete notes.
- Lets users add tags to notes, search their notes, and view pinned notes.
- Keeps each user's notes separate from other users' notes.

## How the pieces fit together

The project has a React frontend, an Express API, and a MongoDB database.

1. You use the frontend in your browser. It shows the forms, notes list, search, and buttons.
2. When you do something like save a note, the frontend sends an HTTP request to the API.
3. The API checks the request and confirms who you are.
4. The API reads from or writes to MongoDB, then sends a response back to the frontend.

During development, Vite runs the frontend and forwards requests starting with `/api` to the Express server.

## Project folders

```text
client/
  src/
    App.jsx           Main React app and its screens and interactions
    main.jsx          Starts React and loads the stylesheet
    styles.css        Page layout, colors, and responsive styles
  index.html          Browser page and app title
  vite.config.js      Vite setup and local API proxy

server/
  src/
    app.js                  Express setup and shared middleware
    server.js               Checks configuration, connects to MongoDB, starts API
    middleware/
      authenticate.js       Checks the login cookie on private routes
    models/
      Note.js               MongoDB structure for notes
      User.js               MongoDB structure for users
    routes/
      auth.js               Register, sign in, check session, and sign out
      notes.js              Create, list, edit, and delete notes
  .env.example        Example server configuration

package.json          Root commands, including the command to run both apps
README.md             This guide
```

## Frontend

The frontend is a React app. Most of its behavior is in `client/src/App.jsx`.

### Sign in and account creation

When the app starts, it asks the API whether a login session already exists. If so, it loads the user's notes. Otherwise, it shows the sign-in form. The form can also be switched to account creation.

### Notes screen

The main screen has a sidebar and a list of note cards. The sidebar can show all notes, pinned notes, or notes with a selected tag. Search filters the notes currently loaded in the browser. It checks each note's title, content, and tags.

Notes are sorted with pinned notes first, then by most recently updated. The list, filters, and pinned count update when note data changes.

### Creating and editing notes

The note form has a title, content, tags, and a pinned checkbox. Tags are entered as comma-separated text; the frontend trims them and removes duplicates before sending them to the API. Creating a note sends a `POST` request. Editing sends a `PUT` request. Deleting asks for confirmation before sending a `DELETE` request.

`client/src/styles.css` contains the page styles, including smaller-screen layouts. The design uses basic colors, standard fonts, and simple controls.

### API requests

The `request` helper in `App.jsx` sends requests to `/api` and includes cookies. It turns network and API errors into messages that the forms or page can display.

## Backend

The backend uses Express. `server/src/app.js` sets up JSON parsing, cookies, CORS, the health check, and the route files. `server/src/server.js` loads environment variables, connects to MongoDB, and then starts the API.

### Login and session

- During registration, the API validates the name, email, and password. It hashes the password with bcrypt before saving the user.
- During sign in, it compares the submitted password with the stored hash.
- On successful registration or sign in, the API sets a signed JWT in an HTTP-only cookie. The cookie lasts seven days.
- The authentication middleware reads and verifies that cookie on private routes.
- The API never returns the password hash in a user response.

### Notes and privacy

Each note has an owner, title, content, tags, a pinned flag, and timestamps. Note routes require a valid login. When listing, updating, or deleting notes, the API includes the signed-in user's ID in its database query. This means a user cannot access another user's note just by changing a note ID.

The API validates note fields and limits their lengths before storing them. The browser does some filtering locally; the notes API can also filter a list with `search` and `tag` query parameters.

## API routes

All routes start with `/api`.

| Method | Path | What it does | Login required |
|---|---|---|---|
| `GET` | `/health` | Checks that the API is running | No |
| `POST` | `/auth/register` | Creates an account and starts a session | No |
| `POST` | `/auth/login` | Signs in and starts a session | No |
| `GET` | `/auth/me` | Returns the current user's public account details | Yes |
| `POST` | `/auth/logout` | Clears the login cookie | No |
| `GET` | `/notes` | Lists the current user's notes; accepts `search` and `tag` filters | Yes |
| `POST` | `/notes` | Creates a note | Yes |
| `PUT` | `/notes/:id` | Updates one of the user's notes | Yes |
| `DELETE` | `/notes/:id` | Deletes one of the user's notes | Yes |

The API returns JSON. Validation problems use a `400` response, missing or invalid sessions use `401`, and a note that does not belong to the user is reported as not found.

## Data stored in MongoDB

### User

- `name`
- `email` (unique and stored in lowercase)
- `password` (bcrypt hash; excluded from normal query results)
- `createdAt` and `updatedAt`

### Note

- `user` (the owner)
- `title` (required, up to 200 characters)
- `content` (up to 50,000 characters)
- `tags` (up to 20 tags, each up to 40 characters)
- `pinned` (true or false)
- `createdAt` and `updatedAt`

## Run it locally

You need Node.js, npm, and a MongoDB database. A local MongoDB server or MongoDB Atlas can be used.

1. Install the dependencies:

   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` to your database connection string and set `JWT_SECRET` to a random value with at least 32 characters. Keep the secret private.

3. Start the frontend and API from the project root:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite, usually `http://localhost:5173`.

The frontend uses port `5173`; the API uses port `4000` by default. API endpoints are available directly on port `4000` under `/api`.

## Useful commands

Run these from the project root:

```bash
npm run dev                 # Start the frontend and API for development
npm run build               # Build the frontend for production
npm start                   # Start the API
```

## Try the API with curl

You can call the Express API directly from the Mac terminal, without using the React page. Start MongoDB, then run `npm run dev` from the project root. The API listens on port `4000`.

Start with a public health check:

```bash
curl -i http://localhost:4000/api/health
```

It should return `200 OK` and `{"status":"ok"}`. This checks that the API is running; it does not check whether MongoDB contains notes.

### Register or sign in

For a first demo, register a test account. Use a new email address. This saves the session cookie in a temporary file so the next commands can access protected routes:

```bash
curl -i -c /tmp/notes-app-cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@example.com","password":"demo-password-123"}' \
  http://localhost:4000/api/auth/register
```

For later demos, sign in with that account instead:

```bash
curl -i -c /tmp/notes-app-cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo-password-123"}' \
  http://localhost:4000/api/auth/login
```

Replace the example details with your test account values. Do not use or show a real password in a presentation. Registration returns `201 Created`; login returns `200 OK`. Both set the login cookie. The `-c` option tells `curl` to save it.

### Fetch notes

Use the saved cookie to fetch the signed-in user's notes:

```bash
curl -i -b /tmp/notes-app-cookies.txt \
  http://localhost:4000/api/notes
```

The response is JSON containing a `notes` array. The `-b` option sends the cookie. Without a valid cookie, the protected notes route returns `401 Unauthorized`.

You can also check which account is signed in:

```bash
curl -i -b /tmp/notes-app-cookies.txt \
  http://localhost:4000/api/auth/me
```

### Create a note

Send a JSON body with `POST`. The server adds the signed-in user's ID and creates the timestamps:

```bash
curl -i -b /tmp/notes-app-cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"API demo","content":"Created by sending a request to the API.","tags":["demo","class"],"pinned":false}' \
  http://localhost:4000/api/notes
```

The successful response is `201 Created` and includes the new note. Copy its `id`; you will use it in the update and delete examples.

### Search, update, and delete

The API can filter by search text and tag:

```bash
curl -i -b /tmp/notes-app-cookies.txt \
  "http://localhost:4000/api/notes?search=API%20demo&tag=demo"
```

Update a note with `PUT`. Replace `NOTE_ID` with the `id` returned by the create request:

```bash
curl -i -b /tmp/notes-app-cookies.txt \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{"pinned":true}' \
  http://localhost:4000/api/notes/NOTE_ID
```

The server returns the updated note. This example changes only `pinned`; the route also accepts title, content, and tags.

Delete it with:

```bash
curl -i -b /tmp/notes-app-cookies.txt \
  -X DELETE \
  http://localhost:4000/api/notes/NOTE_ID
```

These requests demonstrate the same API operations used by the React app. They go to Express first; the API validates the request and uses Mongoose to read or update MongoDB. The browser or `curl` does not connect directly to the database.

## View MongoDB data on a Mac

MongoDB uses **databases**, **collections**, and **documents**. Collections are roughly like tables, and documents are roughly like rows, but a document can store structured fields such as arrays.

### View data in MongoDB Compass

1. Make sure the MongoDB server is running and that the API starts successfully.
2. Open MongoDB Compass.
3. Connect using the same MongoDB connection string configured as `MONGODB_URI` in `server/.env`. Keep the connection string private if it includes credentials.
4. Open the database named in the connection string. For the example URI `mongodb://127.0.0.1:27017/personal-notes`, the database is `personal-notes`. Your database name may differ.
5. Open the `notes` collection to see saved notes. Open `users` to see account documents.
6. Leave Compass open, create a note using the `curl` command above or the React app, then refresh the collection. The new note should appear. Pin or edit it and refresh again to see the changed value and `updatedAt`.

A note document contains fields like `_id`, `user`, `title`, `content`, `tags`, `pinned`, `createdAt`, and `updatedAt`. The `user` field is the MongoDB ID of its owner. The API uses it to make sure each account can access only its own notes.

The `users` collection has a `password` field containing a bcrypt hash, not the original password. Use a demo account and harmless sample data when presenting. Do not display real account details or private notes.

### View data with `mongosh`

`mongosh` is the command-line client; it is separate from the MongoDB server. On this Mac, `mongosh` is not installed. If Homebrew is available, install just the shell:

```bash
brew install mongosh
```

Do not install or start a second local MongoDB server just to get the shell. The current `server/.env` points to `127.0.0.1:27017`, and that port is currently provided by an SSH process (a port-forward/tunnel), not a local `mongod` process. Keep that tunnel running while you use the app or connect with Compass/`mongosh`. If the tunnel is stopped, the app cannot reach the database through that address.

Check that the shell is available and that something is listening on the MongoDB port:

```bash
mongosh --version
nc -z 127.0.0.1 27017
```

If `mongosh` is still not found after installation, close and reopen Terminal so it reloads your PATH. With the SSH tunnel active, connect using the app's configured local-forward address:

```bash
mongosh "mongodb://127.0.0.1:27017/personal-notes"
```

If your `MONGODB_URI` is different, use its host and database name instead. Keep the full URI private if it contains credentials. At the `mongosh` prompt, run:

```javascript
show collections
db.notes.find({}, { title: 1, tags: 1, pinned: 1, user: 1, createdAt: 1, updatedAt: 1 }).limit(5)
db.users.find({}, { name: 1, email: 1, createdAt: 1 }).limit(5)
```

The user query intentionally does not display the password hash. To inspect one note in more detail:

```javascript
db.notes.findOne({}, { title: 1, content: 1, tags: 1, pinned: 1, user: 1, createdAt: 1, updatedAt: 1 })
```

After creating or updating a note through the API, run the note query again to see the saved data. For the demo, explain that the `POST` request goes to Express, the server checks the login and fields, adds the owner ID, and then Mongoose saves the document. Avoid adding notes directly in Compass: that bypasses the API's authentication, validation, and owner assignment.

If `show collections` reports that the database or collections are empty, first create an account and a note through the app or the API commands above. MongoDB creates the database and collections when the app first writes documents.
