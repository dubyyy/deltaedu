# DeltaEDU - AI-Powered Educational Platform

An intelligent learning platform built for Delta State students that transforms study materials into interactive learning experiences using AI.

## 🌐 Live Demo

**[View Live Application](https://deltaedu-starter.vercel.app/)**

The platform is deployed and accessible at: https://deltaedu-starter.vercel.app/

## 🌟 Features

- **Smart Note Upload**: Upload PDFs, Word documents, or text files
- **AI Tutor**: Chat with an AI tutor powered by Google Gemini
- **Auto Quiz Generation**: Generate practice quizzes from your study materials
- **Study Progress Tracking**: Monitor your learning journey
- **WAEC/JAMB Preparation**: Specialized quiz formats for Nigerian exams
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq (Llama 3.3 70B) - Free and Fast!
- **File Upload**: react-dropzone
- **File Parsing**: pdf-parse, mammoth
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Groq API key (free at https://console.groq.com/keys)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/big14way/deltaedu.git
cd deltaedu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your credentials

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🤝 Contributing

We welcome contributions! This is an MVP and there are many areas for improvement.

**See [CONTRIBUTING.md](CONTRIBUTING.md) for:**
- List of all issues and features needed
- Priority levels (High/Medium/Low)
- Detailed implementation guides
- How to pick and work on tasks

**Quick Start for Contributors:**
1. Check [CONTRIBUTING.md](CONTRIBUTING.md) for available tasks
2. Assign yourself to an issue
3. Create a branch: `git checkout -b feature/your-feature`
4. Implement the solution following the guide
5. Create a Pull Request

## 📊 Project Status

**Current Version:** MVP (Minimum Viable Product)

**What's Working:**
- ✅ User authentication and registration
- ✅ Notes upload (PDF, DOCX, TXT)
- ✅ AI Tutor with context-aware responses
- ✅ Quiz generation with Groq AI
- ✅ Quiz taking interface with results

**What Needs Work:**
- ⚠️ Dashboard statistics (placeholder data)
- ⚠️ Recent activity tracking
- ⚠️ Quiz history and persistence
- ⚠️ Study time tracking
- ⚠️ Search functionality
- ⚠️ Mobile responsiveness
- ⚠️ Error handling improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete list of 26+ improvement areas.

## 📝 License

MIT License - feel free to use this project for your educational needs!

---

Built with ❤️ for Delta State students • Delta Tech Week Hackathon 2025
