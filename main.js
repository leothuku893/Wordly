// Web Dictionary Application
// With Audio Pronunciation and Favorites System

class DictionaryApp {
    constructor() {
        this.favorites = this.loadFavorites();
        this.currentAudio = null;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateFavoritesList();
        this.loadTheme();
    }

    cacheElements() {
        this.searchBtn = document.getElementById('searchBtn');
        this.wordInput = document.getElementById('wordInput');
        this.languageSelect = document.getElementById('languageSelect');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsContent = document.getElementById('resultsContent');
        this.favoritesList = document.getElementById('favoritesList');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearAllBtn = document.getElementById('clearAllFav');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchWord());
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWord();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.clearAllFavorites());
        }
    }

    // Load favorites from localStorage
    loadFavorites() {
        const saved = localStorage.getItem('wordlyFavorites');
        return saved ? JSON.parse(saved) : [];
    }

    // Save favorites to localStorage
    saveFavorites() {
        localStorage.setItem('wordlyFavorites', JSON.stringify(this.favorites));
    }

    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('wordlyTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    // Toggle dark/light mode
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('wordlyTheme', isDark ? 'dark' : 'light');
        this.showMessage(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    }

    // Show loading state
    showLoading(show) {
        if (show) {
            this.searchBtn.innerHTML = '<span class="loading"></span> Searching...';
            this.searchBtn.disabled = true;
        } else {
            this.searchBtn.innerHTML = '🔍 Search Word';
            this.searchBtn.disabled = false;
        }
    }

    // Show message to user
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = message;

        // Insert message at the top of results container
        if (this.resultsContainer) {
            const existingMsg = this.resultsContainer.querySelector('.message');
            if (existingMsg) existingMsg.remove();
            this.resultsContainer.insertBefore(messageDiv, this.resultsContainer.firstChild);
            this.resultsContainer.style.display = 'block';
        }

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 4000);
    }

    // Speak word using Web Speech API
    speakWord(word, language = 'en-US') {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = language;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            utterance.onstart = () => {
                this.showMessage(`🔊 Speaking: "${word}"`, 'info');
            };

            utterance.onerror = () => {
                this.showMessage('⚠️ Unable to speak the word', 'error');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            this.showMessage('⚠️ Your browser does not support speech synthesis', 'error');
        }
    }

    // Play audio from URL
    playAudio(audioUrl, word) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        if (audioUrl) {
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.play().catch(error => {
                console.error('Audio playback failed:', error);
                // Fallback to speech synthesis
                this.speakWord(word);
            });
            this.showMessage('🔊 Playing pronunciation audio...', 'info');
        } else {
            // Fallback to speech synthesis
            this.speakWord(word);
        }
    }

    // Search for word definition
    async searchWord() {
        const word = this.wordInput.value.trim();
        const language = this.languageSelect.value;

        if (!word) {
            this.showMessage('Please enter a word to search', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Using Free Dictionary API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(word)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`"${word}" not found. Please check spelling or try another word.`);
                } else {
                    throw new Error('Unable to fetch definition. Please try again later.');
                }
            }

            const data = await response.json();
            this.displayResults(data, word);
            this.showMessage(`✅ Found definition for "${word}"`, 'success');
            this.resultsContainer.style.display = 'block';
            
            // Scroll to results
            this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            this.resultsContainer.style.display = 'block';
            this.resultsContent.innerHTML = `
                <div class="message error">
                    <strong>❌ ${error.message}</strong><br>
                    Suggestions: 
                    <ul style="margin-top: 10px; margin-left: 20px;">
                        <li>Check the spelling of the word</li>
                        <li>Try a different word</li>
                        <li>Select another language</li>
                        <li>Make sure you're connected to the internet</li>
                    </ul>
                </div>
            `;
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Display search results
    displayResults(data, searchWord) {
        const wordData = data[0];
        const word = wordData.word;
        const phonetic = wordData.phonetic || wordData.phonetics?.find(p => p.text)?.text || '';
        const audioUrl = wordData.phonetics?.find(p => p.audio)?.audio || null;
        
        // Get language code for speech
        const languageMap = {
            'en_US': 'en-US',
            'en_GB': 'en-GB',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'ru': 'ru-RU',
            'zh': 'zh-CN',
            'ja': 'ja-JP'
        };
        const speechLang = languageMap[this.languageSelect.value] || 'en-US';

        let html = `
            <div class="word-header">
                <div>
                    <div class="word-title" ondblclick="dictionaryApp.speakWord('${word.replace(/'/g, "\\'")}', '${speechLang}')">
                        📖 ${word}
                    </div>
                    ${phonetic ? `<div class="phonetic">/${phonetic}/</div>` : ''}
                </div>
                <div>
                    <button class="audio-btn" onclick="dictionaryApp.playAudio('${audioUrl || ''}', '${word.replace(/'/g, "\\'")}')">
                        🔊 Listen to Pronunciation
                    </button>
                </div>
            </div>
            <button class="favorite-btn" onclick="dictionaryApp.addToFavorites('${word.replace(/'/g, "\\'")}')">
                ⭐ Add "${word}" to Favorites
            </button>
            <div style="margin-top: 1.5rem;">
        `;

        // Display all meanings
        wordData.meanings.forEach((meaning) => {
            html += `
                <div class="definition-card">
                    <div class="part-of-speech">📌 ${meaning.partOfSpeech}</div>
                    <ul class="definition-list">
            `;

            meaning.definitions.slice(0, 3).forEach(def => {
                html += `<li><strong>Definition:</strong> ${this.escapeHtml(def.definition)}</li>`;
                if (def.example) {
                    html += `<div class="example">💡 Example: "${this.escapeHtml(def.example)}"</div>`;
                }
            });

            if (meaning.synonyms && meaning.synonyms.length > 0) {
                const synonyms = meaning.synonyms.slice(0, 5).join(', ');
                html += `<li><strong>Synonyms:</strong> ${this.escapeHtml(synonyms)}</li>`;
            }

            if (meaning.antonyms && meaning.antonyms.length > 0) {
                const antonyms = meaning.antonyms.slice(0, 3).join(', ');
                html += `<li><strong>Antonyms:</strong> ${this.escapeHtml(antonyms)}</li>`;
            }

            html += `</ul></div>`;
        });

        html += `
            <p style="font-size: 12px; color: #888; margin-top: 15px;">
                💡 Tip: Double-click the word to hear it spoken! | Data provided by Free Dictionary API
            </p>
        </div>`;

        this.resultsContent.innerHTML = html;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add word to favorites
    addToFavorites(word) {
        if (!this.favorites.includes(word)) {
            this.favorites.push(word);
            this.saveFavorites();
            this.updateFavoritesList();
            this.showMessage(`⭐ "${word}" added to favorites!`, 'success');
        } else {
            this.showMessage(`"${word}" is already in your favorites!`, 'info');
        }
    }

    // Remove word from favorites
    removeFromFavorites(word) {
        this.favorites = this.favorites.filter(fav => fav !== word);
        this.saveFavorites();
        this.updateFavoritesList();
        this.showMessage(`🗑️ "${word}" removed from favorites`, 'info');
    }

    // Clear all favorites
    clearAllFavorites() {
        if (this.favorites.length === 0) {
            this.showMessage('No favorites to clear', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all favorites?')) {
            this.favorites = [];
            this.saveFavorites();
            this.updateFavoritesList();
            this.showMessage('All favorites cleared', 'success');
        }
    }

    // Update favorites list display
    updateFavoritesList() {
        if (!this.favoritesList) return;

        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = '<li class="empty-message">No favorites yet. Search for words and click the ★ button to add!</li>';
            return;
        }

        this.favoritesList.innerHTML = this.favorites.map(word => `
            <li onclick="dictionaryApp.searchFavoriteWord('${this.escapeHtml(word)}')">
                📖 ${this.escapeHtml(word)}
                <button class="remove-fav" onclick="event.stopPropagation(); dictionaryApp.removeFromFavorites('${this.escapeHtml(word)}')">✖</button>
            </li>
        `).join('');
    }

    // Search favorite word when clicked
    async searchFavoriteWord(word) {
        this.wordInput.value = word;
        await this.searchWord();
    }
}

// Initialize the application
const dictionaryApp = new DictionaryApp();