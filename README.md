# Cortex

An on-device, AI-enhanced local research assistant and knowledge hub built with Next.js and LangChain.

## Overview

Cortex is a powerful knowledge management system that combines local document storage with AI capabilities to help you organize, search, and interact with your research and notes. All processing happens locally, ensuring your data remains private and secure.

## Key Features

- 📝 **Project-based Organization**: Organize your knowledge into projects with multiple pages
- 🤖 **AI-Enhanced Search**: Vector-based semantic search powered by FAISS and Ollama
- 💬 **Contextual Chat**: Interact with your documents through natural language
- 📊 **Smart Widgets**: Dynamic UI components for better information visualization
- 🌙 **Dark/Light Mode**: Full theme support for comfortable viewing
- 📤 **File Import**: Support for text documents with expandable format support

## Technical Stack

### Frontend
- Next.js 14
- React 18
- TailwindCSS
- Zustand for state management

### Backend & AI
- LangChain for AI orchestration
- FAISS for vector storage
- Ollama for local LLM integration
- SQLite for document storage

### Data Processing
- Vector embeddings for semantic search
- Recursive text splitting for optimal chunking
- Real-time document indexing

## Getting Started

1. **Prerequisites**
   - Node.js 18+
   - Install Ollama:
     ```bash
     # macOS/Linux
     curl -L https://ollama.com/install.sh | sh
     
     # Windows
     Download from https://ollama.com/download/windows
     ```

2. **Install Llama2 Model**
   ```bash
   # Pull the Llama2 3B model
   ollama pull llama2:3b
   
   # Start Ollama server
   ollama serve
   ```

3. **Installation**
   ```bash
   npm install
   ```

4. **Development**
   ```bash
   npm run dev
   ```

5. **Build**
   ```bash
   npm run build
   npm start
   ```

> **Note**: Ensure Ollama is running and accessible at `http://localhost:11434` before starting the application.

## Project Structure

- `/app`: Next.js application routes and components
- `/lib`: Core utilities and services
  - `projectStore.js`: SQLite database interactions
  - `vectorStore.js`: FAISS vector storage management
  - `contextAgent.js`: AI processing and response generation
- `/public`: Static assets
- `/data`: Local storage for vectors and database
- `/img`: Project screenshots and documentation images

## Screenshots

![Project Dashboard](/img/img2.png)
*Project dashboard showing knowledge organization*

![Document Management](/img/img1.png)
*Document import and page creation interface*

![AI Chat Interface](/img/img3.png)
*Contextual AI chat with document references*


## Architecture

Cortex uses a hybrid architecture combining:
- Local SQLite database for document storage
- FAISS vector store for semantic search
- LangChain for AI orchestration
- Next.js server components for API routes

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
