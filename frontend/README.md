# ✉️ POSTA — A Digital Post Office Experience

**Posta** is a full-stack, Progressive Web Application (PWA) designed to make digital messaging feel as personal and meaningful as physical letter writing. Built with a clean, vintage aesthetic, users can compose, deliver, unfold, and read digital letters with realistic postmark styling and real-time updates.

---

## ✨ Features

* **📜 Vintage Letter Interface**: Classic paper aesthetic, postmark stamps, and custom typography.
* **📲 Installable PWA**: Standalone app capability across desktop and mobile devices via Service Workers and Web Manifests.
* **📬 Interactive Postbox**: Dedicated Inbox, Sent, and Public Activity Feed sections.
* **🔔 Real-time Notifications**: Live notifications for incoming letters and system alerts.
* **⚡ Modern SPA Architecture**: React frontend powered by Vite for lightning-fast state transitions and UI rendering.
* **🔒 Secure Authentication**: PHP PDO backend with password hashing, secure session management, and prepared SQL statements.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Routing**: [React Router v6](https://reactrouter.com/)

### **Backend & Database**
* **Language**: PHP 8.x
* **Database**: MySQL / MariaDB (PDO for database abstraction)
* **Environment**: XAMPP / Apache

---

## 📂 Project Directory Structure

```text
posta/
├── backend/
│   ├── api/
│   │   ├── letters/          # Feed, Inbox, Sent, and Letter actions
│   │   ├── profile/          # User updates & avatar management
│   │   └── auth/             # Login, Register, Session handlers
│   └── config/
│       ├── database.php      # PDO MySQL Connection
│       └── session.php       # Authentication state checks
│
└── frontend/
    ├── public/
    │   ├── manifest.json     # PWA Configuration
    │   └── sw.js             # Service Worker script
    ├── src/
    │   ├── components/       # Navbar, InstallButton, NotificationDropdown
    │   ├── context/          # Auth Context State Provider
    │   ├── pages/            # Home, Dashboard, Inbox, Profile, WriteLetter
    │   ├── App.jsx           # Application Router
    │   └── main.jsx          # Root React mount
    └── vercel.json           # Vercel SPA rewrite configurations