#!/usr/bin/env node

/**
 * Generate a new Slidev presentation using AI
 *
 * This script:
 * 1. Calls an LLM to generate presentation content
 * 2. Uses @fal-ai/client to generate images for each slide
 * 3. Downloads and embeds images into the presentation
 * 4. Creates a new presentation folder from the template
 * 5. Updates the gallery index with the new presentation
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {fal} = require('@fal-ai/client');

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-nano';
const FAL_AI_KEY = process.env.FAL_AI_KEY || process.env.FAL_KEY;
const CUSTOM_TOPIC = process.env.CUSTOM_TOPIC;
const OUTPUT_DIR = path.join(__dirname, '..', 'presentations');
const TEMPLATE_PATH = path.join(__dirname, '..', 'template', 'slides.md');
const GALLERY_TEMPLATE_PATH = path.join(__dirname, '..', 'template', 'gallery.html');

// Configure fal.ai client
if (FAL_AI_KEY) {
  console.log('✅ FAL_AI_KEY is configured');
  fal.config({
    credentials: FAL_AI_KEY
  });
} else {
  console.log('⚠️  FAL_AI_KEY not found - image generation will be skipped');
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate presentation content using LLM
 */
async function generateContent() {
  console.log('🤖 Generating presentation content with AI...');
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required. Please set it in your environment or .env file.');
    process.exit(1);
  }
  
  // Example topics for PowerPoint Karaoke
  const topics = [
    'The Secret Life of Left Socks',
    'How Bananas Secretly Control the Stock Market',
    '101 Uses for Unused Gift Cards',
    'The Rise and Fall of Disco Dinosaurs',
    'Why Aliens Prefer Pineapple Pizza',
    'Chronicles of the Office Coffee Mug',
    'How to Train Your Pet Rock',
    'Time Management Tips from Sloths',
    'The Unsung Heroes: Traffic Cones',
    'Flat Earth: The Real Pancake Theory',
    'Treehouse WiFi Networks - Fact or Fiction?',
    'Parallel Universes in Your Refrigerator',
    'Why Do We Yawn at Zebras?',
    'Secrets of the Moon’s Cheese Supply',
    'High Fashion for Goldfish',
    'WiFi Passwords of the Illuminati',
    'Interpreting the Art of Cheese Sculpting',
    'Unexplained Phenomena: Haunted Tupperware',
    'A Beginner’s Guide to Competitive Sleepwalking',
    'How Unicorns Lost Their Jobs to Narwhals'
  ];
  
  const topic = CUSTOM_TOPIC || topics[Math.floor(Math.random() * topics.length)];
  console.log(`📝 Topic: ${topic}`);
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a master storyteller and comedy writer creating PowerPoint Karaoke presentations. Your presentations follow a compelling narrative arc with dramatic moments and unexpected plot twists. Generate ONLY valid Slidev markdown content - no explanations, no commentary, just the slides. Create presentations that start plausible but become increasingly absurd, culminating in a surprise twist that catches the presenter off-guard.'
          },
          {
            role: 'user',
            content: `Create a PowerPoint Karaoke presentation about "${topic}".

🎭 STORYTELLING MISSION:
This is PowerPoint Karaoke - the presenter has NEVER seen these slides before! Your goal is to craft a compelling narrative that starts reasonable, builds tension, and then completely derails with an absurd twist around slide 4-5 that will make the presenter go "WAIT, WHAT?!"

CRITICAL: Output ONLY the slide content. NO preamble, NO explanations, NO commentary like "Sure, here you go" or "Remember to...". Start directly with the first slide separator (---).

📖 NARRATIVE STRUCTURE (Create exactly 6-8 slides):

ACT 1 - THE SETUP (Slides 1-2):
- Start seemingly legitimate and informative
- Establish credibility with "facts"
- Hook the presenter with interesting information
- Make them think "okay, this is going somewhere..."

ACT 2 - RISING TENSION (Slides 3-4):
- Introduce increasingly questionable claims
- Add dramatic statistics or bold statements
- Build suspense with mysterious implications
- Start hinting something isn't quite right

ACT 3 - THE TWIST (Slide 4-5 - THE SURPRISE MOMENT):
- COMPLETELY change direction with absurd revelation
- Introduce ridiculous conspiracy theory OR
- Reveal secret villain/hero OR
- Time travel/aliens/supernatural element OR
- Connect to completely unrelated topic
- This should make the presenter pause and go "...WHAT?!"

ACT 4 - ESCALATION (Slides 5-6):
- Double down on the absurdity
- Add more ridiculous "evidence"
- Dramatic declarations
- Over-the-top conclusions

ACT 5 - CLIMAX (Slide 7):
- Epic finale with call-to-action
- Dramatic quote or statement
- Leave on a memorable note
- Maximum absurdity achieved

FORMAT REQUIREMENTS:

LAYOUT OPTIONS (vary these strategically):
- layout: center (for dramatic reveals)
- layout: image-right (for "professional" content)
- layout: image-left (for building credibility)
- layout: two-cols (for comparisons/contrasts)
- layout: quote (for shocking quotes during the twist)
- layout: fact (for dramatic statistics and BIG reveals)

EXAMPLE SLIDE FORMAT:

---
layout: center
---

# 🐱 Ancient Feline Artifacts

<v-clicks>

- First domesticated in Egypt 3000 BC
- Worshipped as sacred guardians
- 73 million cats in US homes today

</v-clicks>

EXAMPLE 2 - THE TWIST MOMENT:

---
layout: fact
---

# 🛸 PLOT TWIST
## Cats Are Actually Alien Scouts
### They've Been Reporting Back Since Day One

EXAMPLE 3 - Dramatic Quote:

---
layout: quote
---

# "Every purr is a status update to the mothership"
## - Declassified CIA Document, 2043

EXAMPLE 4 - Escalation:

---
layout: two-cols
---

# 📡 The Evidence Mounts

::left::

**Normal Cat Behavior?**
- Stares at nothing
- 3 AM zoomies
- Knocking things off tables

::right::

**OR Secret Mission?**
- Scanning for threats
- Testing Earth's gravity
- Collecting DNA samples

STORYTELLING RULES:
- Start with 2 slides that seem TOTALLY NORMAL and educational
- Slide 3-4: Plant seeds of doubt with "interesting facts"
- Slide 4-5: THE BIG TWIST - go completely absurd
- Slide 5-7: Escalate the absurdity, add "proof"
- Final slide: Epic conclusion with dramatic statement
- Use quote layouts for shocking revelations
- Use fact layouts for dramatic statistics/reveals
- Build tension through pacing

DRAMATIC TECHNIQUES:
- Foreshadowing in early slides (subtle hints)
- Use of "But wait...", "However...", "The Truth Is..."
- Dramatic emojis (🚨, ⚠️, 🛸, 👁️, 💥, 🔥)
- ALL CAPS for shocking moments
- Numbers that get progressively more absurd
- "Experts say...", "Studies show...", "Evidence suggests..."

STRICT FORMATTING RULES:
- Start IMMEDIATELY with "---" (slide separator)
- Each heading MUST be a UNIQUE, CREATIVE title
- Titles should be witty, punchy, and drive the narrative
- Each heading needs a relevant emoji
- Keep headings under 6 words but make them MEANINGFUL
- Use 2-4 bullet points per slide
- Bullet points under 10 words each
- NO image tags (![]), NO "Point 1:", NO "Slide 1:"
- NO commentary between slides

TITLE PROGRESSION EXAMPLE (showing narrative arc):
1. "🐱 Introduction to House Cats"
2. "📊 By The Numbers"
3. "🤔 Strange Behavioral Patterns"
4. "🛸 THE SHOCKING TRUTH" ← THE TWIST
5. "🚨 Evidence You Can't Ignore"
6. "👽 What They Don't Want You To Know"
7. "⚠️ The Time To Act Is NOW"

OUTPUT FORMAT - Start with the first "---" separator immediately:`
          }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const aiContent = response.data.choices[0].message.content;
    const cleanedContent = cleanAIResponse(aiContent);
    
    return {
      title: topic,
      subtitle: extractSubtitle(cleanedContent, topic),
      slides: cleanedContent
    };
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * Clean AI response by removing commentary and extra text
 */
