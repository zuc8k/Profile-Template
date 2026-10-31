Zucks — Interactive Personal Portfolio

<div align="center">

YOUR IDENTITY. YOUR STORY. ONE INTERACTIVE EXPERIENCE.

A next-generation, single-page portfolio template engineered to transform personal profiles into immersive interactive experiences.

</div>

⸻

Overview

Zucks is a modern, highly interactive personal portfolio template built around a unique visual concept: a single collection of animated points that continuously transforms and rearranges itself into different visual scenes.

Unlike traditional portfolio websites, Zucks eliminates conventional page navigation and scrolling. Instead, it introduces a dynamic, scene-based experience where every section becomes an interactive state, allowing visitors to explore personal information, skills, projects, and other content through smooth visual transitions.

Designed for developers, creators, designers, and professionals who want a distinctive digital identity beyond ordinary portfolio templates.

Key Features

* Dynamic Point-Based Visual Engine — A unified particle system that transforms into multiple visual compositions.
* Single-Page Architecture — An immersive experience without traditional page scrolling.
* Interactive Scene Navigation — Switch between scenes using mouse clicks, keyboard controls, or touch gestures.
* Smooth Transitions & Animations — Fluid transformations between different portfolio states.
* Keyboard & Touch Support — Designed for desktop and mobile interaction.
* Bilingual Templates — Includes English and Arabic portfolio layouts.
* Production Build System — Bundled and minified JavaScript and CSS for deployment.
* Source Code Optimization — Production output excludes original JavaScript modules and source maps.

Experience & Navigation

Zucks uses a state-driven navigation system instead of traditional website routes.

Each scene represents a different stage of the portfolio experience. The visual engine dynamically rearranges its point-based composition to transition between scenes.

Navigation methods:

* Mouse interaction — Click to navigate.
* Keyboard interaction — Use supported keyboard controls.
* Touch interaction — Swipe between scenes on mobile devices.

Project Structure

Zucks/
├── Template/
│   ├── zucks-en.webp
│   └── zucks-ar.webp
├── js/
├── dist/
├── index.html
├── package.json
├── serve.py
└── README.md

Installation & Usage

Requirements

* Node.js
* npm
* Python 3.x

1. Clone the Repository

git clone <repository-url>
cd Zucks

2. Install Dependencies

npm install

3. Build for Production

npm run build

The production build generates an optimized dist/ directory containing bundled and minified assets.

4. Start the Local Server

python serve.py

Open the application:

http://127.0.0.1:8765

Production & Deployment

The project supports deployment through standard static hosting environments.

Compatible deployment options include:

* Nginx
* Node.js static servers
* Python HTTP servers
* Any static hosting provider supporting SPA rewrites

Important: ES modules require an HTTP server. Opening index.html directly through file:// is not supported.

The included local server binds exclusively to 127.0.0.1:8765. Public access can be configured through a dedicated Nginx virtual host and reverse proxy.

Build Optimization & Code Protection

The production build:

* Bundles browser-side JavaScript.
* Applies JavaScript obfuscation.
* Minifies CSS.
* Excludes original JavaScript modules and source maps from the production output.

Note: Client-side obfuscation increases code readability difficulty but does not provide complete source-code protection.

Templates Preview

English Template

Arabic Template

⸻

<div align="center">

ZUCKS

Designed to stand out. Engineered to interact.

A different way to present your digital identity.

</div>