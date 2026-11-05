import React from 'react';
import { ThemeConfig, ThemePreset, PaperTexture } from '../types';
import { Palette, X, Sun, Moon, Check, Sparkles } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onUpdateTheme: (theme: ThemeConfig) => void;
}

interface PresetInfo {
  id: ThemePreset;
  name: string;
  description: string;
  accentColor: string;
  bgLight: string;
  bgDark: string;
}

const PRESETS: PresetInfo[] = [
  {
    id: 'matcha',
    name: 'Matcha Studio',
    description: 'Soft sage green with warm oat paper tones',
    accentColor: '#6C8270',
    bgLight: '#F7F6F2',
    bgDark: '#14171A',
  },
  {
    id: 'lavender',
    name: 'Lavender Fog',
    description: 'Muted lilac and misty heather periwinkle',
    accentColor: '#8675A9',
    bgLight: '#F6F4F9',
    bgDark: '#15131C',
  },
  {
    id: 'peach',
    name: 'Cozy Sunset',
    description: 'Warm terracotta apricot and almond cream',
    accentColor: '#D47A60',
    bgLight: '#FDF8F5',
    bgDark: '#1B1412',
  },
  {
    id: 'nordic',
    name: 'Nordic Paper',
    description: 'Cool natural linen and subdued graphite',
    accentColor: '#5F6B72',
    bgLight: '#F4F4F3',
    bgDark: '#161718',
  },
  {
    id: 'midnight',
    name: 'Midnight Study',
    description: 'Deep navy room with warm candlelight accents',
    accentColor: '#D6A461',
    bgLight: '#0F1217',
    bgDark: '#0F1217',
  },
];

export const ThemeCustomizerModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  theme,
  onUpdateTheme,
}) => {
  if (!isOpen) return null;

  const handleSelectPreset = (preset: ThemePreset) => {
    // If midnight is chosen, make sure dark mode is on
    const isDark = preset === 'midnight' ? true : theme.isDark;
    onUpdateTheme({ ...theme, preset, isDark });
  };

  const handleToggleDark = (isDark: boolean) => {
    onUpdateTheme({ ...theme, isDark });
  };

  const handleSelectTexture = (paperTexture: PaperTexture) => {
    onUpdateTheme({ ...theme, paperTexture });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="max-w-lg w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
                Customize Theme & Aesthetic
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)]">
                Soothing lo-fi pastel palettes and notebook paper textures.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Light / Dark Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-2">
              Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
              <button
                type="button"
                onClick={() => handleToggleDark(false)}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                  !theme.isDark
                    ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Paper</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleDark(true)}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                  theme.isDark
                    ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                <Moon className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>Dark Cozy Room</span>
              </button>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-2">
              Lo-Fi Pastel Palettes
            </label>
            <div className="space-y-2">
              {PRESETS.map(preset => {
                const isSelected = theme.preset === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]/50 ring-1 ring-[var(--theme-accent)]'
                        : 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-subtle)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full shadow-xs flex items-center justify-center border border-black/10 shrink-0"
                        style={{ backgroundColor: preset.accentColor }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--theme-text-primary)]">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-[var(--theme-text-muted)]">
                          {preset.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: preset.bgLight }}
                        title="Light tint"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/10"
                        style={{ backgroundColor: preset.bgDark }}
                        title="Dark tint"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Texture Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-2">
              Background Paper Texture
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Clean Surface' },
                { id: 'grid', label: 'Grid Notebook' },
                { id: 'dots', label: 'Dot Journal' },
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleSelectTexture(item.id as PaperTexture)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                    theme.paperTexture === item.id
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                      : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
