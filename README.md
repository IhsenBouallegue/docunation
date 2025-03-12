# Mastra Weather Assistant

A weather assistant application built with the Mastra framework that provides weather information and activity recommendations based on weather conditions.

## Project Overview

This project is a demonstration of using the Mastra framework to create an AI-powered weather assistant. It includes:

1. A weather agent that provides current weather information for a specified location
2. A weather workflow that fetches weather forecasts and suggests activities based on the forecast
3. Custom tools for interacting with weather APIs

## Features

- **Current Weather Information**: Get real-time weather data for any location
- **Weather Forecasts**: Retrieve multi-day weather forecasts
- **Activity Planning**: Receive AI-generated activity recommendations based on weather conditions
- **Structured Responses**: Well-formatted weather information with temperature, humidity, wind conditions, and more

## Project Structure

```
src/
└── mastra/
    ├── index.ts           # Main Mastra instance configuration
    ├── agents/
    │   └── index.ts       # Weather agent definition
    ├── tools/
    │   └── index.ts       # Weather API tools implementation
    └── workflows/
        └── index.ts       # Weather workflow implementation
```

## Technical Details

- Built with TypeScript and the Mastra framework
- Uses OpenAI's GPT-4o model for natural language processing
- Integrates with Open-Meteo API for weather data
- Implements Zod schemas for type validation

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
- API keys and configuration settings for the Mastra framework

## Dependencies

- `@ai-sdk/openai`: OpenAI integration
- `@mastra/core`: Core Mastra framework
- `mastra`: Mastra CLI and utilities
- `zod`: Schema validation 