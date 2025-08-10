# minecraft-bedrock-discord-srv

A client that enables cross-chat between Discord and Minecraft Bedrock Edition realms.

## Features

- 📱 **Minecraft → Discord**: Forward Minecraft chat messages to Discord
- 💬 **Discord → Minecraft**: Send Discord messages to Minecraft
- 🌐 **Multi-language support**: Automatic translation of Minecraft system messages
- 🔧 **Server monitoring commands**: Built-in !tps and !entity commands for server diagnostics
- 🏰 **Realms support**: Connect to Minecraft Realms servers
- 🖥️ **Direct server support**: Connect to direct Minecraft Bedrock servers

## Prerequisites

- Node.js 18.0.0 or higher
- Minecraft Bedrock Edition account
- Discord bot token
- Access to Minecraft Realms server (when using Realms)

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/fa0311/minecraft-bedrock-discord-srv.git --recurse-submodules
cd minecraft-bedrock-discord-srv
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy the appropriate environment file based on your connection method:

**For Realms connection:**

```bash
cp .env.realms.example .env
```

**For LINE Notify functionality:**

```bash
cp .env.line.example .env
```

**For basic setup:**

```bash
cp .env.example .env
```

4. **Build and run**

```bash
pnpm run build
pnpm start
```

## Usage

### Development

```bash
# Development mode using tsx (no build required)
pnpm run dev

# Watch for file changes and auto-restart
pnpm run watch

# Run with debugger
pnpm run debug
```

### Production

```bash
# Build the project
pnpm run build

# Start the server
pnpm start
```
