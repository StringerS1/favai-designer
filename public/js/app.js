/* ============================================
   FavAI Designer — Frontend Application Logic
   ============================================ */

class FavAIDesigner {
    constructor() {
        this.selectedCategory = 'all';
        this.history = this.loadHistory();
        this.currentScript = '';

        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.checkApiStatus();
        this.checkTdStatus();
        this.renderHistory();
        // Poll TD status every 3 seconds
        setInterval(() => this.checkTdStatus(), 3000);
    }

    bindElements() {
        // Prompt
        this.promptInput = document.getElementById('promptInput');
        this.charCount = document.getElementById('charCount');
        this.generateBtn = document.getElementById('generateBtn');

        // Output
        this.outputSection = document.getElementById('outputSection');
        this.codeOutput = document.getElementById('codeOutput');
        this.lineNumbers = document.getElementById('lineNumbers');
        this.outputSource = document.getElementById('outputSource');
        this.outputStats = document.getElementById('outputStats');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.sendToTdBtn = document.getElementById('sendToTdBtn');

        // TD Status
        this.tdStatus = document.getElementById('tdStatus');
        this.tdStatusText = document.getElementById('tdStatusText');

        // Loading
        this.loadingSection = document.getElementById('loadingSection');

        // Settings
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeSettings = document.getElementById('closeSettings');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.modelSelect = document.getElementById('modelSelect');

        // History
        this.historySidebar = document.getElementById('historySidebar');
        this.historyBtn = document.getElementById('historyBtn');
        this.closeHistory = document.getElementById('closeHistory');
        this.historyList = document.getElementById('historyList');

        // Status
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = this.statusIndicator.querySelector('.status-text');

        // Toast
        this.toastContainer = document.getElementById('toastContainer');
    }

