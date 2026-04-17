// Wordly Dictionary Application
// Full localStorage integration for data persistence

class DictionaryApp {
    constructor() {
        // Initialize data stores
        this.favorites = [];
        this.searchHistory = [];
        this.stats = {
            totalSearches: 0,
            uniqueWords: new Set()
        };
        this.currentAudio = null;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadAllData();
                this.init();
            });
        } else {
            this.loadAllData();
            this.init();
        }
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateAllDisplays();
        this.loadTheme();
        console.log('✅ App initialized successfully');
        console.log('📊 Favorites loaded:', this.favorites.length);
        console.log('🕒 History loaded:', this.searchHistory.length);
    }

    cacheElements() {
        this.searchBtn = document.getElementById('searchBtn');
        this.wordInput = document.getElementById('wordInput');
        this.languageSelect = document.getElementById('languageSelect');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsContent = document.getElementById('resultsContent');
        this.favoritesList = document.getElementById('favoritesList');
        this.searchHistoryList = document.getElementById('searchHistoryList');
        this.historyContainer = document.getElementById('historyContainer');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearAllFavBtn = document.getElementById('clearAllFav');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.clearStorageBtn = document.getElementById('clearStorageBtn');
        this.totalSearchesElem = document.getElementById('totalSearches');
        this.totalFavoritesElem = document.getElementById('totalFavorites');
        this.uniqueWordsElem = document.getElementById('uniqueWords');
    }

    bindEvents() {
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.searchWord());
        }
        if (this.wordInput) {
            this.wordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchWord();
            });
        }
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        if (this.clearAllFavBtn) {
            this.clearAllFavBtn.addEventListener('click', () => this.clearAllFavorites());
        }
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => this.clearSearchHistory());
        }
        if (this.clearStorageBtn) {
            this.clearStorageBtn.addEventListener('click', () => this.clearAllStorage());
        }
    }

    // ========== LOCALSTORAGE METHODS ==========
    
    loadAllData() {
        try {
            // Load favorites
            const savedFavorites = localStorage.getItem('wordly_favorites');
            this.favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
            
            // Load search history
            const savedHistory = localStorage.getItem('wordly_history');
            this.searchHistory = savedHistory ? JSON.parse(savedHistory) : [];
            
            // Load stats
            const savedStats = localStorage.getItem('wordly_stats');
            if (savedStats) {
                const statsData = JSON.parse(savedStats);
                this.stats.totalSearches = statsData.totalSearches || 0;
                this.stats.uniqueWords = new Set(statsData.uniqueWords || []);
            } else {
                this.stats.totalSearches = 0;
                this.stats.uniqueWords = new Set();
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.favorites = [];
            this.searchHistory = [];
            this.stats = { totalSearches: 0, uniqueWords: new Set() };
        }
    }
    
    saveFavorites() {
        localStorage.setItem('wordly_favorites', JSON.stringify(this.favorites));
        if (this.totalFavoritesElem) {
            this.totalFavoritesElem.textContent = this.favorites.length;
        }
    }
    
    saveSearchHistory() {
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }
        localStorage.setItem('wordly_history', JSON.stringify(this.searchHistory));
        
        if (this.historyContainer) {
            this.historyContainer.style.display = this.searchHistory.length > 0 ? 'block' : 'none';
        }
    }
    
    saveStats() {
        const statsToSave = {
            totalSearches: this.stats.totalSearches,
            uniqueWords: Array.from(this.stats.uniqueWords)
        };
        localStorage.setItem('wordly_stats', JSON.stringify(statsToSave));
        this.updateStatsDisplay();
    }
    
    updateAllDisplays() {
        this.updateFavoritesList();
        this.updateSearchHistoryList();
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        if (this.totalSearchesElem) {
            this.totalSearchesElem.textContent = this.stats.totalSearches;
        }
        if (this.totalFavoritesElem) {
            this.totalFavoritesElem.textContent = this.favorites.length;
        }
        if (this.uniqueWordsElem) {
            this.uniqueWordsElem.textContent = this.stats.uniqueWords.size;
        }
    }
    
    addToSearchHistory(word) {
        const timestamp = new Date().toISOString();
        const historyItem = { 
            word: word, 
            timestamp: timestamp, 
            language: this.languageSelect ? this.languageSelect.value : 'en_US'
        };
        
        this.searchHistory = this.searchHistory.filter(item => item.word !== word);
        this.searchHistory.unshift(historyItem);
        
        this.stats.totalSearches++;
        this.stats.uniqueWords.add(word);
        
        this.saveSearchHistory();
        this.saveStats();
        this.updateSearchHistoryList();
    }
    
    updateSearchHistoryList() {
        if (!this.searchHistoryList) return;
        
        if (this.searchHistory.length === 0) {
            this.searchHistoryList.innerHTML = '<li class="empty-message">No search history yet</li>';
            if (this.historyContainer) {
                this.historyContainer.style.display = 'none';
            }
            return;
        }
        
        if (this.historyContainer) {
            this.historyContainer.style.display = 'block';
        }
        
        this.searchHistoryList.innerHTML = this.searchHistory.map(item => `
            <li onclick="dictionaryApp.searchHistoryWord('${this.escapeHtml(item.word)}')">
                ${this.escapeHtml(item.word)}
                <span style="font-size: 0.7rem; opacity: 0.7;">(${new Date(item.timestamp).toLocaleDateString()})</span>
            </li>
        `).join('');
    }
    
    clearSearchHistory() {
        if (this.searchHistory.length === 0) {
            this.showMessage('No search history to clear', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all search history?')) {
            this.searchHistory = [];
            this.saveSearchHistory();
            this.updateSearchHistoryList();
            this.showMessage('Search history cleared', 'success');
        }
    }
    
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
    
    clearAllStorage() {
        if (confirm('⚠️ WARNING: This will clear ALL your data including favorites, search history, and statistics. This cannot be undone. Are you sure?')) {
            localStorage.removeItem('wordly_favorites');
            localStorage.removeItem('wordly_history');
            localStorage.removeItem('wordly_stats');
            localStorage.removeItem('wordly_theme');
            
            this.favorites = [];
            this.searchHistory = [];
            this.stats.totalSearches = 0;
            this.stats.uniqueWords = new Set();
            
            this.updateAllDisplays();
            this.showMessage('All data cleared successfully', 'success');
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
    }
    
    // ========== THEME METHODS ==========
    
    loadTheme() {
        const savedTheme = localStorage.getItem('wordly_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('wordly_theme', isDark ? 'dark' : 'light');
        this.showMessage(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    }
    
    // ========== AUDIO METHODS ==========
    
    speakWord(word, language = 'en-US') {
        if ('speechSynthesis' in window) {
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
    
    playAudio(audioUrl, word) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        if (audioUrl && audioUrl !== '') {
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.play().catch(error => {
                console.error('Audio playback failed:', error);
                this.speakWord(word);
            });
            this.showMessage('🔊 Playing pronunciation audio...', 'info');
        } else {
            this.speakWord(word);
        }
    }
    
    // ========== DICTIONARY API METHODS ==========
    
    showLoading(show) {
        if (!this.searchBtn) return;
        
        if (show) {
            this.searchBtn.innerHTML = '<span class="loading"></span> Searching...';
            this.searchBtn.disabled = true;
        } else {
            this.searchBtn.innerHTML = '🔍 Search Word';
            this.searchBtn.disabled = false;
        }
    }
    
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = message;
        
        if (this.resultsContainer) {
            const existingMsg = this.resultsContainer.querySelector('.message');
            if (existingMsg) existingMsg.remove();
            this.resultsContainer.insertBefore(messageDiv, this.resultsContainer.firstChild);
            this.resultsContainer.style.display = 'block';
        }
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 4000);
    }
    
    async searchWord() {
        if (!this.wordInput) return;
        
        const word = this.wordInput.value.trim();
        const language = this.languageSelect ? this.languageSelect.value : 'en_US';
        
        if (!word) {
            this.showMessage('Please enter a word to search', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
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
            this.addToSearchHistory(word);
            this.showMessage(`✅ Found definition for "${word}"`, 'success');
            
            if (this.resultsContainer) {
                this.resultsContainer.style.display = 'block';
                this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            if (this.resultsContainer) {
                this.resultsContainer.style.display = 'block';
            }
            if (this.resultsContent) {
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
            }
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async searchHistoryWord(word) {
        if (this.wordInput) {
            this.wordInput.value = word;
        }
        await this.searchWord();
    }
    
    displayResults(data, searchWord) {
        if (!this.resultsContent) return;
        
        const wordData = data[0];
        const word = wordData.word;
        const phonetic = wordData.phonetic || (wordData.phonetics && wordData.phonetics.find(p => p.text) ? wordData.phonetics.find(p => p.text).text : '') || '';
        
        // FIXED: Correct optional chaining syntax for audio URL
        let audioUrl = null;
        if (wordData.phonetics && wordData.phonetics.length > 0) {
            const audioObj = wordData.phonetics.find(p => p.audio && p.audio !== '');
            if (audioObj) {
                audioUrl = audioObj.audio;
            }
        }
        
        const languageMap = {
            'en_US': 'en-US', 'en_GB': 'en-GB', 'es': 'es-ES', 'fr': 'fr-FR',
            'de': 'de-DE', 'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU',
            'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR', 'ar': 'ar-SA'
        };
        const currentLang = this.languageSelect ? this.languageSelect.value : 'en_US';
        const speechLang = languageMap[currentLang] || 'en-US';
        
        let html = `
            <div class="word-header">
                <div>
                    <div class="word-title" ondblclick="dictionaryApp.speakWord('${this.escapeHtml(word)}', '${speechLang}')">
                        📖 ${this.escapeHtml(word)}
                    </div>
                    ${phonetic ? `<div class="phonetic">/${this.escapeHtml(phonetic)}/</div>` : ''}
                </div>
                <div>
                    <button class="audio-btn" onclick="dictionaryApp.playAudio('${this.escapeHtml(audioUrl || '')}', '${this.escapeHtml(word)}')">
                        🔊 Listen to Pronunciation
                    </button>
                </div>
            </div>
            <button class="favorite-btn" onclick="dictionaryApp.addToFavorites('${this.escapeHtml(word)}')">
                ⭐ Add "${this.escapeHtml(word)}" to Favorites
            </button>
            <div style="margin-top: 1.5rem;">
        `;
        
        // Display all meanings
        if (wordData.meanings && wordData.meanings.length > 0) {
            wordData.meanings.forEach((meaning) => {
                html += `
                    <div class="definition-card">
                        <div class="part-of-speech">📌 ${this.escapeHtml(meaning.partOfSpeech)}</div>
                        <ul class="definition-list">
                `;
                
                if (meaning.definitions && meaning.definitions.length > 0) {
                    meaning.definitions.slice(0, 3).forEach(def => {
                        html += `<li><strong>Definition:</strong> ${this.escapeHtml(def.definition)}</li>`;
                        if (def.example) {
                            html += `<div class="example">💡 Example: "${this.escapeHtml(def.example)}"</div>`;
                        }
                    });
                }
                
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
        } else {
            html += `<p>No definitions found.</p>`;
        }
        
        html += `
            <p style="font-size: 12px; color: #888; margin-top: 15px;">
                💡 Tip: Double-click the word to hear it spoken! | Data provided by Free Dictionary API
            </p>
        </div>`;
        
        this.resultsContent.innerHTML = html;
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
        if (this.wordInput) {
            this.wordInput.value = word;
        }
        await this.searchWord();
    }
    
    // Escape HTML to prevent XSS attacks
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when page loads
let dictionaryApp;
document.addEventListener('DOMContentLoaded', () => {
    dictionaryApp = new DictionaryApp();
    console.log('🎉 Dictionary App Ready!');
});