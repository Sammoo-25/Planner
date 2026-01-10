# ⚔️ Life RPG Planner

> **Turn your life into an epic adventure.** Manage tasks, earn XP, and level up your productivity.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active_Development-green.svg)

## 📖 Overview

**Life RPG Planner** is a gamified productivity application designed to make task management engaging and rewarding. By blending traditional todo-list mechanics with RPG (Role-Playing Game) elements, it transforms daily chores into "Quests" and larger goals into "Campaigns".

User actions directly impact their stats:
- **Complete Quests** to earn **XP** and **Level Up**.
- **High Priority Tasks** are "Boss Battles" that grant massive rewards but require breaking them down into tactical subtasks.
- **Fail** to complete tasks or un-check them, and you might lose XP!

## ✨ Key Features

### 🎮 Gamification System
- **XP & Leveling**: Earn Experience Points for every completed task. Watch your level grow as you become more productive.
- **Health System**: Maintain your streak and health by staying consistent.
- **Player Stats**: Track your "character" growth with visual stats and a heatmap of your activity (Simulating GitHub contributions).

### 🛠️ Quest Management
- **Smart Categorization**: Organize quests by category (Work, Personal, Health, etc.).
- **Priority System**:
    - `Low` / `Medium` / `High` / `Critical`.
    - **High & Critical** quests feature a dedicated **Subtask System** (Tactical Steps) with a dynamic progress bar.
- **Deferred Rewards**: For big quests, XP is "banked" as you complete subtasks and released in a huge burst upon final completion.

### 📊 Dashboard & Analytics
- **Interactive Dashboard**: A drag-and-drop kanban-style (or list) view of your current quests.
- **Activity Heatmap**: Visualize your productivity consistency over the year.
- **Radar Chart**: See which areas of your life (Strength, Intellect, Charisma, etc.) are improving based on task categories.

## 🏗️ Tech Stack

### Frontend (Client)
- **Framework**: [Next.js 16](https://nextjs.org/) (React 19) - for high-performance server-side rendering and routing.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - for a sleek, modern, and responsive UI.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) - for simple and scalable global state.
- **Icons**: [Lucide React](https://lucide.dev/) - for beautiful, consistent iconography.
- **Charts**: [Recharts](https://recharts.org/) - for data visualization (Radar charts, Heatmaps).
- **Animations**: CSS Transitions & Tailwind animate capabilities.

### Backend (Server)
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Relational data storage for Users, Tasks, Subtasks, and Stats.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for secure password hashing.
- **Driver**: `pg` (node-postgres).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sammoo-25/Planner.git
   cd Planner
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in `/backend` with:*
   ```env
   PORT=5005
   DB_USER=your_postgres_user
   DB_HOST=localhost
   DB_NAME=planner_db
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=your_secure_secret_key
   ```
   *Start the server:*
   ```bash
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../task-tracker
   npm install
   ```
   *Start the client:*
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any enhancements.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author
**Sammoo-25**
- GitHub: [@Sammoo-25](https://github.com/Sammoo-25)

## 📄 License
This project is licensed under the MIT License.
