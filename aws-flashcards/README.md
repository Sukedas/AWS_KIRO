# AWS Kiro 🌩️

AWS Kiro is an intelligent, AI-powered flashcard and quiz application designed to help users learn and master Amazon Web Services (AWS) concepts. It features dynamic content generation, contextual hints, personalized study recommendations, and a comprehensive progress tracking system.

## Features ✨
- **Dynamic Flashcards**: Generate personalized flashcards tailored to your learning level and desired difficulty using generative AI.
- **Interactive Quizzes**: Test your knowledge with AI-generated multiple-choice questions.
- **Contextual Explanations**: Chat with the AI for deep-dive explanations of AWS concepts based on your learning level.
- **Adaptive Recommendations**: Receive intelligent study recommendations based on your historical progress and weak concepts.
- **Progress Tracking**: Track your mastery across various AWS categories.

## Tech Stack 🛠️
- **Frontend**: Next.js (React), TailwindCSS
- **Backend**: Next.js API Routes, Supabase
- **AI Integration**: Custom prompt engineering with multi-provider failover support
- **Testing**: Vitest, React Testing Library

## Getting Started 🚀

### Prerequisites
- Node.js (v18+)
- Supabase account
- API keys for AI Provider (e.g., Anthropic Claude / OpenAI)

### Installation
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and add your keys
4. Run `npm run dev` to start the development server

## Testing 🧪
We use Vitest for unit testing. To run the test suite:
```bash
npm run test
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
