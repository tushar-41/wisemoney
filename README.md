💸 WiseMoney – Smart Expense Sharing App

WiseMoney is a Splitwise-inspired web app that helps users track shared expenses, manage group balances, and settle debts easily. Built using Convex for real-time data, Clerk for secure authentication, and Next.js + React for a modern and responsive interface.

🚀 Features

🔐 Secure authentication using Clerk

⚡ Real-time expense updates using Convex Database

👥 Create groups and add members

💵 Track balances and split expenses

📝 Add, edit, and delete shared expenses

📱 Responsive and user-friendly interface with React + Next.js

💬 Smart balance summary for clear settlements

🛠️ Tech Stack
Category	Technologies
Frontend	React.js, Next.js
Backend/Realtime	Convex
Authentication	Clerk
Styling	Tailwind CSS (if applicable)
State Management	React hooks / Context API
Deployment	Vercel (or similar)
📂 Project Setup
```bash
# Clone the repository
git clone https://github.com/your-repo/wisemoney.git
cd wisemoney

# Install dependencies
npm install

# Run development server
npm run dev
```
#Environment variables
```bash
# Deployment used by `npx convex dev`
CONVEX_DEPLOY_KEY=
CONVEX_DEPLOYMENT=

NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=
RESEND_API_KEY=
```
