# ============================================
# FavAI Designer — TouchDesigner WebSocket Bridge
# ============================================
# HOW TO USE:
# 1. Create a "Text DAT" in TouchDesigner
# 2. Paste this entire script into it
# 3. Right-click the Text DAT > Run Script
# 4. The bridge will connect to FavAI Designer
# 5. Now you can click "Send to TD" in your browser!
# ============================================

import json

FAVAI_HOST = 'localhost'
FAVAI_PORT = 3000
FAVAI_PATH = '/ws'

def setup_bridge():
    """Create WebSocket DAT and callback DAT for FavAI bridge"""

    # Clean up existing bridge ops
    for name in ['favai_ws', 'favai_callback', 'favai_status']:
        existing = parent().op(name)
        if existing:
            existing.destroy()

    # --- WebSocket DAT ---
    ws = parent().create(webSocketDAT, 'favai_ws')
    ws.nodeX = 0
    ws.nodeY = 0
    ws.color = (0.5, 0.2, 0.8)
    ws.comment = 'FavAI Designer Bridge'
    ws.par.address = FAVAI_HOST
    ws.par.port = FAVAI_PORT
    ws.par.path = FAVAI_PATH
    ws.par.active = True

    # --- Callback Text DAT ---
    callback = parent().create(textDAT, 'favai_callback')
    callback.nodeX = 200
    callback.nodeY = 0
    callback.color = (0.2, 0.8, 0.5)
    callback.comment = 'Script Executor'
    callback.text = '''# FavAI Bridge Callback
# This DAT receives and executes scripts from FavAI Designer

def onReceiveText(dat, rowIndex, message):
    try:
        data = json.loads(message)
        if data.get('type') == 'execute':
            script = data.get('script', '')
            if script:
                print('[FavAI] Executing received script...')
                exec(script)
                # Send success back
                op('favai_ws').sendText(json.dumps({
                    'type': 'status',
                    'status': 'success',
                    'message': 'Script executed successfully'
                }))
                print('[FavAI] Script executed successfully!')
        elif data.get('type') == 'ping':
            op('favai_ws').sendText(json.dumps({
                'type': 'pong',
                'td_version': app.version,
                'project': project.name
            }))
    except Exception as e:
        print(f'[FavAI] Error: {e}')
        op('favai_ws').sendText(json.dumps({
            'type': 'status',
            'status': 'error',
            'message': str(e)
        }))

def onConnect(dat):
    print('[FavAI] Connected to FavAI Designer!')
    dat.sendText(json.dumps({
        'type': 'td_info',
        'td_version': app.version,
        'project': project.name
    }))

def onDisconnect(dat):
    print('[FavAI] Disconnected from FavAI Designer')
'''

    # Set the callback DAT on the WebSocket
    ws.par.callbacks = callback.path

    # --- Status Text DAT ---
    status = parent().create(textTOP, 'favai_status')
    status.nodeX = 400
    status.nodeY = 0
    status.par.resolutionw = 500
    status.par.resolutionh = 100
    status.par.text = 'FavAI Bridge Active'
    status.par.fontsizex = 24
    status.par.fontcolorr = 0.5
    status.par.fontcolorg = 1.0
    status.par.fontcolorb = 0.5
    status.par.bgcolorr = 0.05
    status.par.bgcolorg = 0.05
    status.par.bgcolorb = 0.1
    status.color = (0.2, 0.8, 0.5)
    status.comment = 'Bridge Status Display'
    status.viewer = True

    print('=' * 50)
    print('  FavAI Designer Bridge Setup Complete!')
    print(f'  Connecting to ws://{FAVAI_HOST}:{FAVAI_PORT}{FAVAI_PATH}')
    print('  You can now send scripts from your browser.')
    print('=' * 50)

# Run setup
setup_bridge()
