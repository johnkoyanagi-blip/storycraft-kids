'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WizardStep {
  title: string;
  component: React.ReactNode;
}

interface WizardShellProps {
  steps: WizardStep[];
  onComplete: () => Promise<void>;
}

export function WizardShell({ steps, onComplete }: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleNext() {
    if (currentStep === steps.length - 1) {
      setLoading(true);
      setError('');
      try {
        await onComplete();
      } catch (err) {
        console.error('Failed to complete wizard:', err);
        setError('Something went wrong. Please try again!');
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-purple-700 mb-6 text-center">Create Your Story</h1>

            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    idx === currentStep
                      ? 'bg-purple-600 text-white scale-110'
                      : idx < currentStep
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-purple-700 text-center">{steps[currentStep].title}</h2>
          </div>

          <div className="min-h-96 mb-8 p-4">
            {typeof steps[currentStep].component === 'function'
              ? steps[currentStep].component
              : typeof steps[currentStep].component === 'object'
                ? steps[currentStep].component
                : null}
          </div>

          {error && <p className="text-red-500 text-sm text-center font-semibold mb-4">{error}</p>}

          <div className="flex gap-4 justify-between pt-6 border-t border-purple-100">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className="px-8"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              loading={loading}
              className="px-8"
            >
              {currentStep === steps.length - 1 ? 'Create Story!' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
