# Mastra Personal Document Assistant

A personal document assistant built with the Mastra framework that processes your personal documents (PDFs, letters, insurance policies, etc.), learns about you, and helps fill out forms like visa applications automatically.

## Project Overview

This project uses the Mastra framework to create an AI-powered personal document assistant. It includes:

1. A document processing system that extracts and indexes information from your personal documents
2. A RAG (Retrieval-Augmented Generation) system that retrieves relevant information from your documents
3. A form-filling agent that can complete applications and forms based on your personal information
4. Custom tools for document processing, information retrieval, and form completion

## Features

- **Document Processing**: Upload and process various document types (PDFs, images, text)
- **Information Extraction**: Automatically extract personal details from your documents
- **Secure Storage**: Store your information securely in a vector database
- **Form Completion**: AI-assisted completion of various application forms
- **Contextual Responses**: Get answers to questions about your personal information based on your documents

## Project Structure

```
src/
└── mastra/
    ├── index.ts                # Main Mastra instance configuration
    ├── agents/
    │   ├── index.ts            # Agent exports
    │   ├── documentAgent.ts    # Document processing agent
    │   └── formAgent.ts        # Form filling agent
    ├── tools/
    │   ├── index.ts            # Tool exports
    │   ├── documentTools.ts    # Document processing tools
    │   ├── vectorTools.ts      # Vector database tools
    │   └── formTools.ts        # Form filling tools
    ├── workflows/
    │   ├── index.ts            # Workflow exports
    │   ├── documentWorkflow.ts # Document processing workflow
    │   └── formWorkflow.ts     # Form filling workflow
    └── rag/
        ├── index.ts            # RAG system configuration
        ├── embeddings.ts       # Document embedding utilities
        └── retrieval.ts        # Information retrieval utilities
```

## Technical Details

- Built with TypeScript and the Mastra framework
- Uses OpenAI's GPT-4o model for natural language processing
- Implements RAG (Retrieval-Augmented Generation) for accurate information retrieval
- Uses vector database for efficient document storage and retrieval
- Processes PDF documents using PDF parsing libraries
- Implements Zod schemas for type validation and data integrity

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) package manager
- Node.js (v18 or higher recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```

### Running the Application

Start the development server:
```
bun run dev
```

## Environment Variables

Create a `.env.development` file with the following variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `VECTOR_DB_CONNECTION`: Connection string for your vector database
- Other API keys and configuration settings for the Mastra framework

## Usage

1. **Upload Documents**: Use the web interface to upload your personal documents
2. **Process Documents**: The system will automatically extract and index information
3. **Ask Questions**: Query the system about your personal information
4. **Fill Forms**: Request the system to fill out specific forms using your information

## Dependencies

- `@ai-sdk/openai`: OpenAI integration
- `@mastra/core`: Core Mastra framework
- `mastra`: Mastra CLI and utilities
- `zod`: Schema validation
- `pdf-parse`: PDF document processing
- `langchain`: Vector storage and embeddings 