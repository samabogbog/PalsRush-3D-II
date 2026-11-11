import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCw,
  Grid,
  LayoutGrid,
  User,
} from 'lucide-react';
import {
  AnimationPose,
  CHARACTERS,
  CharacterSpec,
  POSES,
} from '../models/characterTypes';

export interface ControlDockProps {
  selectedCharacter: CharacterSpec;
  selectedIndex: number;
  sliderValue: number;
  pose: AnimationPose;
  speedMultiplier: number;
  bounceIntensity: number;
  showAllLineup: boolean;
  wireframe: boolean;
  autoTurntable: boolean;
  isCollapsed: boolean;
  onSelectCharacter: (index: number) => void;
  onScrubSlider: (val: number) => void;
  onCommitSlider: (val: number) => void;
  onSelectPose: (pose: AnimationPose) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeBounce: (bounce: number) => void;
  onToggleLineup: () => void;
  onToggleWireframe: () => void;
  onToggleTurntable: () => void;
  onTriggerPoke: () => void;
  onToggleCollapse: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  selectedCharacter,
  selectedIndex,
  sliderValue,
  pose,
  speedMultiplier,
  bounceIntensity,
  showAllLineup,
  wireframe,
  autoTurntable,
  isCollapsed,
  onSelectCharacter,
  onScrubSlider,
  onCommitSlider,
  onSelectPose,
  onChangeSpeed,
  onChangeBounce,
  onToggleLineup,
  onToggleWireframe,
  onToggleTurntable,
  onTriggerPoke,
  onToggleCollapse,
}) => {
  const handlePrev = () => {
    const nextIdx = (selectedIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
    onSelectCharacter(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (selectedIndex + 1) % CHARACTERS.length;
    onSelectCharacter(nextIdx);
  };

  const activeRow = selectedCharacter.row;
  const rowCharacters = CHARACTERS.filter((c) => c.row === activeRow);
  const formattedNumber = String(selectedIndex + 1).padStart(2, '0');

  return (
    <div
      className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(960px,96vw)] pointer-events-none flex flex-col items-center"
      aria-label="Character and Pose Controls"
    >
      {/* Collapse / Expand Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg bg-[#FFFDF9] border border-[#E6DAC8] text-[#5C4938] hover:text-[#2B2118] text-[11px] sm:text-xs font-medium flex items-center gap-1.5 shadow-xs transition-transform duration-150 whitespace-nowrap shrink-0"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Show Controls' : 'Hide Controls'}
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Show Studio Controls (H)</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Hide Controls (H)</span>
          </>
        )}
      </button>

      {/* Main Unified Bottom Control Dock */}
      <div
        className={`w-full rounded-2xl bg-[#FFFDF9] border border-[#E5D9C5] shadow-lg px-3 py-2.5 sm:px-5 sm:py-3.5 transition-all duration-200 pointer-events-auto ${
          isCollapsed
            ? 'opacity-0 translate-y-8 pointer-events-none h-0 py-0 overflow-hidden border-0'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-5 items-center">
          {/* LEFT ZONE (5 cols): 16-Character Slider & Row Selector */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 lg:border-r lg:border-[#EDE3D2] lg:pr-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10"
                  style={{ backgroundColor: selectedCharacter.primaryHex }}
                />
                <span className="text-sm font-bold text-[#2B2118] truncate">
                  {formattedNumber}. {selectedCharacter.name}
                </span>
                <span className="text-xs text-[#8C7762] whitespace-nowrap shrink-0">
                  · Row 0{activeRow}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-[#E5D9C5] text-[#5C4938] hover:bg-[#F5EDE0] hover:text-[#2B2118] transition-colors"
                  aria-label="Previous Character"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-[#E5D9C5] text-[#5C4938] hover:bg-[#F5EDE0] hover:text-[#2B2118] transition-colors"
                  aria-label="Next Character"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smooth 16-Character Scrub Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="character-slider"
                  className="text-[11px] font-medium text-[#7D6854] whitespace-nowrap shrink-0"
                >
                  Slide Model
                </label>
                <input
                  id="character-slider"
                  type="range"
                  min={0}
                  max={CHARACTERS.length - 1}
                  step={0.01}
                  value={sliderValue}
                  onChange={(e) => onScrubSlider(parseFloat(e.target.value))}
                  onMouseUp={(e) =>
                    onCommitSlider(parseFloat((e.target as HTMLInputElement).value))
                  }
                  onTouchEnd={(e) =>
                    onCommitSlider(parseFloat((e.target as HTMLInputElement).value))
                  }
                  aria-label="Character Selection Slider"
                  className="w-full h-2 bg-[#EFE5D6] rounded-lg appearance-none cursor-pointer accent-[#C86D3B]"
                />
                <span className="text-xs font-mono tabular-nums text-[#5C4938] whitespace-nowrap shrink-0">
                  {selectedIndex + 1}/{CHARACTERS.length}
                </span>
              </div>

              {/* Active Row 4-Character Selector Bar */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {rowCharacters.map((char) => {
                  const active = char.index === selectedIndex && !showAllLineup;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => onSelectCharacter(char.index)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border ${
                        active
                          ? 'bg-[#2B2118] text-[#FFFDF9] border-[#2B2118] shadow-xs'
                          : 'bg-[#F8F2E8] text-[#5C4938] border-[#E8DEC8] hover:bg-[#EFE5D5] hover:text-[#2B2118]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-xs shrink-0 border border-black/15"
                        style={{ backgroundColor: char.primaryHex }}
                      />
                      <span>{char.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER ZONE (4 cols): 3 Animation Pose Buttons */}
          <div className="lg:col-span-4 flex flex-col gap-2 lg:border-r lg:border-[#EDE3D2] lg:pr-5">
            <div className="flex items-center justify-between text-xs text-[#7D6854]">
              <span className="font-semibold text-[#2B2118]">Animation Pose</span>
              <span className="font-mono tabular-nums">
                {POSES.find((p) => p.id === pose)?.tempoBpm} BPM
              </span>
            </div>

            <div
              className="grid grid-cols-3 gap-1.5 p-1 bg-[#F5EDE0] rounded-xl border border-[#E6DAC8]"
              role="group"
              aria-label="Animation Pose Selector"
            >
              {POSES.map((p) => {
                const isActive = pose === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPose(p.id)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#C86D3B] text-white shadow-xs'
                        : 'text-[#5C4938] hover:text-[#2B2118] hover:bg-[#EAE0D0]'
                    }`}
                  >
                    {p.index}. {p.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Speed & Bounce Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="speed-slider"
                  className="text-[11px] font-medium text-[#7D6854] whitespace-nowrap shrink-0"
                >
                  Speed
                </label>
                <input
                  id="speed-slider"
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.1}
                  value={speedMultiplier}
                  onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
                  aria-label="Animation Speed Multiplier"
                  className="w-full h-1.5 bg-[#EFE5D6] rounded-lg appearance-none cursor-pointer accent-[#C86D3B]"
                />
                <span className="text-[11px] font-mono tabular-nums text-[#5C4938] whitespace-nowrap shrink-0">
                  {speedMultiplier.toFixed(1)}x
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="bounce-slider"
                  className="text-[11px] font-medium text-[#7D6854] whitespace-nowrap shrink-0"
                >
                  Bounce
                </label>
                <input
                  id="bounce-slider"
                  type="range"
                  min={0.5}
                  max={1.6}
                  step={0.1}
                  value={bounceIntensity}
                  onChange={(e) => onChangeBounce(parseFloat(e.target.value))}
                  aria-label="Chibi Bounce Intensity"
                  className="w-full h-1.5 bg-[#EFE5D6] rounded-lg appearance-none cursor-pointer accent-[#C86D3B]"
                />
                <span className="text-[11px] font-mono tabular-nums text-[#5C4938] whitespace-nowrap shrink-0">
                  {Math.round(bounceIntensity * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT ZONE (3 cols): Quick Stage Actions */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#7D6854]">
              <span className="font-semibold text-[#2B2118]">Stage Tools</span>
              <span>{selectedCharacter.blockCount} Rounded Blocks</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onTriggerPoke}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#F8F2E8] hover:bg-[#EFE5D5] text-[#2B2118] border border-[#E5D9C5] transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C86D3B]" />
                <span>Squish / Poke</span>
              </button>

              <button
                type="button"
                onClick={onToggleLineup}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  showAllLineup
                    ? 'bg-[#2B2118] text-white border-[#2B2118]'
                    : 'bg-[#F8F2E8] hover:bg-[#EFE5D5] text-[#2B2118] border-[#E5D9C5]'
                }`}
              >
                {showAllLineup ? (
                  <>
                    <User className="w-3.5 h-3.5" />
                    <span>Single View</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>All 16 Grid</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onToggleTurntable}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  autoTurntable
                    ? 'bg-[#2B2118] text-white border-[#2B2118]'
                    : 'bg-[#F8F2E8] hover:bg-[#EFE5D5] text-[#5C4938] border-[#E5D9C5]'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Turntable</span>
              </button>

              <button
                type="button"
                onClick={onToggleWireframe}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  wireframe
                    ? 'bg-[#2B2118] text-white border-[#2B2118]'
                    : 'bg-[#F8F2E8] hover:bg-[#EFE5D5] text-[#5C4938] border-[#E5D9C5]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Wireframe</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
