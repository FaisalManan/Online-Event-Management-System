# Online Event Management System

A full-stack web application for managing events and registrations, built with Node.js, Express, EJS, and MongoDB.

## Stack

| Layer          | Technology                            |
|----------------|---------------------------------------|
| Runtime        | Node.js                               |
| Framework      | Express.js                            |
| Database       | MongoDB + Mongoose                    |
| Auth           | Passport.js + passport-local-mongoose |
| Views          | EJS templates                         |
| Styling        | Bootstrap 5 (CDN) + Bootstrap Icons   |
| Session        | express-session + connect-flash       |
| Config         | dotenv                                |
| Form override  | method-override (PUT/DELETE in forms) |

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — create a `.env` file in the project root:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/event-management
   SESSION_SECRET=your-secret-here
   ```

3. **Make sure MongoDB is running locally**

4. **Start the server**
   ```bash
   # Development (auto-restart with nodemon)
   npm run dev

   # Production
   npm start
   ```

5. Open `http://localhost:3000` — you will land on the login page.

## First Admin Account

Admin accounts **cannot** be created via the public register form (locked to Participant/Organizer only).

**Option A — MongoDB shell (one-time bootstrap):**
```js
// Register normally at /register, then run in mongosh:
use event-management
db.users.updateOne({ username: "yourusername" }, { $set: { role: "Admin" } })
```

**Option B — Once one Admin exists:**
Log in as Admin → go to `/users` → use the **Create New User** form and select the Admin role.

## User Roles

| Role            | Permissions                                                                                                                                         |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Participant** | Browse & search events · Self-register for upcoming events · Cancel own registration · View own registrations only                                  |
| **Organizer**   | All of the above · Create events · Edit & delete **own** events · Add/edit/delete registrations for **own** events · Organizer field locked to self |
| **Admin**       | Full access · Create/edit/delete **any** event · Reassign organizer · Add/edit/delete **any** registration · Create & delete users of any role      |

## Features

| Feature                           | Details                                                                          |
|-----------------------------------|----------------------------------------------------------------------------------|
| Authentication                    | Register, login, logout via `passport-local-mongoose` with hashed passwords     |
| Role-based authorization          | `isLoggedIn`, `isAdmin`, `isOrganizerOrAdmin` middleware on every route          |
| Server-side validation            | Required fields, min/max lengths, email format, past-date check on events        |
| ReDoS protection                  | All `$regex` search inputs are escaped before hitting MongoDB                    |
| Dashboard                         | Scoped stats — Organizer sees own data, Admin/Participant see global totals       |
| Event CRUD                        | Full create/read/update/delete with validation and ownership checks              |
| Event search                      | Filter by event name and/or venue (case-insensitive, escape-sanitised)           |
| Event pagination                  | 6 events per page, search params preserved across pages                          |
| Past event indicators             | Grey row + "Past" badge in list; warning banner + registration blocked on detail |
| Registration CRUD                 | Full create/read/update/delete scoped by role                                    |
| Registration pagination           | 8 registrations per page                                                         |
| Duplicate registration guard      | Unique compound DB index on `{ participant, event }` + friendly error message    |
| Participant self-cancel           | Cancel button on both the registrations list and the event detail page           |
| Organizer registration management | Organizers can add/edit/delete registrations on their own events                 |
| User management                   | Admin can list, search, create (any role), and delete users (cascades data)      |
| Flash messages                    | Success and error alerts on every action, auto-dismissible                       |
| Active navbar links               | Current page highlighted via `currentPath` res.local                            |
| Custom 404 page                   | Friendly not-found page for any unknown route                                    |
| Global error handler              | 500 handler catches unexpected errors without crashing the server                |
| Favicon                           | Custom SVG ticket emoji icon in the browser tab                                  |
| Environment config                | All secrets and URIs in `.env`, never hardcoded                                  |

## Routes

### Authentication

| Method | Route        | Description                                         |
|--------|--------------|-----------------------------------------------------|
| GET    | `/register`  | Show registration form (Participant/Organizer only) |
| POST   | `/register`  | Create new account with server-side validation      |
| GET    | `/login`     | Show login form                                     |
| POST   | `/login`     | Authenticate user via Passport                      |
| GET    | `/logout`    | Log out current user                                |
| GET    | `/dashboard` | Personalised stats dashboard *(login required)*     |

### Events

| Method | Route              | Description                                        |
|--------|--------------------|----------------------------------------------------|
| GET    | `/events`          | List all events with search + pagination (public)  |
| GET    | `/events/new`      | Show add event form *(Organizer/Admin)*            |
| POST   | `/events`          | Save new event with validation *(Organizer/Admin)* |
| GET    | `/events/:id`      | Event details + registrations list                 |
| GET    | `/events/:id/edit` | Show edit form *(owner Organizer or Admin)*        |
| PUT    | `/events/:id`      | Update event *(owner Organizer or Admin)*          |
| DELETE | `/events/:id`      | Delete event + all registrations *(Admin only)*    |

### Registrations

