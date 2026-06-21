# 🎟 EventHub — Online Event Management System

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?logo=mongodb)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap)
![License](https://img.shields.io/badge/License-MIT-blue)

A full-stack **Online Event Management System** built with **Node.js, Express.js, MongoDB, EJS, and Bootstrap 5**.

The application provides a complete platform for creating, managing, and registering for events with secure authentication and role-based access control.

------------------------------------------------------------------------------------

# 🚀 Overview

EventHub allows users to discover events, register for upcoming events, and manage registrations.

The system supports three user roles:

- **Participant**
- **Organizer**
- **Admin**

Each role has different permissions and access levels.

------------------------------------------------------------------------------------

# ✨ Features

## 🔐 Authentication

- User registration and login
- Secure password hashing
- Passport.js authentication
- Session-based login system
- Logout functionality

------------------------------------------------------------------------------------

# 👥 Role-Based Access Control


| Role        | Features                                                                                            |
|-------------|-----------------------------------------------------------------------------------------------------|
| Participant | Browse events, search events, register for events, cancel own registrations, view own registrations |
| Organizer   | Create events, update/delete own events, manage registrations for own events                        |
| Admin       | Complete system control, manage users, events, and all registrations                                |


------------------------------------------------------------------------------------

# 📅 Event Management


| Feature       | Description                                      |
|---------------|--------------------------------------------------|
| Create Events | Organizers/Admins can create events              |
| Update Events | Modify event details                             |
| Delete Events | Remove events                                    |
| Search        | Search events by name and venue                  |
| Pagination    | Paginated event listing                          |
| Past Events   | Detect and block registration for expired events |


------------------------------------------------------------------------------------

# 📝 Registration System


| Feature                 | Description                                      |
|-------------------------|--------------------------------------------------|
| Self Registration       | Participants can register themselves             |
| Registration Management | Organizers/Admins can manage registrations       |
| Status Control          | Pending, Approved, Rejected                      |
| Cancellation            | Participants can cancel their registrations      |
| Duplicate Protection    | Prevent duplicate event registration             |

------------------------------------------------------------------------------------

# 👤 User Management (Admin)

Admins can:

- View users
- Search users
- Create users
- Assign roles
- Delete users
- Remove related data automatically

------------------------------------------------------------------------------------

# 📊 Dashboard

Role-based dashboard showing:


| User        | Dashboard Data                          |
|-------------|-----------------------------------------|
| Participant | Personal registrations and events       |
| Organizer   | Own events and registration statistics  |
| Admin       | Complete system statistics              |


------------------------------------------------------------------------------------

# 🛠️ Tech Stack


| Category          | Technology                 |
|-------------------|----------------------------|
| Runtime           | Node.js                    |
| Backend           | Express.js                 |
| Database          | MongoDB                    | 
| ODM               | Mongoose                   |
| Authentication    | Passport.js                |
| Password Security | passport-local-mongoose    |
| Template Engine   | EJS                        |
| Frontend          | Bootstrap 5                | 
| Icons             | Bootstrap Icons            |
| Sessions          | express-session            |
| Flash Messages    | connect-flash              | 
| Configuration     | dotenv                     |
| Form Support      | method-override            |


------------------------------------------------------------------------------------

# 📂 Project Structure

```
Online-Event-Management-System/

├── models/
│   ├── User.js
│   ├── Event.js
│   └── Registration.js
│
├── routes/
│   ├── auth.js
│   ├── events.js
│   ├── registrations.js
│   └── users.js
│
├── middleware/
│   └── index.js
│
├── views/
│   ├── auth/
│   ├── events/
│   ├── registrations/
│   ├── users/
│   ├── partials/
│   └── dashboard.ejs
│
├── public/
│   ├── css/
│   ├── images/
│   └── favicon.svg
│
├── app.js
├── package.json
├── .env
└── README.md
```

------------------------------------------------------------------------------------

# ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/FaisalManan/Online-Event-Management-System.git
```

```bash
cd Online-Event-Management-System
```

------------------------------------------------------------------------------------

### 2. Install Dependencies

```bash
npm install
```

------------------------------------------------------------------------------------

### 3. Environment Setup

Create a `.env` file:

```env
PORT=3000

MONGO_URI=mongodb://127.0.0.1:27017/event-management

SESSION_SECRET=your-secret-key
```

---

### 4. Start MongoDB

Make sure MongoDB service is running.

------------------------------------------------------------------------------------

### 5. Run Application

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Open:

```
http://localhost:3000
```

------------------------------------------------------------------------------------

# 🗃️ Database Models

## User


| Field            | Type                            |
|------------------|---------------------------------|
| username         | String                          |
| email            | String                          |
| password         | String                          |
| role             | Admin / Organizer / Participant |
| registrationDate | Date                            |


------------------------------------------------------------------------------------

## Event


| Field       | Type      |
|-------------|-----------|
| eventName   | String    |
| eventDate   | Date      |
| venue       | String    |
| description | String    |
| organizer   | ObjectId  |
| createdDate | Date      |


------------------------------------------------------------------------------------

## Registration


| Field            | Type                          |
|------------------|-------------------------------|
| participant      | ObjectId                      |
| event            | ObjectId                      |
| registrationDate | Date                          |
| status           | Pending / Approved / Rejected |


------------------------------------------------------------------------------------

# 🔒 Security

- Server-side validation
- Protected routes
- Role authorization middleware
- Password hashing
- Environment variables
- Sanitized search queries
- Global error handling

------------------------------------------------------------------------------------

# 🖥️ Screenshots

Add screenshots:

```
screenshots/

login.png
dashboard.png
events.png
registrations.png
```

------------------------------------------------------------------------------------

# 🔮 Future Improvements

- Email notifications
- Online payments
- Event reminders
- Calendar integration
- REST API
- React frontend
- Cloud deployment

------------------------------------------------------------------------------------

# 👨💻 Author

**Faisal Manan**

GitHub:  
https://github.com/FaisalManan

LinkedIn:  
https://www.linkedin.com/in/faisal-manan-94775a29b/

------------------------------------------------------------------------------------

⭐ If you find this project useful, consider giving it a star!



