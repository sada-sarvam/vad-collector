'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import Link from 'next/link';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AudioRecorder from '@/components/recording/AudioRecorder';
import LanguageSelector from '@/components/games/LanguageSelector';
import PromptDisplay from '@/components/games/PromptDisplay';
import CategorySelector from '@/components/games/CategorySelector';
import ProgressBar from '@/components/ui/ProgressBar';
import InstructionsModal from '@/components/games/InstructionsModal';

import { getGameById, COLLECTION_TARGETS } from '@/lib/constants';
import { GameType, Language, Label, Category, Prompt } from '@/types';

type GameStep = 'setup' | 'prompt' | 'record' | 'categorize' | 'success';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as GameType;
  const game = getGameById(gameId);

  // State
  const [step, setStep] = useState<GameStep>('setup');
  const [language, setLanguage] = useState<Language>('hi');
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [category, setCategory] = useState<Category>('complete-nofiller');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Instructions modal state
  const [showInstructions, setShowInstructions] = useState(true);

  // Expert info (would come from auth in production)
  const expertId = 'expert_001';
  const expertName = 'Language Expert';

  // Redirect if game not found
  useEffect(() => {
    if (!game) {
      router.push('/');
    }
  }, [game, router]);

  // Fetch new prompt
  const fetchPrompt = useCallback(async () => {
    setIsLoadingPrompt(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/prompts?gameType=${gameId}&language=${language}`
      );
      const data = await response.json();

      if (data.success && data.prompt) {
        setPrompt(data.prompt);
        // Set default category based on expected label
        if (data.prompt.expectedLabel === 'complete') {
          setCategory('complete-nofiller');
        } else {
          setCategory('incomplete-endfiller');
        }
      } else {
        // Use fallback prompt
        setPrompt({
          id: `fallback_${Date.now()}`,
          gameType: gameId,
          language,
          text: getFallbackText(gameId, language),
          instruction: getFallbackInstruction(gameId, language),
          expectedLabel: game?.focusLabel === 'both' ? 
            (Math.random() > 0.5 ? 'complete' : 'incomplete') : 
            (game?.focusLabel as Label),
        });
      }
    } catch (err) {
      console.error('Failed to fetch prompt:', err);
      // Use fallback
      setPrompt({
        id: `fallback_${Date.now()}`,
        gameType: gameId,
        language,
        text: getFallbackText(gameId, language),
        instruction: getFallbackInstruction(gameId, language),
        expectedLabel: 'incomplete',
      });
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [gameId, language, game]);

  // Fallback texts
  function getFallbackText(game: GameType, lang: Language): string {
    const fallbacks: Record<GameType, Record<Language, string>> = {
      'finish-thought': {
        hi: 'मुझे लगता है कि आज...',
        en: 'I was thinking maybe we could...',
        ta: 'நான் நினைக்கிறேன்...',
      },
      'quick-answer': {
        hi: 'आपका पसंदीदा खाना क्या है?',
        en: "What's your favorite season?",
        ta: 'உங்களுக்கு பிடித்த நிறம் என்ன?',
      },
      'storyteller': {
        hi: 'एक अजीब सपने के बारे में बताएं',
        en: 'Tell me about a strange dream',
        ta: 'ஒரு விசித்திரமான கனவு பற்றி சொல்லுங்கள்',
      },
      'memory-lane': {
        hi: 'अपने बचपन के किसी दोस्त का नाम याद करें',
        en: "Try to remember your first teacher's name",
        ta: 'உங்கள் குழந்தைப் பருவ நண்பரின் பெயர் நினைவிருக்கிறதா?',
      },
      'number-dictation': {
        hi: '9 8 7 6 5 4 3 2 1 0',
        en: '9 8 7 6 5 4 3 2 1 0',
        ta: '9 8 7 6 5 4 3 2 1 0',
      },
    };
    return fallbacks[game][lang];
  }

  function getFallbackInstruction(game: GameType, lang: Language): string {
    const instructions: Record<GameType, Record<Language, string>> = {
      'finish-thought': {
        hi: 'इसे जारी रखें और स्वाभाविक रूप से रुकें',
        en: 'Continue this and trail off naturally',
        ta: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்',
      },
      'quick-answer': {
        hi: 'एक वाक्य में आत्मविश्वास से जवाब दें',
        en: 'Answer confidently in one sentence',
        ta: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்',
      },
      'storyteller': {
        hi: 'कहानी शुरू करें',
        en: 'Start telling the story',
        ta: 'கதையை சொல்ல ஆரம்பியுங்கள்',
      },
      'memory-lane': {
        hi: 'याद करते हुए जोर से सोचें',
        en: 'Try to recall out loud',
        ta: 'நினைவுகூர முயற்சிக்கவும்',
      },
      'number-dictation': {
        hi: 'नंबर बोलें',
        en: 'Dictate the numbers',
        ta: 'எண்களை சொல்லுங்கள்',
      },
    };
    return instructions[game][lang];
  }

  // Handle recording complete
  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    setStep('categorize');
  };

  // Submit recording
  const submitRecording = async () => {
    if (!audioBlob || !prompt) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // First upload audio
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording_${Date.now()}.webm`);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload audio');
      }

      // Then save recording metadata (including GCS path)
      const recordingData = {
        expertId,
        expertName,
        gameType: gameId,
        language,
        label: prompt.expectedLabel || (category.startsWith('complete') ? 'complete' : 'incomplete'),
        category,
        audioUrl: uploadData.url,
        gcsPath: uploadData.gcsPath || null,
        audioDuration,
        promptId: prompt.id,
        promptText: prompt.text,
        instruction: prompt.instruction,
      };

      const saveResponse = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordingData),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed to save recording');
      }

      setSessionCount((prev) => prev + 1);
      setStep('success');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit recording');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start new recording
  const startNewRecording = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    setPrompt(null);
    setStep('setup');
  };

  // Continue to next prompt
  const continueRecording = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    fetchPrompt();
    setStep('prompt');
  };

  if (!game) return null;

  return (
    <div className="min-h-screen py-8 px-6">
      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        game={game}
        language={language}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{game.icon}</span>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                {game.name}
              </h1>
              <p className="text-sm text-white/50">{game.nameHindi}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(true)}
              leftIcon={<HelpCircle className="w-4 h-4" />}
            >
              Help
            </Button>
            <div className="text-right">
              <div className="text-2xl font-display font-bold text-aurora-teal">
                {sessionCount}
              </div>
              <div className="text-xs text-white/50">This session</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={sessionCount}
          max={COLLECTION_TARGETS.perExpertDaily}
          label="Daily Target"
          color={game.color}
        />

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Setup */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <Card padding="lg" className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">
                    Select Language
                  </h2>
                  <LanguageSelector
                    selected={language}
                    onChange={setLanguage}
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-3">
                    Instructions
                  </h3>
                  <p className="text-white/60 text-sm">
                    {game.instructions[language]}
                  </p>
                </div>
              </Card>

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    fetchPrompt();
                    setStep('prompt');
                  }}
                  leftIcon={<Sparkles className="w-5 h-5" />}
                >
                  Get Prompt
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Show Prompt */}
          {step === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <PromptDisplay
                text={prompt?.text || ''}
                instruction={prompt?.instruction || ''}
                language={language}
                expectedLabel={prompt?.expectedLabel}
                isLoading={isLoadingPrompt}
              />

              <div className="flex justify-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => fetchPrompt()}
                  disabled={isLoadingPrompt}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  New Prompt
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setStep('record')}
                  disabled={isLoadingPrompt || !prompt}
                >
                  Start Recording
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Record */}
          {step === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Mini prompt reminder */}
              <Card padding="md" className="text-center">
                <p className="text-white/70 text-sm mb-2">Prompt:</p>
                <p className="text-white font-medium">{prompt?.text}</p>
                {prompt?.expectedLabel && (
                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      prompt.expectedLabel === 'complete'
                        ? 'label-complete'
                        : 'label-incomplete'
                    }`}
                  >
                    {prompt.expectedLabel === 'complete' ? 'Complete' : 'Trail Off'}
                  </span>
                )}
              </Card>

              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setStep('prompt')}
                minDuration={COLLECTION_TARGETS.minDuration}
                maxDuration={COLLECTION_TARGETS.maxDuration}
              />
            </motion.div>
          )}

          {/* Step 4: Categorize */}
          {step === 'categorize' && (
            <motion.div
              key="categorize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card padding="lg" className="space-y-6">
                <div className="text-center">
                  <div className="text-aurora-teal font-mono text-lg mb-2">
                    {audioDuration.toFixed(1)}s recorded
                  </div>
                  <p className="text-white/50 text-sm">
                    Categorize your recording
                  </p>
                </div>

                <CategorySelector
                  label={
                    prompt?.expectedLabel ||
                    (category.startsWith('complete') ? 'complete' : 'incomplete')
                  }
                  selected={category}
                  onChange={setCategory}
                />

                {error && (
                  <div className="text-red-400 text-sm text-center">{error}</div>
                )}
              </Card>

              <div className="flex justify-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep('record')}
                  disabled={isSubmitting}
                >
                  Re-record
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={submitRecording}
                  isLoading={isSubmitting}
                >
                  Submit Recording
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <Card padding="lg" className="text-center space-y-6">
                <div className="text-6xl">🎉</div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    Great Job!
                  </h2>
                  <p className="text-white/60">
                    Recording submitted successfully
                  </p>
                </div>
                <div className="stat-value text-4xl">{sessionCount}</div>
                <p className="text-white/50 text-sm">recordings this session</p>
              </Card>

              <div className="flex justify-center gap-4">
                <Button variant="ghost" onClick={startNewRecording}>
                  Change Language
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={continueRecording}
                >
                  Next Recording
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