function cleanAIResponse(content) {
  let lines = content.split('\n');
  
  // Find the first slide separator (---)
  let firstSeparatorIndex = lines.findIndex(line => line.trim() === '---');
  
  // If we find separators, look for content between them
  if (firstSeparatorIndex !== -1) {
    // Find the second separator (start of actual content)
    let secondSeparatorIndex = lines.findIndex((line, idx) => idx > firstSeparatorIndex && line.trim() === '---');
    
    if (secondSeparatorIndex !== -1) {
      // Keep everything from the second separator onward
      lines = lines.slice(secondSeparatorIndex + 1);
    }
  }
  
  // Remove common AI commentary patterns from the beginning
  const commentaryPatterns = [
    /^sure,?\s+(here|you go)/i,
    /^here('s| is)/i,
    /^okay,?\s+here/i,
    /^alright,?\s+here/i,
    /^i('ve| have)\s+(created|generated)/i,
    /^\*\*presentation/i,
    /^\*\*title/i,
    /^\*\*subtitle/i,
    /^\*\*slide/i,
    /^\d+\.\s+subtitle:/i,
    /^\d+\.\s+slide/i,
    /^subtitle:/i,
    /^".*"\s*$/,  // Lines that are just quoted text
  ];
  
  while (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine === '' || commentaryPatterns.some(pattern => pattern.test(firstLine))) {
      lines.shift();
    } else if (firstLine.startsWith('---') || firstLine.startsWith('#') || firstLine.startsWith('layout:')) {
      break;
    } else {
      lines.shift();
    }
  }
  
  // Remove trailing commentary
  const trailingPatterns = [
    /^remember to/i,
    /^make sure to/i,
    /^feel free to/i,
    /^you can/i,
    /^this (presentation|should)/i,
    /^have fun/i,
    /^try to/i,
    /^don't forget/i,
  ];
  
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine === '' || trailingPatterns.some(pattern => pattern.test(lastLine))) {
      lines.pop();
    } else {
      break;
    }
  }
  
  // Sanitize and fix common markdown/HTML issues
  const sanitized = sanitizeContent(lines.join('\n'));
  
  return sanitized;
}

