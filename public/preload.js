const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  database: {
    query: (type, sql, params) => ipcRenderer.invoke('db-query', { type, sql, params }),
    all: (sql, params) => ipcRenderer.invoke('db-query', { type: 'all', sql, params }),
    get: (sql, params) => ipcRenderer.invoke('db-query', { type: 'get', sql, params }),
    run: (sql, params) => ipcRenderer.invoke('db-query', { type: 'run', sql, params })
  },

  // Dialog operations
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog-open-file'),
    saveFile: (options) => ipcRenderer.invoke('dialog-save-file', options)
  },

  // File system operations
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs-read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('fs-write-file', { filePath, data }),
    getAppPath: (type) => ipcRenderer.invoke('get-app-path', type),
    getFileStats: (filePath) => ipcRenderer.invoke('fs-get-file-stats', filePath),
    joinPath: (...pathSegments) => ipcRenderer.invoke('fs-join-path', ...pathSegments),
    deleteFile: (filePath) => ipcRenderer.invoke('fs-delete-file', filePath)
  },

  // Service operations
  services: {
    testConnection: (url, service) => ipcRenderer.invoke('test-service-connection', { url, service }),
    getOllamaModels: (url) => ipcRenderer.invoke('get-ollama-models', { url }),
    getModelInfo: (options) => ipcRenderer.invoke('get-model-info', options),
    chatWithOllama: (data) => ipcRenderer.invoke('chat-with-ollama', data),
    validateTranscript: (text) => ipcRenderer.invoke('validate-transcript', { text })
  },

  // Vector store operations (delegated to main process)
  vectorStore: {
    initialize: (dbPath) => ipcRenderer.invoke('vector-store-initialize', dbPath),
    storeChunks: (chunks, embeddings) => ipcRenderer.invoke('vector-store-store-chunks', { chunks, embeddings }),
    searchSimilar: (queryEmbedding, options) => ipcRenderer.invoke('vector-store-search-similar', { queryEmbedding, options }),
    deleteTranscriptChunks: (transcriptId) => ipcRenderer.invoke('vector-store-delete-transcript-chunks', transcriptId),
    getTranscriptChunks: (transcriptId) => ipcRenderer.invoke('vector-store-get-transcript-chunks', transcriptId),
    updateChunks: (chunks, embeddings) => ipcRenderer.invoke('vector-store-update-chunks', { chunks, embeddings }),
    getStats: () => ipcRenderer.invoke('vector-store-get-stats'),
    close: () => ipcRenderer.invoke('vector-store-close'),
    reset: () => ipcRenderer.invoke('vector-store-reset')
  },

  // Embedding operations (delegated to main process)
  embedding: {
    initialize: () => ipcRenderer.invoke('embedding-initialize'),
    embedText: (text, metadata) => ipcRenderer.invoke('embedding-embed-text', { text, metadata }),
    embedBatch: (texts, metadata) => ipcRenderer.invoke('embedding-embed-batch', { texts, metadata }),
    updateConfig: (config) => ipcRenderer.invoke('embedding-update-config', config)
  },

  // Navigation events
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, page) => callback(page));
  },

  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },

  // Remove all listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Audio extraction
  audio: {
    extractAudio: (inputPath, outputPath) => 
      ipcRenderer.invoke('extract-audio', { inputPath, outputPath }),
    getMediaInfo: (filePath) => 
      ipcRenderer.invoke('get-media-info', { filePath }),
    transcribeAudio: (audioPath, sttUrl, sttModel) =>
      ipcRenderer.invoke('transcribe-audio', { audioPath, sttUrl, sttModel })
  },

  // Sentence segments operations
  segments: {
    create: (data) => ipcRenderer.invoke('segments-create', data),
    getByTranscript: (data) => ipcRenderer.invoke('segments-get-by-transcript', data),
    update: (data) => ipcRenderer.invoke('segments-update', data),
    deleteByTranscript: (data) => ipcRenderer.invoke('segments-delete-by-transcript', data),
    createFromChunks: (data) => ipcRenderer.invoke('segments-create-from-chunks', data)
  },

  // AI Prompts operations
  aiPrompts: {
    getByCategory: (category) => ipcRenderer.invoke('ai-prompts-get-by-category', category),
    get: (options) => ipcRenderer.invoke('ai-prompts-get', options),
    save: (prompt) => ipcRenderer.invoke('ai-prompts-save', prompt),
    delete: (id) => ipcRenderer.invoke('ai-prompts-delete', id),
    resetToDefault: (options) => ipcRenderer.invoke('ai-prompts-reset-to-default', options)
  },

  // Model info (for compatibility with ModelMetadataService)
  getModelInfo: (options) => ipcRenderer.invoke('get-model-info', options),

  // Database management
  getDatabaseInfo: () => ipcRenderer.invoke('get-database-info'),
  changeDatabaseLocation: (newPath) => ipcRenderer.invoke('change-database-location', newPath),
  backupDatabase: (backupPath) => ipcRenderer.invoke('backup-database', backupPath),
  
  // Shell operations
  shell: {
    showItemInFolder: (fullPath) => ipcRenderer.send('show-item-in-folder', fullPath)
  },
  
  // System information
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome
  }
});