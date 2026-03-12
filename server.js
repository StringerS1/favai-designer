require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const newTemplates = require('./new-templates');

// Only require ws in non-serverless environments
let WebSocketServer;
try {
  if (!process.env.VERCEL) {
    WebSocketServer = require('ws').WebSocketServer;
  }
} catch (e) { /* ws not available in serverless */ }

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load TD system prompt (with fallback for serverless)
let systemPrompt = '';
try {
  systemPrompt = fs.readFileSync(
    path.join(__dirname, 'td-context', 'system-prompt.txt'),
    'utf-8'
  );
} catch (e) {
  console.warn('Could not load system-prompt.txt, using fallback');
  systemPrompt = 'You are FavAI Designer, an expert AI assistant specialized in generating TouchDesigner Python scripts.';
}

// Store API key in memory (can be updated via settings)
let apiKey = process.env.OPENAI_API_KEY || '';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: apiKey !== '' && apiKey !== 'your-api-key-here',
    version: '1.0.0'
  });
});

// Update API key
app.post('/api/settings', (req, res) => {
  const { openaiKey } = req.body;
  if (openaiKey) {
    apiKey = openaiKey;
    res.json({ success: true, message: 'API key updated' });
  } else {
    res.status(400).json({ success: false, message: 'No API key provided' });
  }
});

