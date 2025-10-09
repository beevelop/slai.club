# slai.club

> AI-generated presentations for PowerPoint Karaoke

**slai.club** is an automated presentation generator that creates unique slides for PowerPoint Karaoke using AI. The project combines modern AI technologies to generate creative, engaging presentations on a regular schedule.

## 🎯 Features

- **Automated Generation**: Presentations are automatically generated using GitHub Actions on a regular schedule
- **AI-Powered Content**: Uses advanced language models to generate creative, engaging presentation content
- **AI-Generated Images**: Each slide includes a unique AI-generated image using fal.ai's FLUX Schnell model
- **Markdown-Based**: Built on [Slidev](https://sli.dev/), enabling presentations through simple markdown
- **Gallery View**: Browse all generated presentations in an easy-to-navigate gallery
- **GitHub Pages Hosting**: Fully hosted on GitHub Pages for free, reliable access

## 🛠️ Tech Stack

- **[Slidev](https://sli.dev/)** - Markdown-based presentation framework
- **[@fal-ai/client](https://fal.ai/)** - Fast AI inference platform for image generation
- **[FLUX Schnell](https://blackforestlabs.ai/)** - Advanced image generation model by Black Forest Labs
- **OpenAI** - Language models for content generation
- **GitHub Actions** - Automated workflow orchestration
- **GitHub Pages** - Static site hosting

## 🚀 How It Works

1. **Scheduled Trigger**: GitHub Actions workflow runs on a defined schedule
2. **Content Generation**: OpenAI generates creative presentation content based on random or custom topics
3. **Image Generation**: For each slide, fal.ai's FLUX Schnell model generates a unique, themed image
4. **Image Download**: Generated images are downloaded and saved in the presentation's images folder
5. **Markdown Compilation**: Content and images are embedded into Slidev-compatible markdown
6. **Build & Deploy**: Presentations are built and deployed to GitHub Pages
7. **Gallery Update**: The main page is updated with the new presentation

## 🔧 Setup

### 1. Configure GitHub Secrets

Add the following secrets to your repository (Settings → Secrets and variables → Actions):

| Secret Name | Required | Description |
|------------|----------|-------------|
| `OPENAI_API_KEY` | **Yes** | Your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | No | OpenAI model to use (default: `gpt-4`) |
| `FAL_AI_KEY` or `FAL_KEY` | **Recommended** | Your fal.ai API key for AI image generation from [fal.ai/dashboard](https://fal.ai/dashboard/keys) |

### 2. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Under "Source", select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
3. Click "Save"
4. Configure your custom domain's DNS to point to GitHub Pages

### 3. Run the Workflow

**Automatic**: Runs daily at 10 AM UTC

**Manual**: 
1. Go to Actions tab → "Generate AI Presentation"
2. Click "Run workflow"
3. Optionally enter a custom topic or leave blank for random

## 📖 Usage

### Browse Presentations

Visit [slai.club](https://slai.club) to browse the gallery of AI-generated presentations.

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file with:
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4          # optional
FAL_AI_KEY=...              # or FAL_KEY, recommended for images

# Generate a presentation
npm run generate

# Preview a specific presentation
cd presentations/[presentation-name]
npx slidev slides.md
```

### Environment Variables

All configuration is done via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | **Yes** | - | OpenAI API key for content generation |
| `OPENAI_MODEL` | No | `gpt-4` | OpenAI model to use (e.g., `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`) |
| `CUSTOM_TOPIC` | No | Random | Custom presentation topic (overrides random selection) |
| `FAL_AI_KEY` or `FAL_KEY` | Recommended | - | fal.ai API key for AI image generation. Without this, presentations will be generated without images. |

### Customize Generation Schedule

Edit `.github/workflows/generate-presentation.yml` to change the schedule:

```yaml
schedule:
  - cron: '0 10 * * *'  # Daily at 10 AM UTC
```

Examples:
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight
- `0 12 * * 1-5` - Weekdays at noon

## 📁 Project Structure

```
slai.club/
├── .github/workflows/
│   └── generate-presentation.yml    # GitHub Actions workflow
├── presentations/                    # Generated presentations (auto-created)
│   └── YYYY-MM-DD-topic-name/
│       ├── slides.md                 # Source markdown
│       ├── images/                   # AI-generated images for slides
│       │   ├── slide-1.png
│       │   ├── slide-2.png
│       │   └── ...
│       └── dist/                     # Built presentation
├── scripts/
│   └── generate-presentation.js     # AI generation script
├── template/
│   ├── slides.md                    # Slidev presentation template
│   └── gallery.html                 # Gallery page template
├── index.html                       # Gallery homepage (auto-generated)
├── package.json                     # Dependencies
└── CNAME                            # Custom domain configuration
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share ideas for presentation themes or AI model integrations

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ using AI and automation