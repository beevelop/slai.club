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
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5';
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
 * Normalize a topic/title for comparison
 * Converts to lowercase, removes special characters, and normalizes whitespace
 */
function normalizeTopic(topic) {
  return topic
    .toLowerCase()
    .replace(/["""'']/g, '')  // Remove all quote variants
    .replace(/[^a-z0-9\s]/g, ' ')  // Replace special chars with space
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
}

/**
 * Generate a unique topic by selecting from unused inspiration topics
 * Uses date-based seeding for consistent daily selection
 */
function generateUniqueTopic(existingTopics) {
  // All available topics - expanded list for more variety
  const allTopics = [
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
    'Secrets of the Moon\'s Cheese Supply',
    'High Fashion for Goldfish',
    'WiFi Passwords of the Illuminati',
    'Interpreting the Art of Cheese Sculpting',
    'Unexplained Phenomena: Haunted Tupperware',
    'A Beginner\'s Guide to Competitive Sleepwalking',
    'How Unicorns Lost Their Jobs to Narwhals',
    'The Economics of Invisible Ink',
    'Why Rubber Ducks Make Better CEOs',
    'Underground Networks of Garden Gnomes',
    'The Conspiracy of Matching Socks',
    'Quantum Mechanics of Toast Landing',
    'The Philosophical Implications of Elevator Music',
    'How Plants Communicate Through WiFi',
    'The Ancient Art of Procrastination',
    'Why Pigeons Are Actually Surveillance Drones',
    'The Hidden History of Bubble Wrap',
    'Professional Clouds: A Career Guide',
    'The Psychology of Shopping Cart Returns',
    'Time Travel via Microwave Ovens',
    'The Secret Society of Left-Handed Scissors',
    'Why Cats Are Actually Liquid',
    'The Metaphysics of Parking Space Availability',
    'A Deep Dive into Conspiracy Theories About Pigeons',
    'The Untold Story of Forgotten Passwords',
    'How to Speak Dolphin: A Business Guide',
    'The Renaissance of Fax Machines',
    // Additional topics for more variety
    'The Underground Economy of Office Supplies',
    'Why Squirrels Are Planning World Domination',
    'The Secret Language of Vending Machines',
    'Interdimensional Tourism on a Budget',
    'How Houseplants Judge Your Life Choices',
    'The Cryptocurrency of Ancient Rome',
    'Why Birds Sing in Binary Code',
    'The Psychology of Mismatched Tupperware Lids',
    'Corporate Yoga for Sentient AI',
    'The Hidden Cost of Free Samples',
    'Why Your Alarm Clock Hates You',
    'Blockchain for Beginners (and Cats)',
    'The Diplomatic Relations Between Ants and Crumbs',
    'How to Negotiate with a Stapler',
    'The Feng Shui of Server Rooms',
    'Why Monday Is a Government Conspiracy',
    'The True Purpose of Junk Drawers',
    'Emotional Support Water Bottles',
    'The Stock Market of Dreams',
    'Why Refrigerator Light Goes Off (Or Does It?)'
  ];

  // Normalize existing topics for comparison
  const normalizedExisting = existingTopics.map(normalizeTopic);
  
  // Filter out already used topics using normalized comparison
  const availableTopics = allTopics.filter(topic => {
    const normalizedTopic = normalizeTopic(topic);
    return !normalizedExisting.some(existing => existing === normalizedTopic);
  });

  console.log(`📊 Topics: ${allTopics.length} total, ${availableTopics.length} available, ${allTopics.length - availableTopics.length} used`);

  // If we've used all topics, generate a new unique topic with AI
  if (availableTopics.length === 0) {
    console.log('⚠️  All predefined topics have been used! Consider adding more topics to the list.');
    // Pick a random topic as fallback - this shouldn't happen with 60 topics
    return allTopics[Math.floor(Math.random() * allTopics.length)];
  }

  // Use date-based seeding combined with available topic count for consistent daily selection
  const today = new Date().toISOString().split('T')[0];
  const seed = parseInt(today.replace(/-/g, ''), 10); // e.g., "20251014" -> 20251014
  const index = seed % availableTopics.length;

  return availableTopics[index];
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

  // Get existing presentations to avoid topic repetition
  const existingPresentations = getExistingPresentations();
  const existingTopics = existingPresentations.map(p => p.title);

  // Generate unique topic or use custom topic
  let topic;
  if (CUSTOM_TOPIC) {
    topic = CUSTOM_TOPIC;
  } else {
    topic = generateUniqueTopic(existingTopics);
  }
  console.log(`📝 Topic: ${topic}`);
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a stand-up comedian and corporate presentation expert creating PowerPoint Karaoke presentations. Your specialty is making presentations that start completely normal and professional, then gradually reveal an absurd underlying truth that makes the presenter do a double-take. Your humor style combines internet memes, corporate jargon parody, and clever wordplay. Never be random for randomness sake - every joke should land because it subverts expectations in a smart way.'
          },
          {
            role: 'user',
            content: `Create a PowerPoint Karaoke presentation about "${topic}".

🎤 POWERPOINT KARAOKE CONTEXT:
The presenter has NEVER seen these slides. They must improvise a presentation in front of an audience. Your job is to:
1. Start with slides they can confidently present (building false confidence)
2. Gradually introduce content that makes them question reality
3. Hit them with a twist that gets the audience laughing
4. Give them a dramatic finish they can ham up for laughs

CRITICAL: Output ONLY the slide content. NO preamble, NO explanations, NO commentary. Start directly with "---".

🎭 COMEDY STRUCTURE (exactly 7-8 slides):

SLIDES 1-2: THE CORPORATE OPENER
- Professional, TED-talk energy
- Real-sounding statistics (make them specific: "73.4% of respondents...")
- Buzzwords the presenter can lean into ("synergy", "paradigm shift", "disruption")
- Set up the premise as if it's a serious business presentation

SLIDES 3-4: THE SLOW BURN
- Facts start getting... oddly specific
- Introduce a detail that seems off but could be real
- Plant seeds like "Since the incident of 1987..." or "After the Great [Topic] Awakening..."
- The presenter should start to sense something is wrong

SLIDE 5: THE RECORD SCRATCH MOMENT 🎵
- Full "wait, what?" energy
- Reveal the absurd truth behind everything
- Make it a complete 180 that recontextualizes slides 1-4
- Examples: "It was the dolphins all along", "This is actually a cult recruitment presentation", "We've been describing the plot of Shrek"

SLIDES 6-7: DOUBLE DOWN WITH CONFIDENCE
- Treat the absurd premise as completely normal
- Add "evidence" with deadpan delivery
- Include references the audience will recognize (memes, pop culture, internet jokes)
- Corporate jargon about the absurd topic: "Our Q3 projections for interdimensional travel..."

SLIDE 8: THE MIC DROP
- Dramatic call-to-action or quote
- Give the presenter something fun to deliver with gravitas
- End on something quotable and memorable

🎨 HUMOR TECHNIQUES TO USE:
- Bait-and-switch: Set up normal, deliver absurd
- Specific absurdity: "Exactly 847 rubber ducks" is funnier than "many rubber ducks"
- Corporate parody: Use business jargon for ridiculous things
- Callback humor: Reference something from slide 1-2 in the twist
- Pop culture nods: Reference memes, movies, internet culture tastefully
- Puns and wordplay: Especially in titles
- Deadpan delivery: Present absurd facts matter-of-factly
- Escalation: Each slide should be slightly more unhinged than the last

LAYOUT REQUIREMENTS:

CRITICAL: 2/3+ of slides MUST use image layouts
SLIDE 1 MUST use: layout: image

LAYOUTS:
- layout: image → Full-screen visual, minimal text (scene-setting)
- layout: image-right → Image right, text left (explaining "facts")
- layout: image-left → Image left, text right (building narrative)
- layout: fact → Big text only (THE TWIST - use for slide 5)
- layout: quote → Quote format (use for finale)

SLIDE FORMAT EXAMPLES:

SLIDE 1 (Always this format):
---
layout: image
---

# 🦆 The Rubber Duck Economy

CONTENT SLIDE:
---
layout: image-right
---

# 📈 Market Growth Projections

<v-clicks>

- Global rubber duck market: $847M annually
- 73.4% of bathtubs contain at least one duck
- "Duck density" correlates with GDP growth

</v-clicks>

THE TWIST:
---
layout: fact
---

# 🚨 CLASSIFIED DISCOVERY
## Rubber Ducks Are Currency
### From Another Dimension

EPIC FINALE:
---
layout: quote
---

# "In the end, we were all just ducks in someone else's bathtub"
## - Warren Buffett (probably)

✍️ WRITING RULES:
- NEVER use generic titles like "Introduction" or "Conclusion"
- Every title needs a relevant emoji
- Titles should be punchy and intriguing (under 6 words)
- Bullet points: 2-4 per slide, under 20 words each
- ALWAYS wrap bullets in <v-clicks> tags
- Make statistics sound real but be obviously made up on reflection
- NO image tags, NO "Slide 1:", NO explanations between slides

TITLE EXAMPLES (showing progression):
1. "🦆 The Duck Index Explained" (layout: image) - sounds legit
2. "📊 Surprising Adoption Rates" (layout: image-right) - still normal
3. "🤔 The Patterson Anomaly" (layout: image-left) - wait, what Patterson?
4. "⚡ When Ducks Achieved Sentience" (layout: fact) - THE TWIST
5. "🌍 Global Duck Communication Grid" (layout: image-right) - doubling down
6. "🔮 The Prophecy Unfolds" (layout: image-left) - escalating
7. "🎭 Quack or Be Quacked" (layout: quote) - mic drop

START IMMEDIATELY with "---":`
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
 * Ensure first slide has layout: image
 * This is critical for image-heavy storytelling
 */
function ensureFirstSlideHasLayout(content) {
  const lines = content.split('\n');
  const result = [];
  let firstSlideFound = false;
  let inFirstSlideFrontmatter = false;
  let firstSlideFrontmatterLines = [];
  let hasLayout = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // If we hit a heading before any frontmatter, inject frontmatter
    if (trimmed.startsWith('# ') && !firstSlideFound && !inFirstSlideFrontmatter) {
      // Add frontmatter before the heading
      result.push('---');
      result.push('layout: image');
      result.push('---');
      result.push('');
      result.push(line);
      firstSlideFound = true;
      continue;
    }

    // If we hit a heading while looking for first slide frontmatter,
    // the frontmatter is empty - inject it before the heading
    if (trimmed.startsWith('# ') && inFirstSlideFrontmatter) {
      firstSlideFound = true;

      // Add layout: image to the frontmatter
      if (!hasLayout) {
        firstSlideFrontmatterLines.push('layout: image');
      }

      // Add closing separator
      firstSlideFrontmatterLines.push('---');
      result.push(...firstSlideFrontmatterLines);
      result.push('');  // Empty line after frontmatter
      result.push(line);  // The heading
      inFirstSlideFrontmatter = false;
      continue;
    }

    // Find the first slide separator after any initial content
    if (trimmed === '---' && !firstSlideFound) {
      if (!inFirstSlideFrontmatter) {
        // Start of first slide frontmatter
        inFirstSlideFrontmatter = true;
        firstSlideFrontmatterLines = [line];
        hasLayout = false;
      } else {
        // End of first slide frontmatter
        firstSlideFound = true;

        // If no layout was specified, add it
        if (!hasLayout) {
          firstSlideFrontmatterLines.push('layout: image');
        }

        firstSlideFrontmatterLines.push(line);
        result.push(...firstSlideFrontmatterLines);
        inFirstSlideFrontmatter = false;
      }
      continue;
    }

    if (inFirstSlideFrontmatter) {
      firstSlideFrontmatterLines.push(line);
      if (trimmed.startsWith('layout:')) {
        hasLayout = true;
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
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

  // Ensure first slide has layout: image
  const withLayout = ensureFirstSlideHasLayout(sanitized);

  return withLayout;
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
      // Ensure there's a blank line after <v-clicks> for proper MDC parsing
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (nextLine !== '' && !nextLine.startsWith('-')) {
        result.push('');
      } else if (nextLine.startsWith('-')) {
        // Next line is a bullet, ensure blank line
        result.push('');
      }
      continue;
    }

    if (trimmed === '</v-clicks>') {
      // Ensure there's a blank line before </v-clicks> for proper MDC parsing
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('');
      }
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
    result.push('');
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

    const result = await fal.subscribe('fal-ai/flux-pro/kontext/max/text-to-image', {
      input: {
        prompt: prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        output_format: 'jpeg'
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          // Display actual log messages from the API
          update.logs.map((log) => log.message).forEach((message) => {
            console.log(`  ${message}`);
          });
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
 * Visual style options for consistent presentation imagery
 * Based on Black Forest Labs best practices for FLUX models
 */
const VISUAL_STYLES = [
  {
    name: 'Cinematic Documentary',
    baseStyle: 'cinematic documentary photography, shot on RED camera, anamorphic lens flares',
    lighting: 'dramatic side lighting with deep shadows',
    colorGrade: 'teal and orange color grading, high contrast',
    texture: 'film grain texture, shallow depth of field'
  },
  {
    name: 'Retro Corporate',
    baseStyle: '1980s corporate photography aesthetic, vintage Kodachrome film',
    lighting: 'warm tungsten office lighting',
    colorGrade: 'warm vintage tones, slightly faded colors',
    texture: 'subtle film grain, soft focus edges'
  },
  {
    name: 'Surreal Editorial',
    baseStyle: 'surrealist editorial photography, high-fashion magazine aesthetic',
    lighting: 'dramatic studio lighting with colored gels',
    colorGrade: 'bold saturated colors, high contrast',
    texture: 'crisp details, clean backgrounds'
  },
  {
    name: 'Noir Mystery',
    baseStyle: 'neo-noir cinematography, chiaroscuro lighting',
    lighting: 'single hard light source casting dramatic shadows',
    colorGrade: 'desaturated with selective color pops',
    texture: 'high contrast black and white with grain'
  },
  {
    name: 'Wes Anderson',
    baseStyle: 'Wes Anderson film still, symmetrical composition, whimsical staging',
    lighting: 'soft diffused natural light',
    colorGrade: 'pastel color palette, vintage warmth',
    texture: 'clean sharp focus, theatrical staging'
  },
  {
    name: 'Scientific Illustration',
    baseStyle: 'scientific illustration meets photography, museum exhibit style',
    lighting: 'clean even lighting, museum display quality',
    colorGrade: 'natural accurate colors on neutral background',
    texture: 'extremely detailed, educational clarity'
  },
  {
    name: 'Dreamy Ethereal',
    baseStyle: 'ethereal dreamlike photography, soft focus lens',
    lighting: 'golden hour backlit glow',
    colorGrade: 'soft pastels with light leaks',
    texture: 'soft gaussian blur, luminous highlights'
  },
  {
    name: 'Bold Pop Art',
    baseStyle: 'pop art photography, Andy Warhol inspired',
    lighting: 'flat even lighting for graphic effect',
    colorGrade: 'bold primary colors, high saturation',
    texture: 'halftone dot pattern, screen print aesthetic'
  }
];

/**
 * Generate a visual style guide for the entire presentation
 * This ensures consistent imagery throughout all slides
 */
async function generateVisualStyleGuide(topic, slides) {
  console.log('🎨 Generating visual style guide for consistent imagery...');
  
  // Select a random visual style for this presentation
  const selectedStyle = VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)];
  console.log(`📷 Selected style: ${selectedStyle.name}`);
  
  if (!OPENAI_API_KEY) {
    // Fallback to basic style guide
    return {
      styleName: selectedStyle.name,
      baseStyle: selectedStyle.baseStyle,
      lighting: selectedStyle.lighting,
      colorGrade: selectedStyle.colorGrade,
      texture: selectedStyle.texture,
      narrativeArc: 'Professional start, building tension, surreal climax',
      visualMotifs: [topic.split(' ')[0].toLowerCase()],
      avoidElements: ['text', 'words', 'letters', 'numbers', 'signs', 'labels', 'logos', 'watermarks']
    };
  }

  try {
    // Extract slide titles for narrative understanding
    const slideTitles = slides.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a visual director creating a cohesive image style guide for a presentation. Your goal is to define visual elements that will create a consistent, cinematic look across all images while supporting the narrative arc.'
          },
          {
            role: 'user',
            content: `Create a visual style guide for a PowerPoint Karaoke presentation about "${topic}".

SELECTED BASE STYLE: ${selectedStyle.name}
- Base: ${selectedStyle.baseStyle}
- Lighting: ${selectedStyle.lighting}
- Colors: ${selectedStyle.colorGrade}
- Texture: ${selectedStyle.texture}

SLIDE PROGRESSION:
${slideTitles}

Generate a JSON object with:
{
  "narrativeArc": "Brief description of visual progression from professional to absurd",
  "recurringSubject": "A visual element/character that can appear throughout (NOT the literal topic)",
  "visualMotifs": ["3-4 recurring visual elements that tie images together"],
  "environmentProgression": "How the setting/environment changes through slides",
  "moodProgression": "How the mood/atmosphere escalates"
}

OUTPUT: Only the JSON object, no explanation.`
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

    let styleGuide;
    try {
      const content = response.data.choices[0].message.content.trim();
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      styleGuide = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      styleGuide = {};
    }

    return {
      styleName: selectedStyle.name,
      baseStyle: selectedStyle.baseStyle,
      lighting: selectedStyle.lighting,
      colorGrade: selectedStyle.colorGrade,
      texture: selectedStyle.texture,
      narrativeArc: styleGuide.narrativeArc || 'Professional to surreal progression',
      recurringSubject: styleGuide.recurringSubject || null,
      visualMotifs: styleGuide.visualMotifs || [],
      environmentProgression: styleGuide.environmentProgression || 'Office to dreamscape',
      moodProgression: styleGuide.moodProgression || 'Calm to intense',
      avoidElements: ['text', 'words', 'letters', 'numbers', 'signs', 'labels', 'logos', 'watermarks', 'captions', 'titles', 'typography', 'writing']
    };
  } catch (error) {
    console.error(`⚠️  Error generating style guide:`, error.message);
    return {
      styleName: selectedStyle.name,
      baseStyle: selectedStyle.baseStyle,
      lighting: selectedStyle.lighting,
      colorGrade: selectedStyle.colorGrade,
      texture: selectedStyle.texture,
      narrativeArc: 'Professional start, building tension, surreal climax',
      visualMotifs: [],
      avoidElements: ['text', 'words', 'letters', 'numbers', 'signs', 'labels', 'logos', 'watermarks']
    };
  }
}

/**
 * Generate an image prompt using GPT following BFL best practices
 * Format: Subject + Action + Style + Context (FLUX Prompt Framework)
 * 
 * Key BFL Best Practices:
 * 1. Structured prompts: Subject → Action → Style → Context
 * 2. Be specific and descriptive (exact colors, detailed descriptions)
 * 3. Use technical photography terms for realism
 * 4. Avoid negative prompts - describe what you want, not what you don't
 * 5. Layer details systematically
 */
async function generateImagePrompt(slideTitle, slideContent, slideIndex, totalSlides, styleGuide) {
  // Calculate where we are in the narrative arc (0-1)
  const narrativeProgress = slideIndex / Math.max(totalSlides - 1, 1);
  
  // Determine the narrative phase
  let narrativePhase;
  if (narrativeProgress < 0.3) {
    narrativePhase = 'OPENING (professional, credible, corporate)';
  } else if (narrativeProgress < 0.6) {
    narrativePhase = 'BUILDING (hints of strangeness, subtle surrealism)';
  } else if (narrativeProgress < 0.8) {
    narrativePhase = 'TWIST (dramatic revelation, visual shock)';
  } else {
    narrativePhase = 'CLIMAX (full surreal, maximum visual impact)';
  }

  if (!OPENAI_API_KEY) {
    // Fallback to template-based prompt following BFL framework
    return `${slideTitle.replace(/[^\w\s]/g, '')} scene, ${styleGuide.baseStyle}, ${styleGuide.lighting}, ${styleGuide.colorGrade}, ${styleGuide.texture}, pure visual composition with absolutely no text or writing visible`;
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating image prompts for Black Forest Labs FLUX models. You follow the BFL Prompt Framework strictly:

STRUCTURE: Subject + Action + Style + Context

RULES:
1. NEVER include any text, words, letters, numbers, signs, labels, or typography in your prompts
2. Focus purely on VISUAL elements - scenes, objects, lighting, composition
3. Use specific, detailed descriptions (exact colors, precise actions)
4. Include technical photography terms (camera settings, lens types, lighting setups)
5. Describe what you WANT to see, never what you don't want
6. Keep prompts under 75 words but highly descriptive
7. The image should be self-explanatory without needing text`
          },
          {
            role: 'user',
            content: `Create an image prompt for slide ${slideIndex + 1} of ${totalSlides}.

SLIDE TITLE: "${slideTitle}"
SLIDE CONTENT: ${slideContent.join(' ') || 'Visual emphasis slide'}

PRESENTATION NARRATIVE PHASE: ${narrativePhase}

CONSISTENT VISUAL STYLE (use throughout):
- Style: ${styleGuide.baseStyle}
- Lighting: ${styleGuide.lighting}
- Colors: ${styleGuide.colorGrade}
- Texture: ${styleGuide.texture}
${styleGuide.recurringSubject ? `- Recurring Subject: ${styleGuide.recurringSubject}` : ''}
${styleGuide.visualMotifs?.length ? `- Visual Motifs: ${styleGuide.visualMotifs.join(', ')}` : ''}

NARRATIVE CONTEXT:
- Overall Arc: ${styleGuide.narrativeArc}
- Environment Progression: ${styleGuide.environmentProgression}
- Mood Progression: ${styleGuide.moodProgression}

CRITICAL: Generate ONLY visual elements. The image must contain ZERO text, words, signs, labels, or any written content.

FORMAT: Follow BFL framework - Subject (what/who) + Action (doing what) + Style (${styleGuide.styleName}) + Context (where/when/mood)

OUTPUT: Just the prompt, no quotes, no explanation.`
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

    let prompt = response.data.choices[0].message.content.trim();
    
    // Remove any quotes that might wrap the prompt
    prompt = prompt.replace(/^["']|["']$/g, '');
    
    // Append explicit instruction to avoid text (BFL models respond well to end-of-prompt emphasis)
    prompt += ', purely visual composition, no text or writing visible anywhere in the image';
    
    return prompt;
  } catch (error) {
    console.error(`⚠️  Error generating prompt with GPT:`, error.message);
    // Fallback to template-based prompt
    return `${slideTitle.replace(/[^\w\s]/g, '')} scene, ${styleGuide.baseStyle}, ${styleGuide.lighting}, ${styleGuide.colorGrade}, ${styleGuide.texture}, purely visual composition with no text or writing`;
  }
}

/**
 * Extract slide titles and layouts for image generation
 * Only extracts slides that use image, image-left, or image-right layouts
 */
function extractSlidesForImages(content) {
  const slides = [];
  const lines = content.split('\n');
  let currentSlide = null;
  let slideNumber = 0;
  let inFrontmatter = false;
  let currentLayout = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a slide separator
    if (line === '---') {
      if (inFrontmatter) {
        // End of frontmatter
        inFrontmatter = false;
      } else {
        // Start of new slide - save previous slide if it needs an image
        if (currentSlide && (currentLayout === 'image' || currentLayout === 'image-left' || currentLayout === 'image-right')) {
          currentSlide.layout = currentLayout;
          slides.push(currentSlide);
        }
        currentSlide = null;
        currentLayout = null;
        inFrontmatter = true;
      }
      continue;
    }

    // Parse layout from frontmatter
    if (inFrontmatter && line.startsWith('layout:')) {
      currentLayout = line.replace('layout:', '').trim();
      continue;
    }

    // Check if this is a slide title (starts with # but not ##)
    if (line.match(/^# /)) {
      slideNumber++;
      // Extract the title, removing emoji and extra formatting
      let title = line.replace(/^# /, '').trim();
      // Remove leading emoji if present
      title = title.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Modifier}\p{Emoji_Component}]+\s*/u, '');

      currentSlide = {
        number: slideNumber,
        title: title,
        content: [],
        layout: currentLayout
      };
    } else if (currentSlide && line && !line.startsWith('<')) {
      // Collect content for the image prompt
      if (line.startsWith('-')) {
        currentSlide.content.push(line.replace(/^-\s*/, ''));
      }
    }
  }

  // Don't forget the last slide
  if (currentSlide && (currentLayout === 'image' || currentLayout === 'image-left' || currentLayout === 'image-right')) {
    currentSlide.layout = currentLayout;
    slides.push(currentSlide);
  }

  return slides;
}

/**
 * Generate images for all slides with consistent style
 * Uses a visual style guide to ensure cohesive imagery throughout
 */
async function generateSlideImages(content, presentationDir) {
  if (!FAL_AI_KEY) {
    console.log('⚠️  Skipping image generation (FAL_AI_KEY not set)');
    return {};
  }

  console.log('\n🎨 Generating images for slides...');

  const slides = extractSlidesForImages(content.slides);
  console.log(`📊 Found ${slides.length} slides to generate images for`);
  
  if (slides.length === 0) {
    return {};
  }

  // Generate a consistent visual style guide for the entire presentation
  const styleGuide = await generateVisualStyleGuide(content.title, slides);
  console.log(`\n📋 Visual Style Guide:`);
  console.log(`   Style: ${styleGuide.styleName}`);
  console.log(`   Narrative: ${styleGuide.narrativeArc}`);
  if (styleGuide.recurringSubject) {
    console.log(`   Recurring Subject: ${styleGuide.recurringSubject}`);
  }
  if (styleGuide.visualMotifs?.length) {
    console.log(`   Visual Motifs: ${styleGuide.visualMotifs.join(', ')}`);
  }
  console.log('');

  const imageMap = {};

  // Create public directory for Slidev (automatically copied during build)
  const publicDir = path.join(presentationDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate images for each slide with consistent style
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // Generate prompt using GPT with BFL framework and style guide
    const prompt = await generateImagePrompt(
      slide.title, 
      slide.content, 
      i,                    // Current slide index
      slides.length,        // Total slides for narrative progress
      styleGuide           // Consistent style guide
    );

    console.log(`\n💭 Slide ${slide.number} (${Math.round((i / Math.max(slides.length - 1, 1)) * 100)}% through narrative):`);
    console.log(`   "${prompt.substring(0, 120)}${prompt.length > 120 ? '...' : ''}"`);

    const imageUrl = await generateImage(prompt, slide.number);

    if (imageUrl) {
      const imageFileName = `slide-${slide.number}.jpg`;
      const imagePath = path.join(publicDir, imageFileName);
      const downloaded = await downloadImage(imageUrl, imagePath);

      if (downloaded) {
        // Use root-relative path without leading slash for Slidev
        imageMap[slide.number] = `${imageFileName}`;
      }
    }
  }

  console.log(`\n✅ Generated ${Object.keys(imageMap).length} images with consistent ${styleGuide.styleName} style`);
  return imageMap;
}

/**
 * Inject images into slides based on their layout
 *
 * For slides with image, image-left, or image-right layouts, this adds
 * the image property to the frontmatter. Numbering matches the extraction
 * logic which counts by slide titles (# headings).
 */
function injectImagesIntoSlides(slidesContent, imageMap) {
  if (Object.keys(imageMap).length === 0) {
    return slidesContent;
  }

  const lines = slidesContent.split('\n');
  const result = [];
  let slideNumber = 0;
  let inFrontmatter = false;
  let frontmatterLines = [];
  let currentLayout = null;
  let nextSlideNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Count slide titles to track slide numbers
    if (trimmed.match(/^# /) && !inFrontmatter) {
      slideNumber++;
    }

    if (trimmed === '---') {
      if (!inFrontmatter) {
        // Start of frontmatter
        inFrontmatter = true;
        frontmatterLines = [line];
        currentLayout = null;
        // The next slide number will be slideNumber + 1 (haven't seen its title yet)
        nextSlideNumber = slideNumber + 1;
      } else {
        // End of frontmatter - inject image if needed
        // Check if this slide has an image and uses an image layout
        if (imageMap[nextSlideNumber] && (currentLayout === 'image' || currentLayout === 'image-left' || currentLayout === 'image-right')) {
          frontmatterLines.push(`image: /${imageMap[nextSlideNumber]}`);
        }

        frontmatterLines.push(line);
        result.push(...frontmatterLines);
        frontmatterLines = [];
        inFrontmatter = false;
      }
      continue;
    }

    if (inFrontmatter) {
      frontmatterLines.push(line);
      // Track the layout
      if (trimmed.startsWith('layout:')) {
        currentLayout = trimmed.replace('layout:', '').trim();
      }
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Escape YAML string value if it contains special characters
 * Colons, quotes, and other special chars need to be quoted in YAML
 */
function escapeYamlValue(value) {
  // Check if the value contains characters that need quoting in YAML
  if (value.includes(':') || value.includes('"') || value.includes("'") ||
      value.includes('#') || value.includes('&') || value.includes('*') ||
      value.includes('[') || value.includes(']') || value.includes('{') || value.includes('}')) {
    // Escape any existing double quotes and wrap in double quotes
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Sanitize a title by removing quotes and other problematic characters
 */
function sanitizeTitle(title) {
  return title
    .replace(/^["'""'']+|["'""'']+$/g, '')  // Remove leading/trailing quotes (including smart quotes)
    .replace(/["'""'']/g, "'")  // Replace internal quotes with simple apostrophe
    .trim();
}

/**
 * Create presentation from template
 */
async function createPresentation(content) {
  // Sanitize the title before using it
  content.title = sanitizeTitle(content.title);
  
  const timestamp = new Date().toISOString().split('T')[0];
  // Create clean slug: lowercase, replace special chars, remove trailing dashes
  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing dashes
    .replace(/-+/g, '-');  // Collapse multiple dashes
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

  // Replace placeholders with properly escaped YAML values
  template = template
    .replace(/\{\{TITLE\}\}/g, escapeYamlValue(content.title))
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

  // Check if this presentation already exists in the list
  const existingIndex = presentations.findIndex(p => p.name === presentationName);
  if (existingIndex !== -1) {
    // Update existing entry but preserve the original date
    presentations[existingIndex].title = title;
    // Keep the original date from presentations[existingIndex].date
  } else {
    // Extract date from the presentation folder name (format: YYYY-MM-DD-slug)
    const dateMatch = presentationName.match(/^(\d{4}-\d{2}-\d{2})/);
    const presentationDate = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

    // Add new entry at the beginning
    presentations.unshift({
      name: presentationName,
      title: title,
      date: presentationDate
    });
  }
  
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

      // Extract date from folder name (format: YYYY-MM-DD-slug)
      const dateMatch = dir.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

      return {
        name: dir,
        title: title,
        date: date
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