/**
 * Sanitize content to fix common markdown and HTML issues
 */
function sanitizeContent(content) {
  let lines = content.split('\n');
  let result = [];
  let inVClicks = false;
  let skipUntilNextSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    
    // Reset skip flag when we hit a new slide
    if (trimmed === '---' || trimmed.match(/^# /)) {
      skipUntilNextSection = false;
    }
    
    // Track <v-clicks> tags
    if (trimmed === '<v-clicks>') {
      inVClicks = true;
      result.push(line);
      continue;
    }
    
    if (trimmed === '</v-clicks>') {
      inVClicks = false;
      result.push(line);
      continue;
    }
    
    // Skip lines that are just formatting characters
    if (trimmed === '**' || trimmed === '*' || trimmed === '__' || trimmed === '_') {
      continue;
    }
    
    // Skip lines with problematic patterns like "**# Slide 1:"
    if (trimmed.match(/^\*\*#\s+slide/i)) {
      skipUntilNextSection = true;
      continue;
    }
    
    // Skip numbered slide patterns
    if (trimmed.match(/^\*\*\d+\.\s+(slide|subtitle|section)/i)) {
      skipUntilNextSection = true;
      continue;
    }
    
    if (trimmed.match(/^\d+\.\s+\*\*?(slide|subtitle|section)/i)) {
      skipUntilNextSection = true;
      continue;
    }
    
    if (skipUntilNextSection) {
      continue;
    }
    
    // Skip additional AI commentary patterns
    if (trimmed.match(/^(presentation title|slide \d+:|slide contents?:)/i)) {
      continue;
    }
    
    // Remove lines that look like "Point 1:" or "- Point 1:"
    if (trimmed.match(/^-?\s*point\s+\d+:/i)) {
      continue;
    }
    
    // Fix unclosed bold/italic at the end of lines
    line = line.replace(/\*\*\s*$/, '').replace(/\*\s*$/, '');
    
    // Fix lines that start with unclosed bold or have bold in headings
    if (trimmed.startsWith('**#')) {
      // Remove the bold formatting from the heading
      line = line.replace(/^\s*\*\*/, '');
    } else if (trimmed.startsWith('**') && !trimmed.substring(2).includes('**')) {
      line = line.replace(/^\s*\*\*\s*/, '');
    }
    
    // Remove markdown bold formatting from headings (they're already bold)
    if (trimmed.startsWith('# ')) {
      line = line.replace(/\*\*/g, '');
    }
    
    // Clean up malformed quotes
    line = line.replace(/^["']\s*$/, '');
    
    result.push(line);
  }
  
  // Ensure all <v-clicks> are closed
  if (inVClicks) {
    result.push('</v-clicks>');
  }
  
  // Remove any trailing empty lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }
  
  return result.join('\n');
}

/**
 * Generate a dramatic subtitle from the title
 */
function extractSubtitle(content, title) {
  // Generate dramatic subtitles that hint at the twist to come
  const subtitles = [
    '🎯 An Investigation You Won\'t Forget',
    '🚨 The Truth They Don\'t Want You To Know',
    '🎪 Nothing Is As It Seems',
    '⚡ Brace Yourself For The Revelation',
    '🔥 Everything You Believed Was Wrong',
    '🌟 A Story That Defies Logic',
    '🎭 Plot Twist Guaranteed',
    '🔮 The Conspiracy Unfolds',
    '👁️ Once You See It, You Can\'t Unsee It',
    '💥 Reality Will Never Be The Same',
    '🛸 Prepare For The Unexpected',
    '⚠️ Things Are About To Get Weird'
  ];

  // Pick a random dramatic subtitle
  return subtitles[Math.floor(Math.random() * subtitles.length)];
}

/**
 * Generate an image using fal.ai
 */
async function generateImage(prompt, slideNumber) {
  if (!FAL_AI_KEY) {
    console.log(`⚠️  Skipping image generation for slide ${slideNumber} (no FAL_AI_KEY set)`);
    return null;
  }

  try {
    console.log(`🎨 Generating image for slide ${slideNumber}...`);

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`  Progress: ${Math.round((update.logs?.length || 0) * 10)}%`);
        }
      }
    });

    if (result.data && result.data.images && result.data.images.length > 0) {
      const imageUrl = result.data.images[0].url;
      console.log(`✅ Image generated for slide ${slideNumber}`);
      return imageUrl;
    }

    console.log(`⚠️  No image returned for slide ${slideNumber}`);
    return null;
  } catch (error) {
    console.error(`❌ Error generating image for slide ${slideNumber}:`, error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return null;
  }
}

