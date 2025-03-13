# Document RAG System

This is a proof-of-concept implementation of a Retrieval-Augmented Generation (RAG) system for personal documents using Mastra. The system can process text documents, store them in a PostgreSQL vector database, and answer questions about the documents.

## Features

- **Document Processing**: Process text documents and split them into chunks
- **Vector Storage**: Store document chunks in a PostgreSQL vector database
- **Semantic Search**: Retrieve relevant document chunks based on queries
- **Question Answering**: Answer questions about documents using RAG

## Implementation

The implementation follows a modular approach:

1. **Document Processing**: Uses Mastra's `MDocument` to process and chunk documents
2. **Vector Storage**: Uses PostgreSQL with pgvector for storing embeddings
3. **RAG Agent**: Uses OpenAI's GPT-4o-mini model to answer questions based on retrieved context
4. **Workflows**: Implements workflows for document processing and querying

## Components

- `src/mastra/rag/index.ts`: Core RAG functionality
- `src/mastra/agents/documentAgent.ts`: Document agent for answering questions
- `src/mastra/workflows/documentWorkflow.ts`: Workflows for document processing and querying
- `src/test-document-rag.ts`: Test script for the RAG system

## Usage

### Prerequisites

- PostgreSQL with pgvector extension
- OpenAI API key

### Environment Variables

Create a `.env.development` file with:

```
OPENAI_API_KEY=your_openai_api_key
POSTGRES_CONNECTION_STRING=your_postgres_connection_string
```

### Running the Test

```bash
bun run test:rag
```

This will:
1. Process a sample document with personal information
2. Store it in the vector database
3. Run several test queries to demonstrate the RAG capabilities

## Next Steps

This is Phase 1 of the implementation plan. Future phases will include:

- PDF document processing
- Form filling capabilities
- More sophisticated document extraction
- User interface for document upload and querying 