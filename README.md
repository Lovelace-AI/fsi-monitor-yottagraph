# FSI Monitor

FSI Monitor

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Project Structure

This is an Aether application built with a modular architecture. Features are self-contained modules in the `features/` directory.

### Current Features

- No features yet - create your first one!

### Creating New Features

```bash
# Create a new feature structure
mkdir -p features/my-feature/{pages,components,composables}
```

See the [Creating Modules Guide](docs/guides/creating-modules.md) for details.

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```bash
# App Configuration
NUXT_PUBLIC_APP_ID=fsi-monitor-yottagraph-mmns
NUXT_PUBLIC_APP_NAME="FSI Monitor"

# Query Server Configuration
# Leave empty if not using the query server
NUXT_PUBLIC_QUERY_SERVER_ADDRESS=https://query.news.prod.g.lovelace.ai


# When using Auth0, NUXT_PUBLIC_USER_NAME must be empty
NUXT_PUBLIC_USER_NAME=

# Auth0 Configuration
NUXT_PUBLIC_AUTH0_CLIENT_ID='tCbsIzjz0IsufCIfn2zEAIJqU36h3Ma7'
NUXT_PUBLIC_AUTH0_CLIENT_SECRET='t3SZhtW8fBW6cH3QzCs0sHx4PGSFO0Mz4SOJe5YLQfBaBrvLWtTMHK8NovbQw6gb'
NUXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience

```

## 📚 Documentation

- [Module Creation Guide](docs/guides/creating-modules.md)
- [Module API Reference](docs/reference/module-api.md)
- [Documentation Index](docs/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Update DESIGN.md with any architectural decisions
4. Submit a pull request

## 📄 License

[Your License Here]
