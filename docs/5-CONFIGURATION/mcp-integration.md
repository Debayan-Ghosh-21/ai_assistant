# Model Context Protocol (MCP) Integration

Dyslexxy can be seamlessly integrated into your AI workflows using the **Model Context Protocol (MCP)**, enabling direct access to your notebooks, sources, and chat functionality from AI assistants like Claude Desktop and VS Code extensions.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that allows AI applications to securely connect to external data sources and tools. With the Dyslexxy MCP server, you can:

- 📚 **Access your notebooks** directly from Claude Desktop or VS Code
- 🔍 **Search your research content** without leaving your AI assistant
- 💬 **Create and manage chat sessions** with your research as context
- 📝 **Generate notes** and insights on-the-fly
- 🤖 **Automate workflows** using the full Dyslexxy API

## Quick Setup

### For Claude Desktop

1. **Install the MCP server** (automatically from PyPI):

   ```bash
   # No manual installation needed! Claude Desktop will use uvx to run it automatically
   ```

2. **Configure Claude Desktop**:

   **macOS/Linux**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "dyslexxy": {
         "command": "uvx",
         "args": ["dyslexxy-mcp"],
         "env": {
           "DYSLEXXY_URL": "http://localhost:5055",
           "DYSLEXXY_PASSWORD": "your_password_here"
         }
       }
     }
   }
   ```

   **Windows**: Edit `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "dyslexxy": {
         "command": "uvx",
         "args": ["dyslexxy-mcp"],
         "env": {
           "DYSLEXXY_URL": "http://localhost:5055",
           "DYSLEXXY_PASSWORD": "your_password_here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** and start using your notebooks in conversations!

### For VS Code (Cline and other MCP-compatible extensions)

Add to your VS Code settings or `.vscode/mcp.json`:

```json
{
  "servers": {
    "dyslexxy": {
      "command": "uvx",
      "args": ["dyslexxy-mcp"],
      "env": {
        "DYSLEXXY_URL": "http://localhost:5055",
        "DYSLEXXY_PASSWORD": "your_password_here"
      }
    }
  }
}
```

## Configuration

- **DYSLEXXY_URL**: URL to your Dyslexxy API (default: `http://localhost:5055`)
- **DYSLEXXY_PASSWORD**: Optional - only needed if you've enabled password protection

### For Remote Servers

If your Dyslexxy instance is running on a remote server, update the URL accordingly:

```json
"DYSLEXXY_URL": "http://192.168.1.100:5055"
```

Or with a domain:

```json
"DYSLEXXY_URL": "https://notebook.yourdomain.com/api"
```

## What You Can Do

Once connected, you can ask Claude or your AI assistant to:

- _"Search my research notebooks for information about [topic]"_
- _"Create a new note summarizing the key points from our conversation"_
- _"List all my notebooks"_
- _"Start a chat session about [specific source or topic]"_
- _"What sources do I have in my [notebook name] notebook?"_
- _"Add this PDF to my research notebook"_
- _"Show me all notes in [notebook name]"_

The MCP server provides full access to Dyslexxy's capabilities, allowing you to manage your research seamlessly from within your AI assistant.

## Available Tools

The Dyslexxy MCP server exposes these capabilities:

### Notebooks

- List notebooks
- Get notebook details
- Create new notebooks
- Update notebook information
- Delete notebooks

### Sources

- List sources in a notebook
- Get source details
- Add new sources (links, files, text)
- Update source metadata
- Delete sources

### Notes

- List notes in a notebook
- Get note details
- Create new notes
- Update notes
- Delete notes

### Chat

- Create chat sessions
- Send messages to chat sessions
- Get chat history
- List chat sessions

### Search

- Vector search across content
- Text search across content
- Filter by notebook

### Models

- List configured AI models
- Get model details
- Create model configurations
- Update model settings

### Settings

- Get application settings
- Update settings

## MCP Server Repository

The Dyslexxy MCP server is developed and maintained by the Epochal team:

**🔗 GitHub**: [Epochal-dev/dyslexxy-mcp](https://github.com/Epochal-dev/dyslexxy-mcp)

Contributions, issues, and feature requests are welcome!

## Finding the Server

The Dyslexxy MCP server is published to the official MCP Registry:

- **Registry**: Search for "dyslexxy" at [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)
- **PyPI**: [pypi.org/project/dyslexxy-mcp](https://pypi.org/project/dyslexxy-mcp)
- **GitHub**: [Epochal-dev/dyslexxy-mcp](https://github.com/Epochal-dev/dyslexxy-mcp)

## Troubleshooting

### Connection Errors

1. Verify the `DYSLEXXY_URL` is correct and accessible
2. If using password protection, ensure `DYSLEXXY_PASSWORD` is set correctly
3. For remote servers, make sure port 5055 is accessible from your machine
4. Check firewall settings if connecting to a remote server

## Using with Other MCP Clients

The Dyslexxy MCP server follows the standard MCP protocol and can be used with any MCP-compatible client. Check your client's documentation for configuration details.

## Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
