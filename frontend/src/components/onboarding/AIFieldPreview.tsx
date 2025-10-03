import { useState } from 'react';

interface AIFieldPreviewProps {
  label: string;
  value: string;
  confidence?: number;
  source?: 'website' | 'linkedin' | 'youtube' | 'ai';
  editable?: boolean;
  multiline?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function AIFieldPreview({
  label,
  value,
  confidence = 0.5,
  source = 'ai',
  editable = true,
  multiline = false,
  onChange,
  placeholder
}: AIFieldPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleSave = () => {
    if (onChange) {
      onChange(editedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = () => {
    if (confidence >= 0.8) return '✓';
    if (confidence >= 0.5) return '⚠';
    return '!';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.5) return 'Medium confidence';
    return 'Low confidence';
  };

  const getSourceIcon = () => {
    switch (source) {
      case 'website': return '🌐';
      case 'linkedin': return '🔗';
      case 'youtube': return '📺';
      default: return '🤖';
    }
  };

  const getSourceLabel = () => {
    switch (source) {
      case 'website': return 'From website';
      case 'linkedin': return 'From LinkedIn';
      case 'youtube': return 'From YouTube';
      default: return 'AI suggested';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center space-x-2 text-xs">
          <span className={`px-2 py-1 rounded-full border ${getConfidenceColor()}`}>
            {getConfidenceIcon()} {getConfidenceLabel()}
          </span>
          <span className="text-gray-500">
            {getSourceIcon()} {getSourceLabel()}
          </span>
        </div>
      </div>

      {!isEditing ? (
        <div className="relative group">
          {multiline ? (
            <div className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-md text-gray-900 whitespace-pre-wrap">
              {value || <span className="text-gray-400">{placeholder}</span>}
            </div>
          ) : (
            <input
              type="text"
              value={value}
              readOnly
              className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-md text-gray-900"
              placeholder={placeholder}
            />
          )}

          {editable && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholder}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholder}
              autoFocus
            />
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