// Generate TD script
app.post('/api/generate', async (req, res) => {
  const { prompt, category, style } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Check if API key is configured
  if (!apiKey || apiKey === 'your-api-key-here') {
    // Return a template-based response if no API key
    const templateScript = generateTemplateScript(prompt, category);
    return res.json({
      script: templateScript,
      source: 'template',
      message: 'Generated from built-in templates (no API key configured)'
    });
  }

  try {
    const openai = new OpenAI({ apiKey });

    const enhancedPrompt = buildPrompt(prompt, category, style);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    let script = completion.choices[0].message.content;

    // Clean up: remove markdown code fences if present
    script = script.replace(/^```python\n?/gm, '').replace(/^```\n?/gm, '').trim();

    res.json({
      script,
      source: 'ai',
      tokens: completion.usage?.total_tokens || 0
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.message);

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Fallback to template
    const templateScript = generateTemplateScript(prompt, category);
    res.json({
      script: templateScript,
      source: 'template',
      message: 'AI unavailable, generated from templates'
    });
  }
});

function buildPrompt(prompt, category, style) {
  let enhanced = `Create a TouchDesigner Python script for: ${prompt}`;

  if (category) {
    enhanced += `\n\nCategory: ${category}`;
  }

  if (style) {
    enhanced += `\nVisual Style: ${style}`;
  }

  enhanced += `\n\nMake sure the script is complete, well-organized, and ready to paste into TouchDesigner's Text DAT.`;
  enhanced += `\nUse parent() as the base container.`;
  enhanced += `\nInclude proper operator positioning for a clean network layout.`;

  return enhanced;
}

// ============================================
// TEMPLATE ENGINE (works without API key)
// Turkish + English keyword support
// ============================================

function generateTemplateScript(prompt, category) {
  const p = prompt.toLowerCase();

  // Audio reactive (EN + TR)
  if (p.includes('audio') || p.includes('music') || p.includes('reactive') || p.includes('ses') || p.includes('müzik') || p.includes('reaktif')) return templates.audioReactive;
  // VJ Performance
  if (p.includes('vj') || p.includes('performance') || p.includes('sahne') || p.includes('dj') || p.includes('crossfade')) return newTemplates.vjPerformance;
  // Interactive / Webcam
  if (p.includes('interactive') || p.includes('webcam') || p.includes('kamera') || p.includes('etkileşim') || p.includes('camera')) return newTemplates.interactive;
  // Tunnel
  if (p.includes('tunnel') || p.includes('tünel') || p.includes('wormhole') || p.includes('solucan')) return newTemplates.tunnel;
  // Fluid
  if (p.includes('fluid') || p.includes('sıvı') || p.includes('akışkan') || p.includes('organic') || p.includes('organik')) return newTemplates.fluid;
  // Glitch
  if (p.includes('glitch') || p.includes('datamosh') || p.includes('bozuk') || p.includes('pixel sort') || p.includes('bozulma')) return newTemplates.glitch;
  // Mapping
  if (p.includes('mapping') || p.includes('projection') || p.includes('haritalama') || p.includes('projeksiyon')) return newTemplates.mapping;
  // LED Wall
  if (p.includes('led') || p.includes('panel') || p.includes('stage') || p.includes('duvar') || p.includes('piksel')) return newTemplates.ledWall;
  // Optical Flow
  if (p.includes('optical') || p.includes('flow') || p.includes('akış') || p.includes('hareket') || p.includes('motion')) return newTemplates.opticalFlow;
  // Feedback loop
  if (p.includes('feedback') || p.includes('loop') || p.includes('geri besleme') || p.includes('döngü')) return templates.feedbackLoop;
  // Particle
  if (p.includes('particle') || p.includes('parçacık') || p.includes('partikül')) return templates.particleSystem;
  // Generative noise
  if (p.includes('noise') || p.includes('generative') || p.includes('abstract') || p.includes('gürültü') || p.includes('soyut')) return templates.generativeNoise;
  // Text
  if (p.includes('text') || p.includes('yazı') || p.includes('metin') || p.includes('typography') || p.includes('tipografi')) return templates.textVisual;
  // GLSL
  if (p.includes('glsl') || p.includes('shader') || p.includes('gölgelendirici')) return templates.glslShader;
  // Instancing
  if (p.includes('instanc') || p.includes('kopya') || p.includes('çoğalt')) return templates.instancing;
  // Kaleidoscope
  if (p.includes('kaleidoscop') || p.includes('mirror') || p.includes('ayna') || p.includes('simetri')) return templates.kaleidoscope;

  return templates.generativeNoise;
}

const templates = {
  audioReactive: `# FavAI Designer — Audio Reactive Visual System
# Paste this script into a Text DAT and run it in TouchDesigner
# This creates a complete audio-reactive visual setup

import math

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# AUDIO INPUT & ANALYSIS
# ========================================

# Audio device input
audioIn = parent().create(audiodeviceinCHOP, 'audio_in')
audioIn.nodeX = -400
audioIn.nodeY = 0
audioIn.color = (0.2, 0.5, 0.8)
audioIn.comment = 'Audio Input Device'

# Spectrum analysis
spectrum = parent().create(audiospectrumCHOP, 'spectrum')  # audiospectrumCHOP is correct
spectrum.nodeX = -200
spectrum.nodeY = 0
spectrum.color = (0.2, 0.5, 0.8)
audioIn.outputConnectors[0].connect(spectrum.inputConnectors[0])

# Analyze for RMS level
analyze = parent().create(analyzeCHOP, 'analyze')
analyze.par.function = 'rms'
analyze.nodeX = 0
analyze.nodeY = 0
analyze.color = (0.2, 0.5, 0.8)
spectrum.outputConnectors[0].connect(analyze.inputConnectors[0])

# Lag filter for smooth transitions
lag = parent().create(lagCHOP, 'lag')
lag.par.lag1 = 0.2
lag.par.lag2 = 0.3
lag.nodeX = 200
lag.nodeY = 0
lag.color = (0.2, 0.5, 0.8)
analyze.outputConnectors[0].connect(lag.inputConnectors[0])

# ========================================
# VISUAL GENERATION
# ========================================

# Noise pattern
noise = parent().create(noiseTOP, 'noise_visual')
noise.par.resolutionw = 1920
noise.par.resolutionh = 1080
noise.par.monochrome = False
noise.par.period = 3.0
noise.par.harmonics = 5
noise.par.exponent = 1.5
noise.nodeX = -400
noise.nodeY = -250
noise.color = (0.8, 0.2, 0.5)
noise.comment = 'Main Noise Pattern'

# Expression to animate with time
noise.par.t.expr = "absTime.seconds * 0.05"

# HSV adjust for colorful output
hsv = parent().create(hsvadjustTOP, 'hsv_adjust')
hsv.par.resolutionw = 1920
hsv.par.resolutionh = 1080
hsv.nodeX = -200
hsv.nodeY = -250
hsv.color = (0.8, 0.2, 0.5)
noise.outputConnectors[0].connect(hsv.inputConnectors[0])

# Animate hue with time
hsv.par.hueoffset.expr = "absTime.seconds * 15"

# Transform for audio-driven zoom
transform = parent().create(transformTOP, 'audio_transform')
transform.par.resolutionw = 1920
transform.par.resolutionh = 1080
transform.nodeX = 0
transform.nodeY = -250
transform.color = (0.8, 0.5, 0.2)
hsv.outputConnectors[0].connect(transform.inputConnectors[0])

# Scale driven by audio
transform.par.sx.expr = "1 + op('lag')['chan1'] * 2"
transform.par.sy.expr = "1 + op('lag')['chan1'] * 2"

# Level adjustment
level = parent().create(levelTOP, 'level')
level.par.resolutionw = 1920
level.par.resolutionh = 1080
level.par.opacity = 0.95
level.nodeX = 200
level.nodeY = -250
level.color = (0.8, 0.5, 0.2)
transform.outputConnectors[0].connect(level.inputConnectors[0])

# ========================================
# OUTPUT
# ========================================

# Final null output
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 400
null_out.nodeY = -250
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Audio Reactive setup complete!")

# --- Created Nodes ---
# audio_in (audiodeviceinCHOP)
# spectrum (audiospectrumCHOP)
# analyze (analyzeCHOP)
# lag (lagCHOP)
# noise_visual (noiseTOP)
# hsv_adjust (hsvadjustTOP)
# audio_transform (transformTOP)
# level (levelTOP)
# OUT (nullTOP)`,

  feedbackLoop: `# FavAI Designer — Feedback Loop Visual
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates a mesmerizing feedback loop effect

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# FEEDBACK LOOP NETWORK
# ========================================

# Noise source
noise = parent().create(noiseTOP, 'noise_src')
noise.par.resolutionw = 1920
noise.par.resolutionh = 1080
noise.par.monochrome = False
noise.par.period = 4.0
noise.par.harmonics = 3
noise.par.amplitude = 0.6
noise.par.t.expr = "absTime.seconds * 0.03"
noise.nodeX = -400
noise.nodeY = 0
noise.color = (0.5, 0.2, 0.8)
noise.comment = 'Noise Source'

# Feedback TOP
feedback = parent().create(feedbackTOP, 'feedback')
feedback.par.resolutionw = 1920
feedback.par.resolutionh = 1080
feedback.nodeX = 200
feedback.nodeY = 200
feedback.color = (0.8, 0.4, 0.1)
feedback.comment = 'Feedback Loop'

# Transform the feedback
transform = parent().create(transformTOP, 'fb_transform')
transform.par.resolutionw = 1920
transform.par.resolutionh = 1080
transform.par.sx = 1.02
transform.par.sy = 1.02
transform.par.r.expr = "1.5"
transform.par.extend = 'mirror'
transform.nodeX = 0
transform.nodeY = 200
transform.color = (0.8, 0.4, 0.1)
feedback.outputConnectors[0].connect(transform.inputConnectors[0])

# Composite: mix noise with feedback
comp = parent().create(compositeTOP, 'composite')
comp.par.resolutionw = 1920
comp.par.resolutionh = 1080
comp.par.operand = 'over'
comp.nodeX = -200
comp.nodeY = 0
comp.color = (0.2, 0.6, 0.8)
noise.outputConnectors[0].connect(comp.inputConnectors[0])
transform.outputConnectors[0].connect(comp.inputConnectors[1])

# HSV Adjust for color cycling
hsv = parent().create(hsvadjustTOP, 'color_cycle')
hsv.par.resolutionw = 1920
hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 10"
hsv.par.saturationmult = 1.3
hsv.nodeX = 0
hsv.nodeY = 0
hsv.color = (0.2, 0.6, 0.8)
comp.outputConnectors[0].connect(hsv.inputConnectors[0])

# Level for brightness control
level = parent().create(levelTOP, 'level')
level.par.resolutionw = 1920
level.par.resolutionh = 1080
level.par.opacity = 0.92
level.par.brightness1 = 1.05
level.nodeX = 200
level.nodeY = 0
level.color = (0.2, 0.6, 0.8)
hsv.outputConnectors[0].connect(level.inputConnectors[0])

# Connect back to feedback
level.outputConnectors[0].connect(feedback.inputConnectors[0])

# Output null
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 400
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Feedback Loop setup complete!")

# --- Created Nodes ---
# noise_src (noiseTOP)
# feedback (feedbackTOP)
# fb_transform (transformTOP)
# composite (compositeTOP)
# color_cycle (hsvadjustTOP)
# level (levelTOP)
# OUT (nullTOP)`,

  generativeNoise: `# FavAI Designer — Generative Abstract Visual
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates a beautiful evolving abstract composition

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# LAYER 1: Primary Noise Field
# ========================================

noise1 = parent().create(noiseTOP, 'noise_primary')
noise1.par.resolutionw = 1920
noise1.par.resolutionh = 1080
noise1.par.monochrome = False
noise1.par.period = 5.0
noise1.par.harmonics = 6
noise1.par.exponent = 1.8
noise1.par.amplitude = 1.0
noise1.par.t.expr = "absTime.seconds * 0.02"
noise1.nodeX = -600
noise1.nodeY = 0
noise1.color = (0.6, 0.2, 0.8)
noise1.comment = 'Primary Noise Field'

# ========================================
# LAYER 2: Secondary Detail Noise
# ========================================

noise2 = parent().create(noiseTOP, 'noise_detail')
noise2.par.resolutionw = 1920
noise2.par.resolutionh = 1080
noise2.par.monochrome = True
noise2.par.period = 1.5
noise2.par.harmonics = 8
noise2.par.exponent = 2.0
noise2.par.t.expr = "absTime.seconds * 0.08"
noise2.nodeX = -600
noise2.nodeY = -250
noise2.color = (0.3, 0.4, 0.8)
noise2.comment = 'Detail Layer'

# ========================================
# DISPLACEMENT
# ========================================

displace = parent().create(displaceTOP, 'displace')
displace.par.resolutionw = 1920
displace.par.resolutionh = 1080
displace.par.displaceweight = 0.15
displace.nodeX = -400
displace.nodeY = 0
displace.color = (0.5, 0.3, 0.7)
noise1.outputConnectors[0].connect(displace.inputConnectors[0])
noise2.outputConnectors[0].connect(displace.inputConnectors[1])

# ========================================
# COLOR PROCESSING
# ========================================

# HSV for evolving color palette
hsv = parent().create(hsvadjustTOP, 'color_palette')
hsv.par.resolutionw = 1920
hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 8"
hsv.par.saturationmult = 1.4
hsv.par.valuemult = 1.2
hsv.nodeX = -200
hsv.nodeY = 0
hsv.color = (0.8, 0.5, 0.2)
displace.outputConnectors[0].connect(hsv.inputConnectors[0])

# Ramp for gradient overlay
ramp = parent().create(rampTOP, 'gradient')
ramp.par.resolutionw = 1920
ramp.par.resolutionh = 1080
ramp.par.dat = ''
ramp.nodeX = -200
ramp.nodeY = -250
ramp.color = (0.8, 0.5, 0.2)

# Multiply composite
multiply = parent().create(compositeTOP, 'blend')
multiply.par.resolutionw = 1920
multiply.par.resolutionh = 1080
multiply.par.operand = 'multiply'
multiply.nodeX = 0
multiply.nodeY = 0
multiply.color = (0.8, 0.5, 0.2)
hsv.outputConnectors[0].connect(multiply.inputConnectors[0])
ramp.outputConnectors[0].connect(multiply.inputConnectors[1])

# ========================================
# POST PROCESSING
# ========================================

# Edge detection for extra detail
edge = parent().create(edgeTOP, 'edge')
edge.par.resolutionw = 1920
edge.par.resolutionh = 1080
edge.nodeX = 0
edge.nodeY = -250
edge.color = (0.2, 0.7, 0.6)
multiply.outputConnectors[0].connect(edge.inputConnectors[0])

# Add edges back
addComp = parent().create(compositeTOP, 'add_edge')
addComp.par.resolutionw = 1920
addComp.par.resolutionh = 1080
addComp.par.operand = 'add'
addComp.nodeX = 200
addComp.nodeY = 0
addComp.color = (0.2, 0.7, 0.6)
multiply.outputConnectors[0].connect(addComp.inputConnectors[0])
edge.outputConnectors[0].connect(addComp.inputConnectors[1])

# Level adjustment
level = parent().create(levelTOP, 'final_level')
level.par.resolutionw = 1920
level.par.resolutionh = 1080
level.par.brightness1 = 1.1
level.par.contrast = 1.15
level.par.gamma1 = 0.9
level.nodeX = 400
level.nodeY = 0
level.color = (0.2, 0.7, 0.6)
addComp.outputConnectors[0].connect(level.inputConnectors[0])

# ========================================
# OUTPUT
# ========================================

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 600
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Generative Abstract setup complete!")

# --- Created Nodes ---
# noise_primary (noiseTOP)
# noise_detail (noiseTOP)
# displace (displaceTOP)
# color_palette (hsvadjustTOP)
# gradient (rampTOP)
# blend (compositeTOP)
# edge (edgeTOP)
# add_edge (compositeTOP)
# final_level (levelTOP)
# OUT (nullTOP)`,

  particleSystem: `# FavAI Designer — 3D Particle System
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates a particle system with 3D rendering

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# PARTICLE EMITTER GEOMETRY
# ========================================

# Grid as emitter source
grid = parent().create(gridSOP, 'emitter_grid')
grid.par.rows = 20
grid.par.cols = 20
grid.par.sizex = 5
grid.par.sizey = 5
grid.nodeX = -400
grid.nodeY = 200
grid.color = (0.5, 0.5, 0.2)
grid.comment = 'Particle Emitter Shape'

# Noise on geometry
noiseGeo = parent().create(noiseSOP, 'geo_noise')
noiseGeo.par.amp = 0.5
noiseGeo.par.period = 2.0
noiseGeo.nodeX = -200
noiseGeo.nodeY = 200
noiseGeo.color = (0.5, 0.5, 0.2)
grid.outputConnectors[0].connect(noiseGeo.inputConnectors[0])

# Particle SOP
particle = parent().create(particleSOP, 'particles')
particle.par.birthrate = 500
particle.par.life = 3.0
particle.par.speed = 0.3
particle.nodeX = 0
particle.nodeY = 200
particle.color = (0.8, 0.3, 0.2)
particle.comment = 'Particle Generator'
noiseGeo.outputConnectors[0].connect(particle.inputConnectors[0])

# ========================================
# 3D RENDERING SETUP
# ========================================

# Geometry COMP
geo = parent().create(geometryCOMP, 'geo_render')
geo.nodeX = 200
geo.nodeY = 200
geo.color = (0.2, 0.5, 0.8)

# Camera
cam = parent().create(cameraCOMP, 'camera')
cam.par.tx = 0
cam.par.ty = 2
cam.par.tz = 8
cam.par.rx = -15
cam.nodeX = 0
cam.nodeY = 0
cam.color = (0.8, 0.8, 0.2)
cam.comment = 'Main Camera'

# Light
light = parent().create(lightCOMP, 'light')
light.par.tx = 3
light.par.ty = 5
light.par.tz = 3
light.nodeX = -200
light.nodeY = 0
light.color = (0.8, 0.8, 0.2)

# Point sprite material
mat = parent().create(pointspriteMAT, 'point_mat')
mat.par.pointcolorr = 0.3
mat.par.pointcolorg = 0.7
mat.par.pointcolorb = 1.0
mat.par.alpha = 0.8
mat.nodeX = 200
mat.nodeY = 400
mat.color = (0.7, 0.3, 0.6)

# Render TOP
render = parent().create(renderTOP, 'render')
render.par.resolutionw = 1920
render.par.resolutionh = 1080
render.par.camera = cam.path
render.nodeX = 400
render.nodeY = 0
render.color = (0.2, 0.6, 0.8)
render.comment = '3D Render'

# Post-processing: Blur for glow
blur = parent().create(blurTOP, 'glow')
blur.par.resolutionw = 1920
blur.par.resolutionh = 1080
blur.par.size = 5
blur.nodeX = 400
blur.nodeY = -200
blur.color = (0.2, 0.6, 0.8)
render.outputConnectors[0].connect(blur.inputConnectors[0])

# Add glow
addGlow = parent().create(compositeTOP, 'add_glow')
addGlow.par.resolutionw = 1920
addGlow.par.resolutionh = 1080
addGlow.par.operand = 'add'
addGlow.nodeX = 600
addGlow.nodeY = 0
addGlow.color = (0.2, 0.6, 0.8)
render.outputConnectors[0].connect(addGlow.inputConnectors[0])
blur.outputConnectors[0].connect(addGlow.inputConnectors[1])

# Output
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 800
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
addGlow.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Particle System setup complete!")

# --- Created Nodes ---
# emitter_grid (gridSOP)
# geo_noise (noiseSOP)
# particles (particleSOP)
# geo_render (geometryCOMP)
# camera (cameraCOMP)
# light (lightCOMP)
# point_mat (pointspriteMAT)
# render (renderTOP)
# glow (blurTOP)
# add_glow (compositeTOP)
# OUT (nullTOP)`,

  textVisual: `# FavAI Designer — Animated Text Visual
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates animated text with visual effects

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# TEXT GENERATION
# ========================================

# Main text
text = parent().create(textTOP, 'main_text')
text.par.resolutionw = 1920
text.par.resolutionh = 1080
text.par.text = 'FavAI'
text.par.fontsizex = 150
text.par.alignx = 'center'
text.par.aligny = 'center'
text.par.fontcolorr = 1.0
text.par.fontcolorg = 1.0
text.par.fontcolorb = 1.0
text.par.fontalpha = 1.0
text.par.bgcolorr = 0
text.par.bgcolorg = 0
text.par.bgcolorb = 0
text.par.bgalpha = 0
text.nodeX = -400
text.nodeY = 0
text.color = (0.8, 0.3, 0.5)
text.comment = 'Main Text Element'

# ========================================
# VISUAL EFFECTS
# ========================================

# Noise for displacement
noise = parent().create(noiseTOP, 'displace_noise')
noise.par.resolutionw = 1920
noise.par.resolutionh = 1080
noise.par.monochrome = True
noise.par.period = 3.0
noise.par.harmonics = 4
noise.par.t.expr = "absTime.seconds * 0.1"
noise.nodeX = -400
noise.nodeY = -250
noise.color = (0.3, 0.5, 0.7)

# Displace text
displace = parent().create(displaceTOP, 'text_displace')
displace.par.resolutionw = 1920
displace.par.resolutionh = 1080
displace.par.displaceweight = 0.03
displace.nodeX = -200
displace.nodeY = 0
displace.color = (0.3, 0.5, 0.7)
text.outputConnectors[0].connect(displace.inputConnectors[0])
noise.outputConnectors[0].connect(displace.inputConnectors[1])

# Edge for outline
edge = parent().create(edgeTOP, 'text_edge')
edge.par.resolutionw = 1920
edge.par.resolutionh = 1080
edge.nodeX = -200
edge.nodeY = -250
edge.color = (0.7, 0.3, 0.5)
displace.outputConnectors[0].connect(edge.inputConnectors[0])

# Composite text + edge
comp = parent().create(compositeTOP, 'comp')
comp.par.resolutionw = 1920
comp.par.resolutionh = 1080
comp.par.operand = 'add'
comp.nodeX = 0
comp.nodeY = 0
comp.color = (0.7, 0.3, 0.5)
displace.outputConnectors[0].connect(comp.inputConnectors[0])
edge.outputConnectors[0].connect(comp.inputConnectors[1])

# HSV color animation
hsv = parent().create(hsvadjustTOP, 'color_anim')
hsv.par.resolutionw = 1920
hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 20"
hsv.par.saturationmult = 1.5
hsv.nodeX = 200
hsv.nodeY = 0
hsv.color = (0.5, 0.7, 0.3)
comp.outputConnectors[0].connect(hsv.inputConnectors[0])

# Blur glow
blur = parent().create(blurTOP, 'glow')
blur.par.resolutionw = 1920
blur.par.resolutionh = 1080
blur.par.size = 10
blur.nodeX = 200
blur.nodeY = -250
blur.color = (0.5, 0.7, 0.3)
hsv.outputConnectors[0].connect(blur.inputConnectors[0])

# Add glow back
addGlow = parent().create(compositeTOP, 'add_glow')
addGlow.par.resolutionw = 1920
addGlow.par.resolutionh = 1080
addGlow.par.operand = 'add'
addGlow.nodeX = 400
addGlow.nodeY = 0
addGlow.color = (0.5, 0.7, 0.3)
hsv.outputConnectors[0].connect(addGlow.inputConnectors[0])
blur.outputConnectors[0].connect(addGlow.inputConnectors[1])

# Output
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 600
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
addGlow.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Text Visual setup complete!")

# --- Created Nodes ---
# main_text (textTOP)
# displace_noise (noiseTOP)
# text_displace (displaceTOP)
# text_edge (edgeTOP)
# comp (compositeTOP)
# color_anim (hsvadjustTOP)
# glow (blurTOP)
# add_glow (compositeTOP)
# OUT (nullTOP)`,

  glslShader: `# FavAI Designer — Custom GLSL Shader
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates a GLSL TOP with a stunning shader

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# GLSL SHADER SETUP
# ========================================

# Create a Text DAT for the shader code
shaderCode = parent().create(textDAT, 'shader_code')
shaderCode.nodeX = -400
shaderCode.nodeY = 0
shaderCode.color = (0.8, 0.6, 0.2)
shaderCode.comment = 'GLSL Fragment Shader'

# Write shader code
shaderCode.text = """
// FavAI Designer - Organic Flow Shader
uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * smoothNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUV.st;
    vec2 p = uv * 4.0 - 2.0;
    
    float t = uTime * 0.3;
    
    float n1 = fbm(p + vec2(t * 0.5, t * 0.3));
    float n2 = fbm(p + vec2(n1 * 2.0, t * 0.2));
    float n3 = fbm(p + vec2(n2 * 1.5, n1 * 2.0 + t));
    
    vec3 col1 = vec3(0.1, 0.3, 0.8);   // Deep blue
    vec3 col2 = vec3(0.8, 0.2, 0.5);   // Magenta
    vec3 col3 = vec3(0.1, 0.8, 0.6);   // Teal
    
    vec3 color = mix(col1, col2, n2);
    color = mix(color, col3, n3 * 0.5);
    color += 0.1 * sin(n1 * 10.0 + t);
    
    fragColor = TDOutputSwizzle(vec4(color, 1.0));
}
"""

# GLSL TOP
glsl = parent().create(glslmultiTOP, 'glsl_shader')
glsl.par.resolutionw = 1920
glsl.par.resolutionh = 1080
glsl.nodeX = -200
glsl.nodeY = 0
glsl.color = (0.8, 0.4, 0.2)
glsl.comment = 'Custom GLSL Shader'

# Level for final adjustment
level = parent().create(levelTOP, 'final_level')
level.par.resolutionw = 1920
level.par.resolutionh = 1080
level.par.brightness1 = 1.1
level.par.contrast = 1.2
level.nodeX = 0
level.nodeY = 0
level.color = (0.2, 0.6, 0.7)
glsl.outputConnectors[0].connect(level.inputConnectors[0])

# Output
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 200
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: GLSL Shader setup complete!")

# --- Created Nodes ---
# shader_code (textDAT)
# glsl_shader (glslmultiTOP)
# final_level (levelTOP)
# OUT (nullTOP)`,

  instancing: `# FavAI Designer — 3D Instancing System
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates instanced geometry with animated transforms

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# INSTANCE DATA
# ========================================

# Noise CHOP for positions
noisePos = parent().create(noiseCHOP, 'pos_noise')
noisePos.par.channelname = 'tx ty tz'
noisePos.par.period = 8
noisePos.par.amplitude = 5
noisePos.par.type = 'sparse'
noisePos.par.seed = 1
noisePos.nodeX = -400
noisePos.nodeY = 0
noisePos.color = (0.5, 0.3, 0.7)
noisePos.comment = 'Instance Positions'

# Pattern for rotation
pattern = parent().create(patternCHOP, 'rot_pattern')
pattern.par.channelname = 'rx ry rz'
pattern.par.type = 'ramp'
pattern.par.length = 100
pattern.nodeX = -400
pattern.nodeY = -200
pattern.color = (0.5, 0.3, 0.7)

# ========================================
# BASE GEOMETRY
# ========================================

# Box as instance source
box = parent().create(boxSOP, 'instance_shape')
box.par.sizex = 0.2
box.par.sizey = 0.2
box.par.sizez = 0.2
box.nodeX = -400
box.nodeY = 400
box.color = (0.3, 0.6, 0.5)

# Geometry COMP with instancing
geo = parent().create(geometryCOMP, 'instanced_geo')
geo.par.instancing = True
geo.nodeX = 0
geo.nodeY = 200
geo.color = (0.3, 0.6, 0.8)
geo.comment = 'Instanced Geometry'

# ========================================
# RENDERING
# ========================================

# Camera
cam = parent().create(cameraCOMP, 'cam')
cam.par.tz = 15
cam.par.ty = 3
cam.par.rx = -10
cam.nodeX = 0
cam.nodeY = 0
cam.color = (0.8, 0.7, 0.2)

# Light
light = parent().create(lightCOMP, 'light')
light.par.tx = 5
light.par.ty = 8
light.par.tz = 5
light.nodeX = -200
light.nodeY = 0
light.color = (0.8, 0.7, 0.2)

# PBR Material
mat = parent().create(pbrMAT, 'pbr_mat')
mat.par.basecolorr = 0.3
mat.par.basecolorg = 0.5
mat.par.basecolorb = 0.9
mat.par.metallic = 0.8
mat.par.roughness = 0.2
mat.nodeX = 0
mat.nodeY = 400
mat.color = (0.7, 0.4, 0.5)

# Render
render = parent().create(renderTOP, 'render')
render.par.resolutionw = 1920
render.par.resolutionh = 1080
render.par.camera = cam.path
render.nodeX = 200
render.nodeY = 0
render.color = (0.2, 0.6, 0.8)

# Blur glow
blur = parent().create(blurTOP, 'bloom')
blur.par.resolutionw = 1920
blur.par.resolutionh = 1080
blur.par.size = 3
blur.nodeX = 400
blur.nodeY = -200
blur.color = (0.2, 0.6, 0.8)
render.outputConnectors[0].connect(blur.inputConnectors[0])

# Composite glow
comp = parent().create(compositeTOP, 'add_bloom')
comp.par.resolutionw = 1920
comp.par.resolutionh = 1080
comp.par.operand = 'add'
comp.nodeX = 400
comp.nodeY = 0
comp.color = (0.2, 0.6, 0.8)
render.outputConnectors[0].connect(comp.inputConnectors[0])
blur.outputConnectors[0].connect(comp.inputConnectors[1])

# Output
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 600
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
comp.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Instancing System setup complete!")

# --- Created Nodes ---
# pos_noise (noiseCHOP)
# rot_pattern (patternCHOP)
# instance_shape (boxSOP)
# instanced_geo (geometryCOMP)
# cam (cameraCOMP)
# light (lightCOMP)
# pbr_mat (pbrMAT)
# render (renderTOP)
# bloom (blurTOP)
# add_bloom (compositeTOP)
# OUT (nullTOP)`,

  kaleidoscope: `# FavAI Designer — Kaleidoscope Mirror Effect
# Paste this script into a Text DAT and run it in TouchDesigner
# Creates a kaleidoscopic mirror effect with evolving patterns

# --- Cleanup existing operators ---
for c in parent().children:
    if c.name != me.name:
        c.destroy()

# ========================================
# SOURCE PATTERN
# ========================================

noise = parent().create(noiseTOP, 'source_noise')
noise.par.resolutionw = 1920
noise.par.resolutionh = 1080
noise.par.monochrome = False
noise.par.period = 3.0
noise.par.harmonics = 5
noise.par.t.expr = "absTime.seconds * 0.04"
noise.nodeX = -600
noise.nodeY = 0
noise.color = (0.6, 0.2, 0.8)
noise.comment = 'Source Pattern'

# HSV for vivid colors
hsv = parent().create(hsvadjustTOP, 'vivid')
hsv.par.resolutionw = 1920
hsv.par.resolutionh = 1080
hsv.par.saturationmult = 2.0
hsv.par.hueoffset.expr = "absTime.seconds * 12"
hsv.nodeX = -400
hsv.nodeY = 0
hsv.color = (0.8, 0.5, 0.3)
noise.outputConnectors[0].connect(hsv.inputConnectors[0])

# ========================================  
# KALEIDOSCOPE (Mirror Transforms)
# ========================================

# Flip horizontal
flipH = parent().create(flipTOP, 'mirror_h')
flipH.par.resolutionw = 1920
flipH.par.resolutionh = 1080
flipH.par.flipx = True
flipH.nodeX = -200
flipH.nodeY = -200
flipH.color = (0.3, 0.6, 0.8)
hsv.outputConnectors[0].connect(flipH.inputConnectors[0])

# Composite original + flipped
comp1 = parent().create(compositeTOP, 'kaleido_h')
comp1.par.resolutionw = 1920
comp1.par.resolutionh = 1080
comp1.par.operand = 'add'
comp1.nodeX = -200
comp1.nodeY = 0
comp1.color = (0.3, 0.6, 0.8)
hsv.outputConnectors[0].connect(comp1.inputConnectors[0])
flipH.outputConnectors[0].connect(comp1.inputConnectors[1])

# Flip vertical
flipV = parent().create(flipTOP, 'mirror_v')
flipV.par.resolutionw = 1920
flipV.par.resolutionh = 1080
flipV.par.flipy = True
flipV.nodeX = 0
flipV.nodeY = -200
flipV.color = (0.3, 0.6, 0.8)
comp1.outputConnectors[0].connect(flipV.inputConnectors[0])

# Composite for full mirror
comp2 = parent().create(compositeTOP, 'kaleido_v')
comp2.par.resolutionw = 1920
comp2.par.resolutionh = 1080
comp2.par.operand = 'add'
comp2.nodeX = 0
comp2.nodeY = 0
comp2.color = (0.3, 0.6, 0.8)
comp1.outputConnectors[0].connect(comp2.inputConnectors[0])
flipV.outputConnectors[0].connect(comp2.inputConnectors[1])

# ========================================
# ROTATION ANIMATION
# ========================================

transform = parent().create(transformTOP, 'rotate')
transform.par.resolutionw = 1920
transform.par.resolutionh = 1080
transform.par.r.expr = "absTime.seconds * 15"
transform.par.extend = 'mirror'
transform.nodeX = 200
transform.nodeY = 0
transform.color = (0.7, 0.4, 0.2)
comp2.outputConnectors[0].connect(transform.inputConnectors[0])

# ========================================
# POST PROCESSING
# ========================================

# Level normalization
level = parent().create(levelTOP, 'normalize')
level.par.resolutionw = 1920
level.par.resolutionh = 1080
level.par.opacity = 0.85
level.par.brightness1 = 0.9
level.par.contrast = 1.3
level.nodeX = 400
level.nodeY = 0
level.color = (0.2, 0.7, 0.5)
transform.outputConnectors[0].connect(level.inputConnectors[0])

# Output
null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920
null_out.par.resolutionh = 1080
null_out.nodeX = 600
null_out.nodeY = 0
null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FINAL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True
null_out.display = True

print("✅ FavAI Designer: Kaleidoscope setup complete!")

# --- Created Nodes ---
# source_noise (noiseTOP)
# vivid (hsvadjustTOP)
# mirror_h (flipTOP)
# kaleido_h (compositeTOP)
# mirror_v (flipTOP)
# kaleido_v (compositeTOP)
# rotate (transformTOP)
# normalize (levelTOP)
# OUT (nullTOP)`
};

// ============================================
// WEBSOCKET SERVER for TouchDesigner Bridge
// (Only in non-serverless / local environments)
// ============================================

let tdClients = new Set();

// Send script to TouchDesigner
app.post('/api/send-to-td', (req, res) => {
  const { script } = req.body;
  if (!script) return res.status(400).json({ error: 'No script' });
  if (tdClients.size === 0) return res.status(404).json({ error: 'No TouchDesigner connected' });
  let sent = 0;
  tdClients.forEach(c => {
    if (c.readyState === 1) { c.send(JSON.stringify({ type: 'execute', script })); sent++; }
  });
  res.json({ success: true, clients: sent });
});

// TD connection status
app.get('/api/td-status', (req, res) => {
  res.json({ connected: tdClients.size > 0, clients: tdClients.size });
});

// Serve TD bridge script
app.get('/api/td-bridge-script', (req, res) => {
  try {
    const script = fs.readFileSync(path.join(__dirname, 'td-bridge', 'favai_bridge.py'), 'utf-8');
    res.type('text/plain').send(script);
  } catch (e) {
    res.status(404).json({ error: 'Bridge script not found' });
  }
});

// Only start server when run directly (not when imported by Vercel)
if (require.main === module) {
  const server = http.createServer(app);

  // WebSocket only in local mode
  if (WebSocketServer) {
    const wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws) => {
      console.log('[WS] TouchDesigner connected!');
      tdClients.add(ws);
      ws.on('close', () => {
        tdClients.delete(ws);
        console.log('[WS] TouchDesigner disconnected');
      });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          console.log('[WS] TD message:', msg.type);
        } catch (e) { }
      });
    });
  }

  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   ⚡ FavAI Designer v2.0                    ║
║   🌐 http://localhost:${PORT}                  ║
║   🔌 WebSocket: ws://localhost:${PORT}/ws      ║
║                                              ║
║   16 Templates • AI Mode • TD Bridge         ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel serverless
module.exports = app;