/**
 * Download image from URL to local file
 */
async function downloadImage(imageUrl, filePath) {
  try {
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(filePath, response.data);
    console.log(`💾 Saved image to ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error downloading image:`, error.message);
    return false;
  }
}

/**
 * Generate an image prompt using GPT
 * Format: Subject + Action + Style + Context in a single sentence
 */
async function generateImagePrompt(slideTitle, slideContent) {
  if (!OPENAI_API_KEY) {
    // Fallback to template-based prompt if no API key
    return `A humorous ${slideTitle.toLowerCase()} illustration depicting the concept in a whimsical and exaggerated manner, rendered in a vibrant modern digital art style with bold colors and playful composition, perfect for an engaging PowerPoint Karaoke presentation slide.`;
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating image generation prompts for AI art models. You create concise, effective prompts that match the narrative tone of PowerPoint Karaoke presentations - from credible to absurd. Follow the format: Subject + Action + Style + Mood, all in a single sentence.'
          },
          {
            role: 'user',
            content: `Create an image generation prompt for this PowerPoint Karaoke slide:

Title: "${slideTitle}"
Content: ${slideContent.join(' ')}

REQUIREMENTS:
- Single sentence format: Subject + Action + Style + Mood
- Subject: The main subject/concept based on the slide title
- Action: What the subject is doing (match the absurdity level of the slide)
- Style: Visual style that matches the content:
  * Early slides: Professional, clean, documentary-style
  * Middle slides: Slightly dramatic, mysterious, intriguing
  * Twist slides: Dramatic, conspiracy-theory aesthetic, shocking
  * Late slides: Maximum absurdity, over-the-top, surreal
- Mood: Match the dramatic intensity of the slide content
- Keep it under 60 words
- If title contains words like "TRUTH", "SHOCKING", "EVIDENCE", "CONSPIRACY": Make it dramatic and intense
- If title is straightforward: Keep it professional but engaging
- If title is absurd: Go full surreal and exaggerated

OUTPUT: Just the prompt, nothing else.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const prompt = response.data.choices[0].message.content.trim();
    return prompt;
  } catch (error) {
    console.error(`⚠️  Error generating prompt with GPT:`, error.message);
    // Fallback to template-based prompt
    return `A humorous ${slideTitle.toLowerCase()} illustration depicting the concept in a whimsical and exaggerated manner, rendered in a vibrant modern digital art style with bold colors and playful composition, perfect for an engaging PowerPoint Karaoke presentation slide.`;
  }
}

/**
 * Extract slide titles and generate image prompts
 */
function extractSlidesForImages(content) {
  const slides = [];
  const lines = content.split('\n');
  let currentSlide = null;
  let slideNumber = 0;
  let inSlideContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a slide separator
    if (line === '---') {
      if (currentSlide) {
        slides.push(currentSlide);
        currentSlide = null;
      }
      inSlideContent = false;
      continue;
    }

    // Check if this is a slide title (starts with # but not ##)
    if (line.match(/^# /)) {
      if (currentSlide) {
        slides.push(currentSlide);
      }

      slideNumber++;
      // Extract the title, removing emoji and extra formatting
      let title = line.replace(/^# /, '').trim();
      // Remove leading emoji if present
      title = title.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Modifier}\p{Emoji_Component}]+\s*/u, '');

      currentSlide = {
        number: slideNumber,
        title: title,
        content: []
      };
      inSlideContent = true;
    } else if (currentSlide && line && !line.startsWith('layout:') && !line.startsWith('<')) {
      currentSlide.content.push(line);
    }
  }

  if (currentSlide) {
    slides.push(currentSlide);
  }

  return slides;
}

/**
 * Generate images for all slides
 */
async function generateSlideImages(content, presentationDir) {
  if (!FAL_AI_KEY) {
    console.log('⚠️  Skipping image generation (FAL_AI_KEY not set)');
    return {};
  }

  console.log('\n🎨 Generating images for slides...');

  const slides = extractSlidesForImages(content.slides);
  console.log(`📊 Found ${slides.length} slides to generate images for`);
  const imageMap = {};

  // Create images directory
  const imagesDir = path.join(presentationDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Generate images for each slide
  for (const slide of slides) {
    // Generate prompt using GPT (Subject + Action + Style + Context format)
    const prompt = await generateImagePrompt(slide.title, slide.content);

    console.log(`💭 Prompt for slide ${slide.number}: "${prompt}"`);

    const imageUrl = await generateImage(prompt, slide.number);

    if (imageUrl) {
      const imageFileName = `slide-${slide.number}.png`;
      const imagePath = path.join(imagesDir, imageFileName);
      const downloaded = await downloadImage(imageUrl, imagePath);

      if (downloaded) {
        imageMap[slide.number] = `images/${imageFileName}`;
      }
    }
  }

  console.log(`✅ Generated ${Object.keys(imageMap).length} images`);
  return imageMap;
}

/**
 * Inject images as background images in slide frontmatter
 * 
 * This function processes the AI-generated slide content and adds background images
 * to each slide's frontmatter. This ensures images don't cover the bullet points.
 * 
 * Logic:
 * 1. Track frontmatter blocks (between --- markers)
 * 2. Track slide titles (# headings) to number slides
 * 3. When closing a frontmatter block, inject background for the upcoming slide
 * 4. Use slideNumber+1 because we increment slideNumber AFTER seeing the title,
 *    but we need to inject the background BEFORE the title appears
 */
function injectImagesIntoSlides(slidesContent, imageMap) {
  if (Object.keys(imageMap).length === 0) {
    // No images to inject, return content as-is
    return slidesContent;
  }

  const lines = slidesContent.split('\n');
  const result = [];
  let slideNumber = 0;  // Tracks how many titled slides we've seen so far
  let inFrontmatter = false;
  let frontmatterLines = [];
  let currentSlideHasTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect slide separators (---)
    if (trimmed === '---') {
      if (!inFrontmatter) {
        // Start of frontmatter block
        inFrontmatter = true;
        frontmatterLines = [line];
        currentSlideHasTitle = false;
      } else {
        // End of frontmatter - inject background if this slide gets an image
        // We inject for slideNumber+1 because we haven't seen the title yet
        // Use absolute path (with leading /) for proper resolution in subdirectories
        if (imageMap[slideNumber + 1]) {
          // Ensure path starts with / for absolute path from root
          const imagePath = imageMap[slideNumber + 1].startsWith('/') 
            ? imageMap[slideNumber + 1] 
            : `/${imageMap[slideNumber + 1]}`;
          frontmatterLines.push(`background: ${imagePath}`);
        }
        frontmatterLines.push(line);
        result.push(...frontmatterLines);
        frontmatterLines = [];
        inFrontmatter = false;
      }
      continue;
    }

    // If in frontmatter, collect lines
    if (inFrontmatter) {
      frontmatterLines.push(line);
      continue;
    }

    // Check if this is a slide title (starts with # but not ##)
    if (trimmed.match(/^# /) && !currentSlideHasTitle) {
      slideNumber++;
      currentSlideHasTitle = true;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Create presentation from template
 */
async function createPresentation(content) {
  const timestamp = new Date().toISOString().split('T')[0];
  const slug = content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const presentationName = `${timestamp}-${slug}`;
  const presentationDir = path.join(OUTPUT_DIR, presentationName);

  console.log(`📝 Creating presentation: ${presentationName}`);

  // Create presentation directory
  if (!fs.existsSync(presentationDir)) {
    fs.mkdirSync(presentationDir, { recursive: true });
  }

  // Generate images for slides
  const imageMap = await generateSlideImages(content, presentationDir);

  // Inject images into slides content
  const slidesWithImages = injectImagesIntoSlides(content.slides, imageMap);

  // Read template
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Replace placeholders
  template = template
    .replace(/\{\{TITLE\}\}/g, content.title)
    .replace(/\{\{SUBTITLE\}\}/g, content.subtitle)
    .replace(/\{\{SLIDES_CONTENT\}\}/g, slidesWithImages);

  // Write slides.md
  const slidesPath = path.join(presentationDir, 'slides.md');
  fs.writeFileSync(slidesPath, template);

  console.log(`✅ Created: ${slidesPath}`);

  // Update gallery index
  updateGalleryIndex(presentationName, content.title);

  return presentationName;
}

/**
 * Update or create gallery index
 */
function updateGalleryIndex(presentationName, title) {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const presentations = getExistingPresentations();
  
  presentations.unshift({
    name: presentationName,
    title: title,
    date: new Date().toISOString()
  });
  
  // Read gallery template
  let template = fs.readFileSync(GALLERY_TEMPLATE_PATH, 'utf8');
  
  // Generate gallery content
  let galleryContent;
  if (presentations.length === 0) {
    galleryContent = `<div class="empty-state">
            <h2>No Presentations Yet</h2>
            <p>Presentations will appear here once the AI generation workflow runs.</p>
            <p>The first presentation will be generated automatically on schedule!</p>
            <a href="https://github.com/beevelop/slai.club/actions" class="cta" target="_blank">
                View GitHub Actions →
            </a>
        </div>`;
  } else {
    galleryContent = `<div class="gallery">
${presentations.map(p => `            <a href="./presentations/${p.name}/index.html" class="card">
                <h3>${escapeHtml(p.title)}</h3>
                <p class="date">${formatDate(p.date)}</p>
                <span class="view-btn">View Presentation →</span>
            </a>`).join('\n')}
        </div>`;
  }
  
  // Replace placeholder
  const html = template.replace('{{GALLERY_CONTENT}}', galleryContent);
  
  fs.writeFileSync(indexPath, html);
  console.log('✅ Updated gallery index');
}

/**
 * Get existing presentations from the presentations directory
 */
function getExistingPresentations() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return [];
  }
  
  const dirs = fs.readdirSync(OUTPUT_DIR);
  return dirs
    .filter(dir => {
      const slidesPath = path.join(OUTPUT_DIR, dir, 'slides.md');
      return fs.existsSync(slidesPath);
    })
    .map(dir => {
      const slidesPath = path.join(OUTPUT_DIR, dir, 'slides.md');
      const content = fs.readFileSync(slidesPath, 'utf8');
      const titleMatch = content.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : dir;
      const stats = fs.statSync(slidesPath);
      
      return {
        name: dir,
        title: title,
        date: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Escape HTML for safe output
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format date nicely
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting presentation generation...\n');
    
    // Generate content
    const content = await generateContent();
    
    // Create presentation
    const presentationName = await createPresentation(content);
    
    console.log('\n✨ Presentation generation complete!');
    console.log(`📁 Location: presentations/${presentationName}`);
    console.log(`\nTo preview locally, run:`);
    console.log(`  cd presentations/${presentationName}`);
    console.log(`  npx slidev slides.md`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateContent, createPresentation };

