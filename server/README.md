# Afterbootcamp Discord MCP

A Discord bot that integrates with Google's Gemini AI to provide intelligent interactions and management capabilities for the Afterbootcamp community.

## Features

- Discord bot integration
- Gemini AI powered responses
- Message history management
- Rate limiting for fair usage
- Configurable command prefix
- Debug mode for development

## Requirements

- Node.js 18.0.0 or higher
- npm or yarn
- Discord Bot Token
- Gemini API Key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DISCORD_BOT_TOKEN | Your Discord bot token | `abc123...` |
| DISCORD_CLIENT_ID | Your Discord application client ID | `123456789` |
| DISCORD_GUILD_ID | Your Discord server ID | `987654321` |
| GEMINI_API_KEY | Your Google Gemini API key | `xyz789...` |
| GEMINI_MODEL | The Gemini model to use | `gemini-pro` |
| BOT_PREFIX | Command prefix for the bot | `!` |
| DEBUG_MODE | Enable debug logging | `false` |
| MAX_HISTORY_LENGTH | Max messages in history | `10` |
| RATE_LIMIT_MESSAGES | Messages allowed per window | `5` |
| RATE_LIMIT_WINDOW | Time window in seconds | `60` |

## Development

To run the bot in development mode:

```bash
npm run dev
```

This will start the bot with hot-reloading enabled.

## Production

To run the bot in production:

1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Start the bot:
   ```bash
   npm start
   ```

## Commands

- `!help` - Display help information
- `!status` - Check bot status
- Additional commands coming soon...

## Architecture

The project is structured into several key components:

- `src/index.ts` - Main entry point
- `src/discordClient.ts` - Discord bot client implementation
- `src/geminiClient.ts` - Gemini AI client integration
- `src/agentGraph.ts` - Agent interaction graph management
- `src/mcp.ts` - Master Control Program implementation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

# agent-mcp-discord
