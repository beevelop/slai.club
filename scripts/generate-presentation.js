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
const fal = require('@fal-ai/client');

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';
const FAL_AI_KEY = process.env.FAL_AI_KEY || process.env.FAL_KEY;
const CUSTOM_TOPIC = process.env.CUSTOM_TOPIC;
const OUTPUT_DIR = path.join(__dirname, '..', 'presentations');
const TEMPLATE_PATH = path.join(__dirname, '..', 'template', 'slides.md');
const GALLERY_TEMPLATE_PATH = path.join(__dirname, '..', 'template', 'gallery.html');

// Configure fal.ai client
if (FAL_AI_KEY) {
  fal.config({
    credentials: FAL_AI_KEY
  });
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
    'The Secret Life of Rubber Ducks',
    'Why Cats Are Actually Aliens',
    'Time Travel Through Breakfast Cereals',
    'The Philosophy of Pizza Toppings',
    'Underwater Basket Weaving as a Sport',
    'The History of Mismatched Socks',
    'Cloud Shapes and Their Hidden Meanings',
    'The Art of Professional Procrastination'
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
            content: 'You are a creative presentation generator for PowerPoint Karaoke. Create humorous, engaging, and slightly absurd presentations.'
          },
          {
            role: 'user',
            content: `Create a PowerPoint Karaoke presentation about "${topic}". 
            
            Provide:
            1. A catchy subtitle
            2. 5-7 slide contents in markdown format
            
            Format each slide as:
            # Slide Title
            
            - Point 1
            - Point 2
            - Point 3
            
            Make it funny and engaging!`
          }
        ],
        temperature: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const aiContent = response.data.choices[0].message.content;
    return {
      title: topic,
      subtitle: extractSubtitle(aiContent),
      slides: aiContent
    };
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * Extract subtitle from AI response
 */
function extractSubtitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('subtitle') && line.includes(':')) {
      return line.split(':')[1].trim();
    }
  }
  return 'An AI-Generated Adventure';
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
 * Extract slide titles and generate image prompts
 */
function extractSlidesForImages(content) {
  const slides = [];
  const lines = content.split('\n');
  let currentSlide = null;
  let slideNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a slide title (starts with # but not ##)
    if (line.match(/^# [^#]/)) {
      if (currentSlide) {
        slides.push(currentSlide);
      }

      slideNumber++;
      const title = line.replace(/^# /, '').trim();
      currentSlide = {
        number: slideNumber,
        title: title,
        content: [line]
      };
    } else if (currentSlide) {
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
  const imageMap = {};

  // Create images directory
  const imagesDir = path.join(presentationDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Generate images for each slide
  for (const slide of slides) {
    // Create a descriptive prompt based on the slide title and content
    const prompt = `A creative, humorous illustration for a presentation slide titled "${slide.title}".
The image should be visually engaging, slightly absurd, and suitable for PowerPoint Karaoke.
Style: modern, colorful, fun illustration.`;

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
 * Inject images into slide content
 */
function injectImagesIntoSlides(slidesContent, imageMap) {
  if (Object.keys(imageMap).length === 0) {
    return slidesContent;
  }

  const lines = slidesContent.split('\n');
  const result = [];
  let slideNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);

    // Check if this is a slide title (starts with # but not ##)
    if (line.trim().match(/^# [^#]/)) {
      slideNumber++;

      // Add image after the title if we have one for this slide
      if (imageMap[slideNumber]) {
        result.push('');
        result.push(`![](/${imageMap[slideNumber]})`);
        result.push('');
      }
    }
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

