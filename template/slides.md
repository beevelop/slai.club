---
theme: default
background: https://source.unsplash.com/collection/94734566/1920x1080
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## {{TITLE}}
  
  AI-generated presentation for PowerPoint Karaoke
drawings:
  persist: false
transition: slide-left
title: {{TITLE}}
mdc: true
---

# {{TITLE}}

{{SUBTITLE}}

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/beevelop/slai.club" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

{{SLIDES_CONTENT}}

---
layout: end
---

# Thank You!

Generated with ❤️ by AI at slai.club

<div class="pt-12">
  <a href="https://slai.club" target="_blank" class="px-6 py-3 rounded-full cursor-pointer inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold" hover="shadow-lg transform scale-105">
    🎲 Ready for Another Round of Chaos
  </a>
</div>

