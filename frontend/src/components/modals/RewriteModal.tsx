import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface RewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  onAccept: (rewrittenContent: string) => void;
  onRewrite: (instructions: string) => Promise<string>;
}

export const RewriteModal: React.FC<RewriteModalProps> = ({
  isOpen,
  onClose,
  originalContent,
  onAccept,
  onRewrite
}) => {
  const [instructions, setInstructions] = useState('');
  const [rewrittenContent, setRewrittenContent] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [hasRewritten, setHasRewritten] = useState(false);

  const handleRewrite = async () => {
    if (!instructions.trim()) return;
    
    try {
      setIsRewriting(true);
      const result = await onRewrite(instructions);
      setRewrittenContent(result);
      setHasRewritten(true);
    } catch (error) {
      console.error('Rewrite error:', error);
      alert('Failed to rewrite content. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAccept = () => {
    if (rewrittenContent) {
      onAccept(rewrittenContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setInstructions('');
    setRewrittenContent('');
    setHasRewritten(false);
    onClose();
  };

  const handleTryAgain = () => {
    setRewrittenContent('');
    setHasRewritten(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Content Rewriter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions Input */}
          <div className="space-y-2">
            <Label htmlFor="instructions">
              How would you like to rewrite this post?
            </Label>
            <Input
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Make it more professional, Add statistics, Shorten to 100 words"
              disabled={isRewriting}
            />
          </div>

          {/* Content Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Content */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Original Content
              </Label>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto shadow-sm">
                <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{originalContent}</p>
              </div>
            </div>

            {/* Rewritten Content */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {hasRewritten ? 'Rewritten Content' : 'AI Rewrite Preview'}
              </Label>
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 min-h-60 max-h-60 overflow-y-auto shadow-sm">
                {isRewriting ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">AI is rewriting your content...</p>
                    </div>
                  </div>
                ) : hasRewritten ? (
                  <Textarea
                    value={rewrittenContent}
                    onChange={(e) => setRewrittenContent(e.target.value)}
                    className="border-0 bg-transparent resize-none min-h-full p-0 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:ring-0 focus:outline-none"
                    placeholder="Rewritten content will appear here..."
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Enter instructions and click "Rewrite" to see the AI-generated version
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!hasRewritten ? (
              <Button 
                onClick={handleRewrite} 
                disabled={!instructions.trim() || isRewriting}
                className="flex items-center gap-2"
              >
                {isRewriting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleAccept}
                  disabled={!rewrittenContent.trim()}
                  className="flex items-center gap-2"
                >
                  Accept Rewrite
                </Button>
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Different Instructions
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};