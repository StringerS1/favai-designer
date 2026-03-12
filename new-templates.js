// FavAI Designer — New Templates (VJ, Interactive, Tunnel, Fluid, Glitch, Mapping, LED, Optical Flow)
// ALL operator class names are VERIFIED TouchDesigner Python API names (lowercase before suffix)

const newTemplates = {

    vjPerformance: `# FavAI Designer — VJ Performance Multi-Layer System
for c in parent().children:
    if c.name != me.name: c.destroy()

# Layer A - Noise
layerA = parent().create(noiseTOP, 'layer_a')
layerA.par.resolutionw = 1920; layerA.par.resolutionh = 1080
layerA.par.monochrome = False; layerA.par.period = 4.0; layerA.par.harmonics = 5
layerA.par.t.expr = "absTime.seconds * 0.03"
layerA.nodeX = -600; layerA.nodeY = 0; layerA.color = (0.8, 0.2, 0.4)

# Layer B - Ramp gradient
layerB = parent().create(rampTOP, 'layer_b')
layerB.par.resolutionw = 1920; layerB.par.resolutionh = 1080
layerB.nodeX = -600; layerB.nodeY = -200; layerB.color = (0.2, 0.4, 0.8)

# LFO for crossfade
lfo = parent().create(lfoCHOP, 'crossfade_lfo')
lfo.par.frequency = 0.1; lfo.par.type = 'sin'
lfo.nodeX = -600; lfo.nodeY = 200; lfo.color = (0.6, 0.6, 0.2)

# Switch between layers
switch = parent().create(switchTOP, 'layer_switch')
switch.par.resolutionw = 1920; switch.par.resolutionh = 1080
switch.par.blend = True
switch.par.index.expr = "op('crossfade_lfo')['chan1'] * 0.5 + 0.5"
switch.nodeX = -400; switch.nodeY = 0; switch.color = (0.5, 0.3, 0.7)
layerA.outputConnectors[0].connect(switch.inputConnectors[0])
layerB.outputConnectors[0].connect(switch.inputConnectors[1])

# Transform with rotation
transform = parent().create(transformTOP, 'vj_transform')
transform.par.resolutionw = 1920; transform.par.resolutionh = 1080
transform.par.r.expr = "absTime.seconds * 5"
transform.par.sx.expr = "1 + sin(absTime.seconds * 0.5) * 0.3"
transform.par.sy.expr = "1 + sin(absTime.seconds * 0.5) * 0.3"
transform.par.extend = 'mirror'
transform.nodeX = -200; transform.nodeY = 0; transform.color = (0.5, 0.3, 0.7)
switch.outputConnectors[0].connect(transform.inputConnectors[0])

# HSV color cycling
hsv = parent().create(hsvadjustTOP, 'vj_color')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 25"
hsv.par.saturationmult = 1.6
hsv.nodeX = 0; hsv.nodeY = 0; hsv.color = (0.7, 0.5, 0.2)
transform.outputConnectors[0].connect(hsv.inputConnectors[0])

# Level + contrast
level = parent().create(levelTOP, 'vj_level')
level.par.resolutionw = 1920; level.par.resolutionh = 1080
level.par.contrast = 1.4; level.par.brightness1 = 1.1
level.nodeX = 200; level.nodeY = 0; level.color = (0.7, 0.5, 0.2)
hsv.outputConnectors[0].connect(level.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'VJ OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: VJ Performance setup complete!")

# --- Created Nodes ---
# layer_a (noiseTOP), layer_b (rampTOP), crossfade_lfo (lfoCHOP)
# layer_switch (switchTOP), vj_transform (transformTOP)
# vj_color (hsvadjustTOP), vj_level (levelTOP), OUT (nullTOP)`,

    interactive: `# FavAI Designer — Interactive Webcam Visual
for c in parent().children:
    if c.name != me.name: c.destroy()

# Webcam input
cam = parent().create(videodeviceinTOP, 'webcam')
cam.par.resolutionw = 1920; cam.par.resolutionh = 1080
cam.nodeX = -600; cam.nodeY = 0; cam.color = (0.2, 0.6, 0.8)
cam.comment = 'Webcam Input'

# Edge detection on camera
edge = parent().create(edgeTOP, 'cam_edge')
edge.par.resolutionw = 1920; edge.par.resolutionh = 1080
edge.nodeX = -400; edge.nodeY = -200; edge.color = (0.5, 0.3, 0.7)
cam.outputConnectors[0].connect(edge.inputConnectors[0])

# Feedback loop on edges
feedback = parent().create(feedbackTOP, 'fb')
feedback.par.resolutionw = 1920; feedback.par.resolutionh = 1080
feedback.nodeX = 0; feedback.nodeY = -400; feedback.color = (0.8, 0.4, 0.1)

fbTransform = parent().create(transformTOP, 'fb_xform')
fbTransform.par.resolutionw = 1920; fbTransform.par.resolutionh = 1080
fbTransform.par.sx = 1.01; fbTransform.par.sy = 1.01; fbTransform.par.r = 0.5
fbTransform.par.extend = 'mirror'
fbTransform.nodeX = -200; fbTransform.nodeY = -400; fbTransform.color = (0.8, 0.4, 0.1)
feedback.outputConnectors[0].connect(fbTransform.inputConnectors[0])

# Composite camera edges + feedback
comp = parent().create(compositeTOP, 'mix')
comp.par.resolutionw = 1920; comp.par.resolutionh = 1080
comp.par.operand = 'add'
comp.nodeX = -200; comp.nodeY = 0; comp.color = (0.5, 0.5, 0.3)
edge.outputConnectors[0].connect(comp.inputConnectors[0])
fbTransform.outputConnectors[0].connect(comp.inputConnectors[1])

# HSV color
hsv = parent().create(hsvadjustTOP, 'color')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 15"
hsv.par.saturationmult = 2.0
hsv.nodeX = 0; hsv.nodeY = 0; hsv.color = (0.7, 0.3, 0.5)
comp.outputConnectors[0].connect(hsv.inputConnectors[0])

# Feed back
level = parent().create(levelTOP, 'fb_level')
level.par.resolutionw = 1920; level.par.resolutionh = 1080
level.par.opacity = 0.85
level.nodeX = 0; level.nodeY = -200; level.color = (0.7, 0.3, 0.5)
hsv.outputConnectors[0].connect(level.inputConnectors[0])
level.outputConnectors[0].connect(feedback.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 200; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'INTERACTIVE OUTPUT'
hsv.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: Interactive Webcam setup complete!")

# --- Created Nodes ---
# webcam (videodeviceinTOP), cam_edge (edgeTOP), fb (feedbackTOP)
# fb_xform (transformTOP), mix (compositeTOP), color (hsvadjustTOP)
# fb_level (levelTOP), OUT (nullTOP)`,

    tunnel: `# FavAI Designer — Tunnel / Wormhole Effect
for c in parent().children:
    if c.name != me.name: c.destroy()

# Noise source
noise = parent().create(noiseTOP, 'tunnel_noise')
noise.par.resolutionw = 1920; noise.par.resolutionh = 1080
noise.par.monochrome = False; noise.par.period = 2.0; noise.par.harmonics = 4
noise.par.t.expr = "absTime.seconds * 0.1"
noise.nodeX = -400; noise.nodeY = 0; noise.color = (0.5, 0.2, 0.8)

# Feedback
feedback = parent().create(feedbackTOP, 'fb')
feedback.par.resolutionw = 1920; feedback.par.resolutionh = 1080
feedback.nodeX = 200; feedback.nodeY = 200; feedback.color = (0.8, 0.3, 0.2)

# Transform: zoom in + rotate = tunnel effect
transform = parent().create(transformTOP, 'tunnel_xform')
transform.par.resolutionw = 1920; transform.par.resolutionh = 1080
transform.par.sx = 0.98; transform.par.sy = 0.98
transform.par.r.expr = "2"
transform.par.extend = 'mirror'
transform.nodeX = 0; transform.nodeY = 200; transform.color = (0.8, 0.3, 0.2)
feedback.outputConnectors[0].connect(transform.inputConnectors[0])

# Mix noise into feedback
comp = parent().create(compositeTOP, 'mix')
comp.par.resolutionw = 1920; comp.par.resolutionh = 1080
comp.par.operand = 'over'
comp.nodeX = -200; comp.nodeY = 0; comp.color = (0.3, 0.5, 0.8)
noise.outputConnectors[0].connect(comp.inputConnectors[0])
transform.outputConnectors[0].connect(comp.inputConnectors[1])

# HSV
hsv = parent().create(hsvadjustTOP, 'color')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 20"
hsv.par.saturationmult = 1.5
hsv.nodeX = 0; hsv.nodeY = 0; hsv.color = (0.3, 0.5, 0.8)
comp.outputConnectors[0].connect(hsv.inputConnectors[0])

level = parent().create(levelTOP, 'level')
level.par.resolutionw = 1920; level.par.resolutionh = 1080
level.par.opacity = 0.95; level.par.contrast = 1.2
level.nodeX = 200; level.nodeY = 0; level.color = (0.3, 0.5, 0.8)
hsv.outputConnectors[0].connect(level.inputConnectors[0])
level.outputConnectors[0].connect(feedback.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'TUNNEL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: Tunnel Effect setup complete!")

# --- Created Nodes ---
# tunnel_noise (noiseTOP), fb (feedbackTOP), tunnel_xform (transformTOP)
# mix (compositeTOP), color (hsvadjustTOP), level (levelTOP), OUT (nullTOP)`,

    fluid: `# FavAI Designer — Fluid / Organic Flow
for c in parent().children:
    if c.name != me.name: c.destroy()

# Base noise layer 1
n1 = parent().create(noiseTOP, 'flow_a')
n1.par.resolutionw = 1920; n1.par.resolutionh = 1080
n1.par.monochrome = False; n1.par.period = 6.0; n1.par.harmonics = 8
n1.par.exponent = 2.2; n1.par.amplitude = 1.0
n1.par.t.expr = "absTime.seconds * 0.01"
n1.nodeX = -600; n1.nodeY = 0; n1.color = (0.2, 0.5, 0.8)

# Displacement noise
n2 = parent().create(noiseTOP, 'flow_displace')
n2.par.resolutionw = 1920; n2.par.resolutionh = 1080
n2.par.monochrome = True; n2.par.period = 3.0; n2.par.harmonics = 5
n2.par.t.expr = "absTime.seconds * 0.02"
n2.nodeX = -600; n2.nodeY = -250; n2.color = (0.2, 0.5, 0.8)

# Heavy displacement for fluid look
disp = parent().create(displaceTOP, 'fluid_disp')
disp.par.resolutionw = 1920; disp.par.resolutionh = 1080
disp.par.displaceweight = 0.25
disp.nodeX = -400; disp.nodeY = 0; disp.color = (0.4, 0.3, 0.7)
n1.outputConnectors[0].connect(disp.inputConnectors[0])
n2.outputConnectors[0].connect(disp.inputConnectors[1])

# Second displacement pass
n3 = parent().create(noiseTOP, 'flow_b')
n3.par.resolutionw = 1920; n3.par.resolutionh = 1080
n3.par.monochrome = True; n3.par.period = 2.0; n3.par.harmonics = 3
n3.par.t.expr = "absTime.seconds * 0.04"
n3.nodeX = -400; n3.nodeY = -250; n3.color = (0.4, 0.3, 0.7)

disp2 = parent().create(displaceTOP, 'fluid_disp2')
disp2.par.resolutionw = 1920; disp2.par.resolutionh = 1080
disp2.par.displaceweight = 0.15
disp2.nodeX = -200; disp2.nodeY = 0; disp2.color = (0.6, 0.3, 0.5)
disp.outputConnectors[0].connect(disp2.inputConnectors[0])
n3.outputConnectors[0].connect(disp2.inputConnectors[1])

# Slow color evolution
hsv = parent().create(hsvadjustTOP, 'fluid_color')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 5"
hsv.par.saturationmult = 1.6; hsv.par.valuemult = 1.1
hsv.nodeX = 0; hsv.nodeY = 0; hsv.color = (0.8, 0.5, 0.2)
disp2.outputConnectors[0].connect(hsv.inputConnectors[0])

# Blur for softness
blur = parent().create(blurTOP, 'soft')
blur.par.resolutionw = 1920; blur.par.resolutionh = 1080
blur.par.size = 3
blur.nodeX = 200; blur.nodeY = 0; blur.color = (0.8, 0.5, 0.2)
hsv.outputConnectors[0].connect(blur.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'FLUID OUTPUT'
blur.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: Fluid Flow setup complete!")

# --- Created Nodes ---
# flow_a (noiseTOP), flow_displace (noiseTOP), fluid_disp (displaceTOP)
# flow_b (noiseTOP), fluid_disp2 (displaceTOP), fluid_color (hsvadjustTOP)
# soft (blurTOP), OUT (nullTOP)`,

    glitch: `# FavAI Designer — Glitch / Data Mosh Art
for c in parent().children:
    if c.name != me.name: c.destroy()

# Noise base
noise = parent().create(noiseTOP, 'glitch_src')
noise.par.resolutionw = 1920; noise.par.resolutionh = 1080
noise.par.monochrome = False; noise.par.period = 2.0; noise.par.harmonics = 3
noise.par.t.expr = "absTime.seconds * 0.05"
noise.nodeX = -600; noise.nodeY = 0; noise.color = (0.8, 0.2, 0.3)

# Channel reorder for RGB split
reorder = parent().create(reorderTOP, 'rgb_split')
reorder.par.resolutionw = 1920; reorder.par.resolutionh = 1080
reorder.nodeX = -400; reorder.nodeY = 0; reorder.color = (0.8, 0.2, 0.3)
noise.outputConnectors[0].connect(reorder.inputConnectors[0])

# High-frequency noise for pixel displacement
glitchNoise = parent().create(noiseTOP, 'glitch_noise')
glitchNoise.par.resolutionw = 1920; glitchNoise.par.resolutionh = 1080
glitchNoise.par.monochrome = True; glitchNoise.par.period = 0.3
glitchNoise.par.harmonics = 1; glitchNoise.par.exponent = 3.0
glitchNoise.par.t.expr = "absTime.frame * 0.1"
glitchNoise.nodeX = -400; glitchNoise.nodeY = -250; glitchNoise.color = (0.6, 0.2, 0.5)

# Displace for glitch
disp = parent().create(displaceTOP, 'glitch_disp')
disp.par.resolutionw = 1920; disp.par.resolutionh = 1080
disp.par.displaceweight = 0.08
disp.nodeX = -200; disp.nodeY = 0; disp.color = (0.6, 0.2, 0.5)
reorder.outputConnectors[0].connect(disp.inputConnectors[0])
glitchNoise.outputConnectors[0].connect(disp.inputConnectors[1])

# Transform with hard edges
transform = parent().create(transformTOP, 'scan_lines')
transform.par.resolutionw = 1920; transform.par.resolutionh = 1080
transform.par.ty.expr = "int(absTime.frame / 3) * 0.002"
transform.par.extend = 'repeat'
transform.nodeX = 0; transform.nodeY = 0; transform.color = (0.4, 0.4, 0.6)
disp.outputConnectors[0].connect(transform.inputConnectors[0])

# Level for contrast punch
level = parent().create(levelTOP, 'glitch_level')
level.par.resolutionw = 1920; level.par.resolutionh = 1080
level.par.contrast = 1.8; level.par.gamma1 = 0.7
level.nodeX = 200; level.nodeY = 0; level.color = (0.4, 0.4, 0.6)
transform.outputConnectors[0].connect(level.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'GLITCH OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: Glitch Art setup complete!")

# --- Created Nodes ---
# glitch_src (noiseTOP), rgb_split (reorderTOP), glitch_noise (noiseTOP)
# glitch_disp (displaceTOP), scan_lines (transformTOP)
# glitch_level (levelTOP), OUT (nullTOP)`,

    mapping: `# FavAI Designer — Projection Mapping Base
for c in parent().children:
    if c.name != me.name: c.destroy()

# Content source
noise = parent().create(noiseTOP, 'content')
noise.par.resolutionw = 1920; noise.par.resolutionh = 1080
noise.par.monochrome = False; noise.par.period = 4.0; noise.par.harmonics = 5
noise.par.t.expr = "absTime.seconds * 0.03"
noise.nodeX = -600; noise.nodeY = 0; noise.color = (0.5, 0.3, 0.8)

hsv = parent().create(hsvadjustTOP, 'color')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 10"
hsv.par.saturationmult = 1.5
hsv.nodeX = -400; hsv.nodeY = 0; hsv.color = (0.5, 0.3, 0.8)
noise.outputConnectors[0].connect(hsv.inputConnectors[0])

# Zone A - Left half
cropA = parent().create(cropTOP, 'zone_a')
cropA.par.resolutionw = 960; cropA.par.resolutionh = 1080
cropA.par.cropleft = 0; cropA.par.cropright = 0.5
cropA.nodeX = -200; cropA.nodeY = 100; cropA.color = (0.8, 0.4, 0.2)
cropA.comment = 'Zone A (Left)'
hsv.outputConnectors[0].connect(cropA.inputConnectors[0])

# Zone B - Right half
cropB = parent().create(cropTOP, 'zone_b')
cropB.par.resolutionw = 960; cropB.par.resolutionh = 1080
cropB.par.cropleft = 0.5; cropB.par.cropright = 0
cropB.nodeX = -200; cropB.nodeY = -100; cropB.color = (0.2, 0.4, 0.8)
cropB.comment = 'Zone B (Right)'
hsv.outputConnectors[0].connect(cropB.inputConnectors[0])

# Zone A output with transform for keystone
xformA = parent().create(transformTOP, 'keystone_a')
xformA.par.resolutionw = 960; xformA.par.resolutionh = 1080
xformA.nodeX = 0; xformA.nodeY = 100; xformA.color = (0.8, 0.4, 0.2)
cropA.outputConnectors[0].connect(xformA.inputConnectors[0])

xformB = parent().create(transformTOP, 'keystone_b')
xformB.par.resolutionw = 960; xformB.par.resolutionh = 1080
xformB.nodeX = 0; xformB.nodeY = -100; xformB.color = (0.2, 0.4, 0.8)
cropB.outputConnectors[0].connect(xformB.inputConnectors[0])

# Final composite
comp = parent().create(compositeTOP, 'final_comp')
comp.par.resolutionw = 1920; comp.par.resolutionh = 1080
comp.nodeX = 200; comp.nodeY = 0; comp.color = (0.3, 0.7, 0.3)
xformA.outputConnectors[0].connect(comp.inputConnectors[0])
xformB.outputConnectors[0].connect(comp.inputConnectors[1])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'MAPPING OUTPUT'
comp.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: Projection Mapping setup complete!")

# --- Created Nodes ---
# content (noiseTOP), color (hsvadjustTOP), zone_a (cropTOP)
# zone_b (cropTOP), keystone_a (transformTOP), keystone_b (transformTOP)
# final_comp (compositeTOP), OUT (nullTOP)`,

    ledWall: `# FavAI Designer — LED Wall / Stage Design
for c in parent().children:
    if c.name != me.name: c.destroy()

# Grid pattern
circle = parent().create(circleTOP, 'led_dot')
circle.par.resolutionw = 64; circle.par.resolutionh = 64
circle.nodeX = -600; circle.nodeY = 200; circle.color = (0.8, 0.6, 0.2)

# Content
noise = parent().create(noiseTOP, 'led_content')
noise.par.resolutionw = 1920; noise.par.resolutionh = 1080
noise.par.monochrome = False; noise.par.period = 3.0; noise.par.harmonics = 4
noise.par.t.expr = "absTime.seconds * 0.04"
noise.nodeX = -600; noise.nodeY = 0; noise.color = (0.5, 0.2, 0.8)

# Color palette
hsv = parent().create(hsvadjustTOP, 'palette')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 30"
hsv.par.saturationmult = 2.0
hsv.nodeX = -400; hsv.nodeY = 0; hsv.color = (0.5, 0.2, 0.8)
noise.outputConnectors[0].connect(hsv.inputConnectors[0])

# Pixelate for LED look
res = parent().create(resolutionTOP, 'pixelate')
res.par.resolutionw = 48; res.par.resolutionh = 27
res.par.inputfiltertype = 'nearest'
res.par.outputfiltertype = 'nearest'
res.nodeX = -200; res.nodeY = 0; res.color = (0.7, 0.4, 0.3)
hsv.outputConnectors[0].connect(res.inputConnectors[0])

# Scale back up
resUp = parent().create(resolutionTOP, 'scale_up')
resUp.par.resolutionw = 1920; resUp.par.resolutionh = 1080
resUp.par.inputfiltertype = 'nearest'
resUp.par.outputfiltertype = 'nearest'
resUp.nodeX = 0; resUp.nodeY = 0; resUp.color = (0.7, 0.4, 0.3)
res.outputConnectors[0].connect(resUp.inputConnectors[0])

# Level punch
level = parent().create(levelTOP, 'led_level')
level.par.resolutionw = 1920; level.par.resolutionh = 1080
level.par.contrast = 1.5; level.par.brightness1 = 1.2
level.nodeX = 200; level.nodeY = 0; level.color = (0.3, 0.6, 0.7)
resUp.outputConnectors[0].connect(level.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'LED WALL OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: LED Wall setup complete!")

# --- Created Nodes ---
# led_dot (circleTOP), led_content (noiseTOP), palette (hsvadjustTOP)
# pixelate (resolutionTOP), scale_up (resolutionTOP)
# led_level (levelTOP), OUT (nullTOP)`,

    opticalFlow: `# FavAI Designer — Optical Flow Reactive
for c in parent().children:
    if c.name != me.name: c.destroy()

# Noise field A (current frame)
noiseA = parent().create(noiseTOP, 'field_a')
noiseA.par.resolutionw = 1920; noiseA.par.resolutionh = 1080
noiseA.par.monochrome = False; noiseA.par.period = 4.0; noiseA.par.harmonics = 6
noiseA.par.t.expr = "absTime.seconds * 0.03"
noiseA.nodeX = -600; noiseA.nodeY = 0; noiseA.color = (0.5, 0.3, 0.7)

# Cache (previous frame)
cache = parent().create(cacheTOP, 'prev_frame')
cache.par.resolutionw = 1920; cache.par.resolutionh = 1080
cache.nodeX = -600; cache.nodeY = -250; cache.color = (0.5, 0.3, 0.7)
noiseA.outputConnectors[0].connect(cache.inputConnectors[0])

# Difference = motion
comp = parent().create(compositeTOP, 'motion_diff')
comp.par.resolutionw = 1920; comp.par.resolutionh = 1080
comp.par.operand = 'subtract'
comp.nodeX = -400; comp.nodeY = 0; comp.color = (0.7, 0.4, 0.3)
noiseA.outputConnectors[0].connect(comp.inputConnectors[0])
cache.outputConnectors[0].connect(comp.inputConnectors[1])

# Blur motion
blur = parent().create(blurTOP, 'motion_blur')
blur.par.resolutionw = 1920; blur.par.resolutionh = 1080
blur.par.size = 8
blur.nodeX = -200; blur.nodeY = -250; blur.color = (0.7, 0.4, 0.3)
comp.outputConnectors[0].connect(blur.inputConnectors[0])

# Displace original with motion
disp = parent().create(displaceTOP, 'flow_disp')
disp.par.resolutionw = 1920; disp.par.resolutionh = 1080
disp.par.displaceweight = 0.2
disp.nodeX = -200; disp.nodeY = 0; disp.color = (0.3, 0.6, 0.7)
noiseA.outputConnectors[0].connect(disp.inputConnectors[0])
blur.outputConnectors[0].connect(disp.inputConnectors[1])

# HSV color shift
hsv = parent().create(hsvadjustTOP, 'flow_color')
hsv.par.resolutionw = 1920; hsv.par.resolutionh = 1080
hsv.par.hueoffset.expr = "absTime.seconds * 12"
hsv.par.saturationmult = 1.4
hsv.nodeX = 0; hsv.nodeY = 0; hsv.color = (0.3, 0.6, 0.7)
disp.outputConnectors[0].connect(hsv.inputConnectors[0])

# Level
level = parent().create(levelTOP, 'flow_level')
level.par.resolutionw = 1920; level.par.resolutionh = 1080
level.par.contrast = 1.3; level.par.brightness1 = 1.15
level.nodeX = 200; level.nodeY = 0; level.color = (0.3, 0.6, 0.7)
hsv.outputConnectors[0].connect(level.inputConnectors[0])

null_out = parent().create(nullTOP, 'OUT')
null_out.par.resolutionw = 1920; null_out.par.resolutionh = 1080
null_out.nodeX = 400; null_out.nodeY = 0; null_out.color = (0.2, 0.8, 0.3)
null_out.comment = 'OPTICAL FLOW OUTPUT'
level.outputConnectors[0].connect(null_out.inputConnectors[0])
null_out.viewer = True; null_out.display = True
print("✅ FavAI: Optical Flow setup complete!")

# --- Created Nodes ---
# field_a (noiseTOP), prev_frame (cacheTOP), motion_diff (compositeTOP)
# motion_blur (blurTOP), flow_disp (displaceTOP)
# flow_color (hsvadjustTOP), flow_level (levelTOP), OUT (nullTOP)`

};

module.exports = newTemplates;
