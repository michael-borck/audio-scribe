import React, { useState } from 'react';
import { X, Search, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl/Cmd', '1'], description: 'Home page' },
        { keys: ['Ctrl/Cmd', '2'], description: 'Library page' },
        { keys: ['Ctrl/Cmd', '3'], description: 'Projects page' },
        { keys: ['Ctrl/Cmd', '4'], description: 'Search page' },
        { keys: ['Ctrl/Cmd', '5'], description: 'Settings page' },
        { keys: ['Ctrl/Cmd', ','], description: 'Open Settings' },
        { keys: ['F11'], description: 'Toggle fullscreen mode' },
        { keys: ['Esc'], description: 'Close modal/dialog, cancel operation' },
      ]
    },
    {
      category: 'File Operations',
      items: [
        { keys: ['Ctrl/Cmd', 'U'], description: 'Upload files' },
        { keys: ['Ctrl/Cmd', 'O'], description: 'Open file dialog' },
        { keys: ['Ctrl/Cmd', 'S'], description: 'Save current transcript' },
        { keys: ['Ctrl/Cmd', 'Shift', 'S'], description: 'Save as (new copy)' },
        { keys: ['Ctrl/Cmd', 'E'], description: 'Export current content' },
        { keys: ['Ctrl/Cmd', 'N'], description: 'New project' },
        { keys: ['Delete'], description: 'Move to trash' },
      ]
    },
    {
      category: 'Search and Discovery',
      items: [
        { keys: ['Ctrl/Cmd', 'F'], description: 'Search in current page' },
        { keys: ['Ctrl/Cmd', 'K'], description: 'Global search bar' },
        { keys: ['Ctrl/Cmd', 'G'], description: 'Find next occurrence' },
        { keys: ['Ctrl/Cmd', 'Shift', 'G'], description: 'Find previous occurrence' },
        { keys: ['Enter'], description: 'Execute search' },
        { keys: ['Esc'], description: 'Clear/close search' },
      ]
    },
    {
      category: 'Text Editing',
      items: [
        { keys: ['Ctrl/Cmd', 'A'], description: 'Select all text' },
        { keys: ['Ctrl/Cmd', 'C'], description: 'Copy selected text' },
        { keys: ['Ctrl/Cmd', 'V'], description: 'Paste text' },
        { keys: ['Ctrl/Cmd', 'X'], description: 'Cut selected text' },
        { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo last action' },
        { keys: ['Ctrl/Cmd', 'Y'], description: 'Redo action' },
        { keys: ['F2'], description: 'Edit speaker name' },
        { keys: ['Tab'], description: 'Jump to next speaker' },
      ]
    },
    {
      category: 'Audio/Video Playback',
      items: [
        { keys: ['Space'], description: 'Play/pause toggle' },
        { keys: ['←'], description: 'Skip backward (5 seconds)' },
        { keys: ['→'], description: 'Skip forward (5 seconds)' },
        { keys: ['Shift', '←'], description: 'Skip backward (30 seconds)' },
        { keys: ['Shift', '→'], description: 'Skip forward (30 seconds)' },
        { keys: ['Home'], description: 'Go to beginning' },
        { keys: ['End'], description: 'Go to end' },
        { keys: ['+'], description: 'Increase playback speed' },
        { keys: ['-'], description: 'Decrease playback speed' },
        { keys: ['0'], description: 'Reset to normal speed' },
        { keys: ['M'], description: 'Mute/unmute' },
        { keys: ['↑'], description: 'Increase volume' },
        { keys: ['↓'], description: 'Decrease volume' },
      ]
    },
    {
      category: 'AI and Analysis',
      items: [
        { keys: ['Ctrl/Cmd', 'Shift', 'A'], description: 'Start AI analysis' },
        { keys: ['Ctrl/Cmd', 'Shift', 'C'], description: 'Open AI chat' },
        { keys: ['Ctrl/Cmd', 'Enter'], description: 'Send chat message' },
        { keys: ['Enter'], description: 'Send message' },
        { keys: ['Shift', 'Enter'], description: 'New line in message' },
        { keys: ['↑'], description: 'Previous message in history' },
        { keys: ['↓'], description: 'Next message in history' },
      ]
    },
    {
      category: 'Help and Documentation',
      items: [
        { keys: ['Ctrl/Cmd', '?'], description: 'Show keyboard shortcuts (this dialog)' },
        { keys: ['F1'], description: 'Help documentation' },
      ]
    }
  ];

  const filteredShortcuts = shortcuts.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keys.some(key => key.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => category.items.length > 0);

  const KeyBadge: React.FC<{ keys: string[] }> = ({ keys }) => (
    <div className="flex items-center space-x-1">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-gray-400">+</span>}
        </React.Fragment>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Keyboard className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Keyboard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No shortcuts found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredShortcuts.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between py-2">
                        <span className="text-gray-700 flex-1">{item.description}</span>
                        <KeyBadge keys={item.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredShortcuts.reduce((acc, cat) => acc + cat.items.length, 0)}</span> shortcuts available
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 rounded">Esc</kbd> to close</span>
              <span>•</span>
              <span>Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 rounded">Ctrl+?</kbd> anytime to open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;