| Method | Route                     | Description                                                          |
|--------|---------------------------|----------------------------------------------------------------------|
| GET    | `/registrations`          | List registrations scoped by role, paginated                         |
| GET    | `/registrations/new`      | Add registration form *(Organizer/Admin)*                            |
| POST   | `/registrations`          | Save registration (self-register or Organizer/Admin add)             |
| GET    | `/registrations/:id/edit` | Edit registration form *(Organizer own events / Admin)*              |
| PUT    | `/registrations/:id`      | Update registration status *(Organizer own events / Admin)*          |
| DELETE | `/registrations/:id`      | Delete *(Admin)* · Cancel own *(Participant)* · Own event *(Organizer)* |

### Users *(Admin only)*

| Method | Route          | Description                                        |
|--------|----------------|----------------------------------------------------|
| GET    | `/users`       | List & search users by username                    |
| POST   | `/users`       | Create new user with any role (including Admin)    |
| DELETE | `/users/:id`   | Delete user + cascade their events & registrations |

## Middleware

| Function              | Purpose                                                    |
|-----------------------|------------------------------------------------------------|
| `isLoggedIn`          | Blocks unauthenticated access, redirects to `/login`       |
| `isAdmin`             | Admin only — redirects to `/dashboard` otherwise           |
| `isOrganizerOrAdmin`  | Organizer or Admin only — redirects to `/events` otherwise |

## Models

### User

| Field              | Type     | Required | Notes                                        |
|--------------------|----------|----------|----------------------------------------------|
| `username`         | String   | Yes      | Added by passport-local-mongoose, unique     |
| `email`            | String   | Yes      | Unique, lowercase, validated with regex      |
| `password`         | String   | Yes      | Hashed by passport-local-mongoose            |
| `role`             | String   | Yes      | Enum: `Admin`, `Organizer`, `Participant`    |
| `registrationDate` | Date     | —        | Defaults to `Date.now`                       |

### Event

| Field         | Type     | Required | Notes                                              |
|---------------|----------|----------|----------------------------------------------------|
| `eventName`   | String   | Yes      | Max 100 characters                                 |
| `eventDate`   | Date     | Yes      | Server-side past-date check on create/update       |
| `venue`       | String   | Yes      | Max 150 characters                                 |
| `description` | String   | —        | Max 2000 characters, defaults to `""`              |
| `organizer`   | ObjectId | Yes      | Ref → User                                         |
| `createdDate` | Date     | —        | Defaults to `Date.now`                             |

### Registration

| Field              | Type     | Required | Notes                                    |
|--------------------|----------|----------|------------------------------------------|
| `participant`      | ObjectId | Yes      | Ref → User                               |
| `event`            | ObjectId | Yes      | Ref → Event                              |
| `registrationDate` | Date     | —        | Defaults to `Date.now`                   |
| `status`           | String   | —        | Enum: `Pending`, `Approved`, `Rejected`  |

> Unique compound index on `{ participant, event }` prevents duplicate registrations.

## Folder Structure

```
├── models/
│   ├── User.js              username, email (validated), role, registrationDate
│   ├── Event.js             eventName (max 100), eventDate, venue (max 150),
│   │                        description (max 2000), organizer (ref), createdDate
│   └── Registration.js      participant (ref), event (ref), registrationDate,
│                             status — unique index: { participant, event }
│
├── routes/
│   ├── auth.js              register (validated), login, logout, dashboard
│   ├── events.js            full CRUD + search + pagination + past-date check
│   ├── registrations.js     full CRUD scoped by role + pagination
│   └── users.js             list, search, create (any role), delete (Admin only)
│
├── middleware/
│   └── index.js             isLoggedIn · isAdmin · isOrganizerOrAdmin
│
├── views/
│   ├── auth/
│   │   ├── login.ejs        login form with autocomplete
│   │   └── register.ejs     registration form (Participant/Organizer only)
│   ├── events/
│   │   ├── EventList.ejs    list + search + pagination + past-event badges
│   │   ├── AddEvent.ejs     create form + live past-date JS warning
│   │   ├── EditEvent.ejs    edit form + live past-date JS warning
│   │   └── EventDetails.ejs detail + registrations + quick register/cancel
│   ├── registrations/
│   │   ├── index.ejs        list + pagination + cancel (Participant) + delete (Admin/Organizer)
│   │   ├── new.ejs          create form — Participants dropdown only
│   │   └── edit.ejs         edit form
│   ├── users/
│   │   └── index.ejs        create user form + list + search (Admin only)
│   ├── partials/
│   │   ├── header.ejs       HTML head + Bootstrap 5 CDN + flash alerts
│   │   ├── navbar.ejs       responsive nav + active link + role badge
│   │   ├── footer.ejs       Bootstrap JS bundle
│   │   └── 404.ejs          custom not-found page
│   └── dashboard.ejs        scoped stats cards + quick actions + recent events
│
├── public/
│   ├── css/style.css        minimal Bootstrap overrides (pagination, warnings)
│   ├── favicon.svg          custom SVG ticket emoji favicon
│   └── images/
│
├── .env                     PORT, MONGO_URI, SESSION_SECRET  ← not committed
├── .gitignore               node_modules/, .env, *.log
├── app.js                   Express entry point + global error handler
└── package.json             all dependencies pinned to exact versions
```
#   O n l i n e - E v e n t - M a n a g e m e n t - S y s t e m  
 