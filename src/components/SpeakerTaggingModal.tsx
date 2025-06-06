import React, { useState, useEffect } from 'react';
import { X, Wand2, Save, Plus, Trash2 } from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  color: string;
}

interface TextSegment {
  id: number;
  text: string;
  speaker?: string;
  isManuallyTagged?: boolean;
  startIndex: number;
  endIndex: number;
}

interface SpeakerTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptText: string;
  existingSpeakers?: Array<{ id: string; name: string; segments: number }>;
  onSave: (taggedText: string, speakers: Array<{ id: string; name: string; segments: number }>) => void;
}

const SPEAKER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

export const SpeakerTaggingModal: React.FC<SpeakerTaggingModalProps> = ({
  isOpen,
  onClose,
  transcriptText,
  existingSpeakers = [],
  onSave
}) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize speakers
      if (existingSpeakers.length > 0) {
        setSpeakers(existingSpeakers.map((s, i) => ({
          id: s.id,
          name: s.name,
          color: SPEAKER_COLORS[i % SPEAKER_COLORS.length]
        })));
      } else {
        setSpeakers([
          { id: 'speaker1', name: 'Interviewer', color: SPEAKER_COLORS[0] },
          { id: 'speaker2', name: 'Interviewee', color: SPEAKER_COLORS[1] }
        ]);
      }

      // Smart text segmentation - sentence-based
      const smartSegments = createSmartSegments(transcriptText, speakers);
      setSegments(smartSegments);
      setSelectedSpeaker(speakers[0]?.id || 'speaker1');
    }
  }, [isOpen, transcriptText, existingSpeakers]);

  const createSmartSegments = (text: string, availableSpeakers: Speaker[]): TextSegment[] => {
    if (!text.trim()) return [];
    
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    
    // Check if text already has speaker tags like "[Interviewer]: text"
    const hasExistingTags = /\[([^\]]+)\]:\s*/.test(text);
    
    if (hasExistingTags) {
      // Parse existing speaker-tagged text
      const lines = text.split(/\n+/).filter(line => line.trim());
      
      lines.forEach(line => {
        const speakerMatch = line.match(/^\[([^\]]+)\]:\s*(.*)$/);
        if (speakerMatch) {
          const speakerName = speakerMatch[1];
          const content = speakerMatch[2].trim();
          
          // Find matching speaker
          const speaker = availableSpeakers.find(s => s.name === speakerName);
          
          if (content) {
            // Split content into sentences
            const contentSentences = content.split(/([.!?]+)/).filter(s => s.trim());
            
            for (let i = 0; i < contentSentences.length; i += 2) {
              const sentence = contentSentences[i] || '';
              const punctuation = contentSentences[i + 1] || '';
              const fullSentence = (sentence + (punctuation || '')).trim();
              
              if (fullSentence.length > 0) {
                segments.push({
                  id: segments.length,
                  text: fullSentence,
                  speaker: speaker?.id,
                  isManuallyTagged: true, // Mark as manually tagged since it was previously saved
                  startIndex: currentIndex,
                  endIndex: currentIndex + fullSentence.length
                });
                
                currentIndex += fullSentence.length + 1;
              }
            }
          }
        } else if (line.trim()) {
          // Line without speaker tag
          segments.push({
            id: segments.length,
            text: line.trim(),
            speaker: undefined,
            isManuallyTagged: false,
            startIndex: currentIndex,
            endIndex: currentIndex + line.length
          });
          currentIndex += line.length + 1;
        }
      });
    } else {
      // Split into individual sentences for precise tagging
      const sentences = text.split(/([.!?]+)/).filter(s => s.trim());
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i] || '';
        const punctuation = sentences[i + 1] || '';
        const fullSentence = (sentence + (punctuation || '')).trim();
        
        if (fullSentence.length > 0) {
          segments.push({
            id: segments.length,
            text: fullSentence,
            speaker: undefined,
            isManuallyTagged: false,
            startIndex: currentIndex,
            endIndex: currentIndex + fullSentence.length
          });
          
          currentIndex += fullSentence.length + 1; // +1 for space
        }
      }
    }
    
    // If no sentences found (no punctuation), split by line breaks or create chunks
    if (segments.length === 0) {
      const lines = text.split(/\n+/).filter(line => line.trim());
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          // Split long lines into smaller chunks at natural breaks
          const chunks = splitLineIntoChunks(trimmedLine);
          
          chunks.forEach(chunk => {
            segments.push({
              id: segments.length,
              text: chunk,
              speaker: undefined,
              isManuallyTagged: false,
              startIndex: currentIndex,
              endIndex: currentIndex + chunk.length
            });
            currentIndex += chunk.length + 1;
          });
        }
      });
    }
    
    return segments;
  };

  const splitLineIntoChunks = (line: string): string[] => {
    // For very long lines without punctuation, split at natural conversation breaks
    const maxChunkLength = 100;
    
    if (line.length <= maxChunkLength) {
      return [line];
    }
    
    const chunks: string[] = [];
    const words = line.split(' ');
    let currentChunk = '';
    
    for (const word of words) {
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
      
      if (testChunk.length > maxChunkLength && currentChunk) {
        // Look for conversation markers to split at
        const markers = ['So', 'Well', 'Actually', 'But', 'And', 'Now', 'Then', 'Also', 'Yes', 'No', 'Okay', 'Right'];
        const endsWithMarker = markers.some(marker => 
          currentChunk.toLowerCase().endsWith(marker.toLowerCase())
        );
        
        if (endsWithMarker || currentChunk.length > 30) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          currentChunk = testChunk;
        }
      } else {
        currentChunk = testChunk;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  };

  const addSpeaker = () => {
    if (newSpeakerName.trim()) {
      const newSpeaker: Speaker = {
        id: `speaker${speakers.length + 1}`,
        name: newSpeakerName.trim(),
        color: SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length]
      };
      setSpeakers([...speakers, newSpeaker]);
      setNewSpeakerName('');
      setSelectedSpeaker(newSpeaker.id);
    }
  };

  const removeSpeaker = (speakerId: string) => {
    if (speakers.length > 2) {
      setSpeakers(speakers.filter(s => s.id !== speakerId));
      // Clear assignments for removed speaker
      setSegments(segments.map(seg => 
        seg.speaker === speakerId ? { ...seg, speaker: undefined, isManuallyTagged: false } : seg
      ));
      // Update selected speaker if needed
      if (selectedSpeaker === speakerId) {
        setSelectedSpeaker(speakers.find(s => s.id !== speakerId)?.id || speakers[0]?.id);
      }
    }
  };

  const assignSpeaker = (segmentId: number) => {
    setSegments(segments.map(seg => 
      seg.id === segmentId 
        ? { ...seg, speaker: selectedSpeaker, isManuallyTagged: true }
        : seg
    ));
  };

  const clearSpeaker = (segmentId: number) => {
    setSegments(segments.map(seg => 
      seg.id === segmentId 
        ? { ...seg, speaker: undefined, isManuallyTagged: false }
        : seg
    ));
  };

  const applyAISuggestions = async () => {
    setIsProcessing(true);
    
    try {
      // Get manually tagged segments
      const taggedSegments = segments.filter(s => s.isManuallyTagged && s.speaker);
      
      if (taggedSegments.length < 2) {
        alert('Please manually tag at least 2 segments to help the AI learn the pattern.');
        setIsProcessing(false);
        return;
      }

      // Build context for AI
      const taggedExamples = taggedSegments.map(seg => {
        const speaker = speakers.find(s => s.id === seg.speaker);
        return `${speaker?.name}: "${seg.text}"`;
      }).join('\n\n');

      const untaggedSegments = segments.filter(s => !s.speaker);
      
      if (untaggedSegments.length === 0) {
        alert('All segments are already tagged!');
        setIsProcessing(false);
        return;
      }

      const speakerNames = speakers.map(s => s.name).join(', ');
      const aiPrompt = `You are helping tag speakers in a conversation transcript. Based on these manually tagged examples, identify which speaker is most likely speaking in each untagged segment.

Available speakers: ${speakerNames}

Tagged examples:
${taggedExamples}

For each segment below, respond with ONLY the speaker name (exactly as listed above):

${untaggedSegments.map(s => `Segment ${s.id}: "${s.text}"`).join('\n\n')}

Response format (one line per segment):
Segment 0: Speaker Name
Segment 1: Speaker Name
etc.`;

      // Get AI settings
      const aiUrlSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiAnalysisUrl']
      );
      
      const aiModelSetting = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiModel']
      );
      
      const aiUrl = aiUrlSetting?.value || 'http://localhost:11434';
      const aiModel = aiModelSetting?.value || 'llama3.2';

      console.log('AI Prompt:', aiPrompt);
      console.log('AI URL:', aiUrl, 'Model:', aiModel);

      // Call AI service
      const response = await fetch(`${aiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          prompt: aiPrompt,
          stream: false
        })
      });

      console.log('AI Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI service error response:', errorText);
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('AI Result:', result);

      if (result.response) {
        // Parse AI response
        const lines = result.response.split('\n');
        const updatedSegments = [...segments];
        
        lines.forEach((line: string) => {
          const match = line.match(/Segment (\d+):\s*(.+)/);
          if (match) {
            const segmentId = parseInt(match[1]);
            const speakerName = match[2].trim();
            const speaker = speakers.find(s => s.name === speakerName);
            
            if (speaker) {
              const segmentIndex = updatedSegments.findIndex(s => s.id === segmentId);
              if (segmentIndex !== -1 && !updatedSegments[segmentIndex].speaker) {
                updatedSegments[segmentIndex] = {
                  ...updatedSegments[segmentIndex],
                  speaker: speaker.id,
                  isManuallyTagged: false
                };
              }
            }
          }
        });
        
        setSegments(updatedSegments);
      }
    } catch (error) {
      console.error('Error applying AI suggestions:', error);
      alert(`Failed to apply AI suggestions: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    }
    
    setIsProcessing(false);
  };

  const handleSave = () => {
    // Build tagged transcript
    const taggedLines = segments.map(seg => {
      if (seg.speaker) {
        const speaker = speakers.find(s => s.id === seg.speaker);
        return `[${speaker?.name}]: ${seg.text}`;
      }
      return seg.text;
    });
    
    const taggedText = taggedLines.join('\n\n');
    
    // Calculate speaker segments
    const speakerStats = speakers.map(speaker => {
      const segmentCount = segments.filter(s => s.speaker === speaker.id).length;
      return {
        id: speaker.id,
        name: speaker.name,
        segments: segmentCount
      };
    }).filter(s => s.segments > 0);
    
    onSave(taggedText, speakerStats);
    onClose();
  };

  if (!isOpen) return null;

  const taggedCount = segments.filter(s => s.speaker).length;
  const progress = segments.length > 0 ? (taggedCount / segments.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Speaker Tagging</h2>
            <p className="text-sm text-gray-600 mt-1">
              Each sentence is a separate segment. Click any sentence to assign it to the selected speaker. Perfect for tagging short responses like "Yes" or "No".
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r p-6 overflow-y-auto bg-gray-50">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{taggedCount} / {segments.length} segments</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">How to Tag:</h3>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Select a speaker below</li>
                <li>2. Click on sentences to assign them</li>
                <li>3. Tag short responses like "Yes", "No" easily</li>
                <li>4. Tag 2-3 sentences manually, then use AI</li>
              </ol>
            </div>

            {/* Selected Speaker */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Speaker:</h3>
              {selectedSpeaker && (
                <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: speakers.find(s => s.id === selectedSpeaker)?.color }}
                    />
                    <span className="font-medium">{speakers.find(s => s.id === selectedSpeaker)?.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Speakers */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Speakers:</h3>
              <div className="space-y-2">
                {speakers.map((speaker) => {
                  const segmentCount = segments.filter(s => s.speaker === speaker.id).length;
                  return (
                    <div
                      key={speaker.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSpeaker === speaker.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => setSelectedSpeaker(speaker.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: speaker.color }}
                        />
                        <div>
                          <span className="font-medium text-sm">{speaker.name}</span>
                          <div className="text-xs text-gray-500">{segmentCount} segments</div>
                        </div>
                      </div>
                      {speakers.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSpeaker(speaker.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add speaker */}
              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={newSpeakerName}
                  onChange={(e) => setNewSpeakerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSpeaker()}
                  placeholder="Add speaker..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addSpeaker}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={applyAISuggestions}
                disabled={isProcessing || taggedCount < 2}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isProcessing || taggedCount < 2
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Wand2 size={18} />
                <span>{isProcessing ? 'Processing...' : 'Apply AI Suggestions'}</span>
              </button>
              
              {taggedCount < 2 && (
                <p className="text-xs text-gray-500 text-center">
                  Tag at least 2 segments to enable AI assistance
                </p>
              )}
            </div>
          </div>

          {/* Transcript segments */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4 max-w-4xl">
              <div className="text-sm text-gray-600 mb-4">
                <strong>Instructions:</strong> Click on any sentence below to assign it to the selected speaker ({speakers.find(s => s.id === selectedSpeaker)?.name}). Even single words like "Yes" will be separate segments you can tag.
              </div>
              
              {segments.map((segment) => {
                const speaker = segment.speaker ? speakers.find(s => s.id === segment.speaker) : null;
                
                return (
                  <div
                    key={segment.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      segment.speaker
                        ? 'border-gray-400 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    style={{
                      backgroundColor: speaker ? `${speaker.color}15` : undefined,
                      borderColor: speaker ? speaker.color : undefined
                    }}
                    onClick={() => segment.speaker ? clearSpeaker(segment.id) : assignSpeaker(segment.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Speaker indicator */}
                      <div className="flex-shrink-0 mt-1">
                        {speaker ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: speaker.color }}
                            />
                            <span className="text-sm font-medium" style={{ color: speaker.color }}>
                              {speaker.name}
                            </span>
                            {segment.isManuallyTagged && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">manual</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full bg-gray-300 border-2 border-white" />
                            <span className="text-sm text-gray-500">Click to assign</span>
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1">
                        <p className="text-gray-800 leading-relaxed">{segment.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={taggedCount === 0}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              taggedCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save size={18} />
            <span>Save Tagged Transcript</span>
          </button>
        </div>
      </div>
    </div>
  );
};