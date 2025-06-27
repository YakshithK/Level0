# Level0 🎮

**Turn words into worlds** - AI-powered game prototyping in seconds.

Level0 is an AI-powered platform that instantly transforms natural language game design prompts into fully playable 2D Phaser games with editable source code. Instead of limiting creativity to preset configs, Level0 leverages a language model to generate the entire game scene code dynamically—freeing game developers and creators to build without boundaries.

## 🌐 Live Applications

- **[Level0 App](https://level0-app.vercel.app/)** - Main application with AI game generation
- **[Level0 Website](https://level0-nu.vercel.app/)** - Landing page and marketing site

## ✨ Key Features

- **Instant prompt-to-game generation** - Type a game idea and get a working game in seconds
- **Full Phaser Scene class code output** - No intermediate config, just clean, editable JavaScript
- **Playable game preview** - Live in-browser game execution
- **Editable code with live updates** - Monaco editor integration for real-time code editing
- **Supports common platformer mechanics** - Enemies, collectibles, themes, and more
- **User authentication** - Sign up/sign in with Supabase
- **Project management** - Save and manage your generated games

## 🎯 Example Prompts

Users can type game ideas like:
- *"A lava platformer with spikes, double jump, and a portal goal"*
- *"A space shooter with asteroids and power-ups"*
- *"A forest adventure with collectible gems and moving platforms"*

And get a working Phaser game **plus** clean, editable JavaScript code — ready to customize, expand, or fork.

## 🏗️ Project Structure

```
Level0/
├── app/                    # Main application (React + Vite)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   └── lib/           # Utilities
│   └── sql/               # Database schema
├── website/               # Marketing website (React + Vite)
│   └── src/
│       ├── components/    # Website components
│       └── pages/         # Website pages
└── README.md
```

## 🚀 Tech Stack

### Main Application (`app/`)
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **Game Engine**: Phaser 3
- **Code Editor**: Monaco Editor
- **Backend**: Supabase (Auth + Database)
- **AI Integration**: Anthropic Claude API
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM

### Website (`website/`)
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **Deployment**: Vercel

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- WSL (Windows Subsystem for Linux) - Required for development due to OS-specific dependencies

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Level0
   ```

2. **Install dependencies for the main app**
   ```bash
   cd app
   npm install
   ```

3. **Install dependencies for the website**
   ```bash
   cd ../website
   npm install
   ```

### Environment Variables

Create `.env` files in both `app/` and `website/` directories:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic API
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Running the Development Server

**Important**: Due to OS-specific dependencies (like `@anthropic-ai/claude-code`), you must use WSL for development.

1. **Start the main application**
   ```bash
   cd app
   npm run dev
   ```

2. **Start the website** (in a separate terminal)
   ```bash
   cd website
   npm run dev
   ```

3. **Open your browser**
   - Main app: `http://localhost:5173`
   - Website: `http://localhost:5174`

## 🎮 How It Works

1. **User Input**: User describes their game idea in natural language
2. **AI Processing**: Anthropic Claude API analyzes the prompt and generates game configuration
3. **Code Generation**: The system converts the configuration into a complete Phaser 3 Scene class
4. **Game Execution**: The generated code is executed in a sandboxed iframe
5. **Live Editing**: Users can modify the code in real-time using the Monaco editor

## 📊 Database Schema

The application uses Supabase with the following main tables:

- `users` - User authentication and profile data
- `projects` - Generated game projects
- `chat_messages` - Conversation history with AI

## 🚀 Deployment

Both applications are deployed on Vercel:

- **Main App**: Automatically deploys from the `app/` directory
- **Website**: Automatically deploys from the `website/` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Phaser](https://phaser.io/) - The game framework that makes it all possible
- [Anthropic](https://www.anthropic.com/) - AI capabilities
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## 📞 Contact

- **Website**: [https://level0-nu.vercel.app/](https://level0-nu.vercel.app/)
- **App**: [https://level0-app.vercel.app/](https://level0-app.vercel.app/)

---

**Built with ❤️ for the game development community**