    bindEvents() {
        // Prompt input
        this.promptInput.addEventListener('input', () => {
            this.charCount.textContent = this.promptInput.value.length;
        });

        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.generate();
            }
        });

        // Generate button
        this.generateBtn.addEventListener('click', () => this.generate());

        // Category pills
        document.querySelectorAll('.pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.selectedCategory = pill.dataset.category;
            });
        });

        // Quick prompts
        document.querySelectorAll('.quick-prompt').forEach(qp => {
            qp.addEventListener('click', () => {
                this.promptInput.value = qp.dataset.prompt;
                this.charCount.textContent = qp.dataset.prompt.length;
                this.promptInput.focus();
            });
        });

        this.copyBtn.addEventListener('click', () => this.copyScript());
        this.downloadBtn.addEventListener('click', () => this.downloadScript());
        this.sendToTdBtn.addEventListener('click', () => this.sendToTd());

        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettingsModal();
        });
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());

        this.toggleKeyVisibility.addEventListener('click', () => {
            const input = this.apiKeyInput;
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // History
        this.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.closeHistory.addEventListener('click', () => this.toggleHistory(false));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettingsModal();
                this.toggleHistory(false);
            }
        });

        // Load saved API key
        const savedKey = localStorage.getItem('favai_api_key');
        if (savedKey) {
            this.apiKeyInput.value = savedKey;
        }

        const savedModel = localStorage.getItem('favai_model');
        if (savedModel) {
            this.modelSelect.value = savedModel;
        }
    }

    async checkApiStatus() {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();

            if (data.hasApiKey) {
                this.statusIndicator.className = 'status-indicator connected';
                this.statusText.textContent = 'AI Connected';
            } else {
                this.statusIndicator.className = 'status-indicator template';
                this.statusText.textContent = 'Template Mode';
            }
        } catch {
            this.statusIndicator.className = 'status-indicator disconnected';
            this.statusText.textContent = 'Offline';
        }
    }

    async generate() {
        const prompt = this.promptInput.value.trim();
        if (!prompt) {
            this.showToast('Please enter a prompt describing your visual', 'error');
            this.promptInput.focus();
            return;
        }

        // Show loading
        this.generateBtn.disabled = true;
        this.loadingSection.classList.add('visible');
        this.outputSection.classList.remove('visible');

        const startTime = Date.now();

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    category: this.selectedCategory !== 'all' ? this.selectedCategory : undefined
                })
            });

            const data = await res.json();

            if (res.ok && data.script) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                this.displayScript(data.script, data.source, elapsed, data.tokens);

                // Save to history
                this.addToHistory({
                    prompt,
                    script: data.script,
                    source: data.source,
                    category: this.selectedCategory,
                    timestamp: new Date().toISOString()
                });

                this.showToast('Script generated successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to generate script');
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.showToast(error.message || 'Failed to generate script', 'error');
        } finally {
            this.generateBtn.disabled = false;
            this.loadingSection.classList.remove('visible');
        }
    }

    displayScript(script, source, elapsed, tokens) {
        this.currentScript = script;

        // Syntax highlighting
        const highlighted = this.highlightSyntax(script);
        this.codeOutput.innerHTML = highlighted;

        // Line numbers
        const lines = script.split('\n');
        this.lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');

        // Source info
        const sourceLabel = source === 'ai' ? '🤖 Generated by AI' : '📦 Generated from Templates';
        this.outputSource.textContent = sourceLabel;

        // Stats
        const stats = [`${lines.length} lines`, `${elapsed}s`];
        if (tokens) stats.push(`${tokens} tokens`);
        this.outputStats.textContent = stats.join(' • ');

        // Show output
        this.outputSection.classList.add('visible');

        // Scroll to output
        setTimeout(() => {
            this.outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    highlightSyntax(code) {
        const keywords = new Set(['import', 'from', 'for', 'in', 'if', 'else', 'elif', 'while', 'def', 'class', 'return', 'True', 'False', 'None', 'and', 'or', 'not', 'is', 'try', 'except', 'finally', 'with', 'as', 'break', 'continue', 'pass', 'lambda', 'yield']);
        const builtins = new Set(['print', 'range', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'op', 'parent', 'me', 'absTime']);

        const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return code.split('\n').map(line => {
            // Check if line is a comment
            const stripped = line.trimStart();
            if (stripped.startsWith('#')) {
                const indent = escHtml(line.slice(0, line.length - stripped.length));
                return indent + '<span class="comment">' + escHtml(stripped) + '</span>';
            }

            // Tokenize the line: split into strings and non-string parts
            const tokens = [];
            let remaining = line;
            // Match strings: triple-quoted, double-quoted, single-quoted
            const strRegex = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/;

            while (remaining.length > 0) {
                const match = remaining.match(strRegex);
                if (match) {
                    const idx = match.index;
                    if (idx > 0) {
                        tokens.push({ type: 'code', text: remaining.slice(0, idx) });
                    }
                    tokens.push({ type: 'string', text: match[0] });
                    remaining = remaining.slice(idx + match[0].length);
                } else {
                    tokens.push({ type: 'code', text: remaining });
                    remaining = '';
                }
            }

            // Process each token
            return tokens.map(token => {
                if (token.type === 'string') {
                    return '<span class="string">' + escHtml(token.text) + '</span>';
                }
                // For code tokens, highlight keywords, builtins, and numbers
                return escHtml(token.text).replace(/\b([a-zA-Z_]\w*)\b/g, (m, word) => {
                    if (keywords.has(word)) return '<span class="keyword">' + word + '</span>';
                    if (builtins.has(word)) return '<span class="builtin">' + word + '</span>';
                    return word;
                }).replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
            }).join('');
        }).join('\n');
    }

    async copyScript() {
        if (!this.currentScript) return;

        try {
            await navigator.clipboard.writeText(this.currentScript);
            this.copyBtn.classList.add('copied');
            this.copyBtn.querySelector('span').textContent = 'Copied!';
            this.showToast('Script copied to clipboard!', 'success');

            setTimeout(() => {
                this.copyBtn.classList.remove('copied');
                this.copyBtn.querySelector('span').textContent = 'Copy';
            }, 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = this.currentScript;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('Script copied to clipboard!', 'success');
        }
    }

    downloadScript() {
        if (!this.currentScript) return;

        const blob = new Blob([this.currentScript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `favai_designer_${Date.now()}.py`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Script downloaded!', 'success');
    }

    // TouchDesigner Bridge
    async checkTdStatus() {
        try {
            const res = await fetch('/api/td-status');
            const data = await res.json();
            if (data.connected) {
                this.tdStatus.classList.add('connected');
                this.tdStatusText.textContent = `TD Connected (${data.clients})`;
                this.sendToTdBtn.disabled = false;
            } else {
                this.tdStatus.classList.remove('connected');
                this.tdStatusText.textContent = 'TD Offline';
                this.sendToTdBtn.disabled = true;
            }
        } catch {
            this.tdStatus.classList.remove('connected');
            this.tdStatusText.textContent = 'TD Offline';
            this.sendToTdBtn.disabled = true;
        }
    }

    async sendToTd() {
        if (!this.currentScript) return;
        try {
            const res = await fetch('/api/send-to-td', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: this.currentScript })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(`Script sent to ${data.clients} TouchDesigner instance(s)!`, 'success');
            } else {
                this.showToast(data.error || 'Failed to send to TD', 'error');
            }
        } catch {
            this.showToast('No TouchDesigner connected. Run the bridge script in TD first.', 'error');
        }
    }

    // Settings
    openSettings() {
        this.settingsModal.classList.add('visible');
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('visible');
    }

    async saveSettings() {
        const apiKey = this.apiKeyInput.value.trim();
        const model = this.modelSelect.value;

        // Save locally
        if (apiKey) {
            localStorage.setItem('favai_api_key', apiKey);
        }
        localStorage.setItem('favai_model', model);

        // Send to server
        if (apiKey) {
            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ openaiKey: apiKey })
                });
            } catch (e) {
                console.error('Failed to update server settings:', e);
            }
        }

        this.closeSettingsModal();
        this.checkApiStatus();
        this.showToast('Settings saved successfully!', 'success');
    }

    // History
    toggleHistory(force) {
        const visible = force !== undefined ? force : !this.historySidebar.classList.contains('visible');
        this.historySidebar.classList.toggle('visible', visible);
    }

    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('favai_history') || '[]');
        } catch {
            return [];
        }
    }

    saveHistoryToStorage() {
        localStorage.setItem('favai_history', JSON.stringify(this.history.slice(0, 50))); // Keep last 50
    }

    addToHistory(entry) {
        this.history.unshift(entry);
        this.saveHistoryToStorage();
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <p>No scripts generated yet</p>
        </div>
      `;
            return;
        }

        this.historyList.innerHTML = this.history.map((item, index) => {
            const time = new Date(item.timestamp);
            const timeStr = time.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

            return `
        <div class="history-item" data-index="${index}">
          <div class="history-item-prompt">${this.escapeHtml(item.prompt)}</div>
          <div class="history-item-meta">
            <span class="history-item-badge ${item.source}">${item.source === 'ai' ? 'AI' : 'Template'}</span>
            <span>${timeStr}</span>
          </div>
        </div>
      `;
        }).join('');

        // Bind click events
        this.historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                const item = this.history[index];
                if (item) {
                    this.promptInput.value = item.prompt;
                    this.charCount.textContent = item.prompt.length;
                    this.displayScript(item.script, item.source, '—', null);
                    this.toggleHistory(false);
                }
            });
        });
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const icons = {
            success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.favai = new FavAIDesigner();
});
