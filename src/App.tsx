import { useState, useEffect, useCallback, useRef } from 'react';
import { X, FolderGit2 } from 'lucide-react';
import {
  ACTIVE_SKILLS,
  ActiveSkillId,
  AnimationPose,
  CHARACTERS,
  CharacterId,
  getCharacterByIndex,
  PASSIVE_SKILLS,
  PassiveSkillId,
  POSES,
} from './models/characterTypes';
import { ChibiStageCanvas } from './components/ChibiStageCanvas';
import { ControlDock } from './components/ControlDock';
import { RaceGameCanvas, RaceHudSnapshot } from './components/RaceGameCanvas';
import { RaceHudOverlay } from './components/RaceHudOverlay';
import { GitAgentHubModal } from './components/GitAgentHubModal';

const ROW_GROUPS = [
  { row: 1 as const, label: 'Row 01: Woodland', startIndex: 0 },
  { row: 2 as const, label: 'Row 02: Farm & Pets', startIndex: 4 },
  { row: 3 as const, label: 'Row 03: Safari Crew', startIndex: 8 },
  { row: 4 as const, label: 'Row 04: Birds & Pond', startIndex: 12 },
];

export type AppMode = 'race' | 'studio';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('race');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [pose, setPose] = useState<AnimationPose>('idle');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.1);
  const [bounceIntensity, setBounceIntensity] = useState<number>(1.0);
  const [showAllLineup, setShowAllLineup] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoTurntable, setAutoTurntable] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [showReferenceModal, setShowReferenceModal] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [pokeTriggerCount, setPokeTriggerCount] = useState<number>(0);

  // Party Race State + Custom Pre-Race Skill Loadout (1 of 5 Active + 1 of 5 Passive)
  const [selectedActiveSkillId, setSelectedActiveSkillId] =
    useState<ActiveSkillId>(CHARACTERS[0].activeSkillId);
  const [selectedPassiveSkillId, setSelectedPassiveSkillId] =
    useState<PassiveSkillId>(CHARACTERS[0].passiveSkillId);
  const [raceSessionKey, setRaceSessionKey] = useState<number>(1);
  const [isRaceLobbyOpen, setIsRaceLobbyOpen] = useState<boolean>(true);
  const [externalActionTrigger, setExternalActionTrigger] = useState<{
    type: 'q' | 'e' | 'f' | 'jump' | null;
    seq: number;
  }>({ type: null, seq: 0 });
  const joystickInputRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedCharacter = getCharacterByIndex(selectedIndex);
  const activePoseSpec = POSES.find((p) => p.id === pose) || POSES[0];
  const formattedNumber = String(selectedIndex + 1).padStart(2, '0');

  const [hudSnapshot, setHudSnapshot] = useState<RaceHudSnapshot>(() => ({
    phase: 'countdown',
    countdownSec: 3.0,
    elapsedRaceSec: 0,
    playerRank: 1,
    progressPercent: 0,
    zoneName: 'Start / Finish Meadow',
    elevationMeters: 0,
    qCooldown: 0,
    fCooldown: 0,
    heldItem: null,
    dashActive: false,
    shieldActive: false,
    whirlwindActive: false,
    slowActive: false,
    slapsLanded: 0,
    standings: CHARACTERS.slice(0, 8).map((c, idx) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      primaryHex: c.primaryHex,
      isPlayer: idx === 0,
      rank: idx + 1,
      finished: false,
      finishTimeSec: null,
      progressPercent: 0,
    })),
    events: [],
    bannerCallout: null,
  }));

  const handleSelectCharacter = useCallback((index: number) => {
    const clamped =
      ((index % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length;
    const char = CHARACTERS[clamped];
    setSelectedIndex(clamped);
    setSliderValue(clamped);
    setSelectedActiveSkillId(char.activeSkillId);
    setSelectedPassiveSkillId(char.passiveSkillId);
    setShowAllLineup(false);
  }, []);

  const handleSelectCharacterById = useCallback((id: CharacterId) => {
    const found = CHARACTERS.find((c) => c.id === id);
    if (found) {
      setSelectedIndex(found.index);
      setSliderValue(found.index);
      setSelectedActiveSkillId(found.activeSkillId);
      setSelectedPassiveSkillId(found.passiveSkillId);
    }
  }, []);

  const handleScrubSlider = useCallback((val: number) => {
    setSliderValue(val);
    setSelectedIndex(Math.round(val));
    setShowAllLineup(false);
  }, []);

  const handleCommitSlider = useCallback((val: number) => {
    const snapped = Math.round(val);
    setSelectedIndex(snapped);
    setSliderValue(snapped);
  }, []);

  const handleTriggerPoke = useCallback(() => {
    setPokeTriggerCount((c) => c + 1);
  }, []);

  const handleTriggerRaceAction = useCallback(
    (type: 'q' | 'e' | 'f' | 'jump') => {
      setExternalActionTrigger((prev) => ({ type, seq: prev.seq + 1 }));
    },
    []
  );

  const handleJoystickChange = useCallback((x: number, y: number) => {
    joystickInputRef.current = { x, y };
  }, []);

  // Studio keyboard shortcuts (only active when in 'studio' mode)
  useEffect(() => {
    if (appMode !== 'studio') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSelectCharacter(selectedIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSelectCharacter(selectedIndex + 1);
      } else if (e.key === '1') {
        setPose('idle');
      } else if (e.key === '2') {
        setPose('jump');
      } else if (e.key === '3') {
        setPose('run');
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTriggerPoke();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape' && showReferenceModal) {
        setShowReferenceModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    appMode,
    selectedIndex,
    handleSelectCharacter,
    handleTriggerPoke,
    showReferenceModal,
  ]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#FAF3E8] text-[#2B2118] flex flex-col select-none"
      data-mode={appMode}
      data-character={selectedCharacter.id}
      data-pose={pose}
    >
      {/* Main 3D Viewport Area (100% Full-Screen Game Viewport in Both Modes) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {appMode === 'race' ? (
          <>
            <RaceGameCanvas
              playerCharacterId={selectedCharacter.id}
              playerActiveSkillId={selectedActiveSkillId}
              playerPassiveSkillId={selectedPassiveSkillId}
              raceSessionKey={raceSessionKey}
              isLobbyOpen={isRaceLobbyOpen}
              externalActionTrigger={externalActionTrigger}
              joystickInputRef={joystickInputRef}
              onHudUpdate={setHudSnapshot}
            />
            <RaceHudOverlay
              selectedCharacter={selectedCharacter}
              selectedActiveSkillId={selectedActiveSkillId}
              selectedPassiveSkillId={selectedPassiveSkillId}
              hud={hudSnapshot}
              isLobbyOpen={isRaceLobbyOpen}
              onSelectCharacter={handleSelectCharacterById}
              onSelectActiveSkill={setSelectedActiveSkillId}
              onSelectPassiveSkill={setSelectedPassiveSkillId}
              onStartRace={() => {
                setIsRaceLobbyOpen(false);
                setRaceSessionKey((k) => k + 1);
              }}
              onRestartRace={() => {
                setIsRaceLobbyOpen(false);
                setRaceSessionKey((k) => k + 1);
              }}
              onOpenLobby={() => setIsRaceLobbyOpen(true)}
              onOpenGitHub={() => setIsGitHubModalOpen(true)}
              onSwitchToStudio={() => setAppMode('studio')}
              onTriggerAction={handleTriggerRaceAction}
              onJoystickChange={handleJoystickChange}
            />
          </>
        ) : (
          <>
            {/* Floating Game-Style Top Bar in 3D Studio Mode */}
            <div className="pointer-events-none absolute top-4 inset-x-5 z-20 flex items-start justify-between gap-4">
              <div className="pointer-events-auto relative group bg-[#2B2118]/95 text-[#FFFDF9] border-3 border-[#1A130D] border-b-6 rounded-3xl px-4 py-2.5 shadow-xl flex items-center gap-3 cursor-help">
                <span
                  className="w-6 h-6 rounded-xl border-2 border-[#FFFDF9] shrink-0"
                  style={{ backgroundColor: selectedCharacter.primaryHex }}
                />
                <div>
                  <h1 className="text-lg font-black tracking-wide text-[#FDE047] leading-none">
                    {showAllLineup
                      ? 'ALL 16 PALS'
                      : `#${formattedNumber} ${selectedCharacter.shortName.toUpperCase()}`}
                  </h1>
                  <p className="text-[11px] font-bold text-[#F3E8D6] mt-0.5">
                    {activePoseSpec.label}
                  </p>
                </div>

                {/* Hover Tooltip for Character Info */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 z-30 w-60 bg-[#2B2118] text-[#FFFDF9] border-2 border-[#FDE047] rounded-2xl p-3 shadow-xl text-xs">
                  <div className="font-black text-[#FDE047]">
                    {selectedCharacter.name}
                  </div>
                  <div className="text-[11px] text-[#E5D9C5] mt-1">
                    {selectedCharacter.personality} · [Q]{' '}
                    {ACTIVE_SKILLS[selectedCharacter.activeSkillId].name} · [Auto]{' '}
                    {PASSIVE_SKILLS[selectedCharacter.passiveSkillId].name}
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                {ROW_GROUPS.map((grp) => (
                  <button
                    key={grp.row}
                    type="button"
                    onClick={() => handleSelectCharacter(grp.startIndex)}
                    title={grp.label}
                    className={`hidden sm:flex h-11 px-3 rounded-2xl border-3 border-b-6 text-xs font-black items-center transition-all ${
                      selectedCharacter.row === grp.row && !showAllLineup
                        ? 'bg-[#F59E0B] text-[#2B2118] border-[#2B2118]'
                        : 'bg-[#FFFDF9] text-[#2B2118] border-[#2B2118] hover:bg-[#FEF3C7]'
                    }`}
                  >
                    R{grp.row}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowReferenceModal(true)}
                  title="Concept Reference Sheet"
                  className="h-11 px-3.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-xs font-black shadow-lg"
                >
                  SHEET
                </button>

                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(true)}
                  title="Git Agent Hub"
                  className="w-11 h-11 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#2B2118] border-3 border-[#2B2118] border-b-6 flex items-center justify-center shadow-lg"
                >
                  <FolderGit2 className="w-5 h-5 text-[#C86D3B]" />
                </button>

                <button
                  type="button"
                  onClick={() => setAppMode('race')}
                  className="h-11 px-4 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#2B2118] border-b-6 text-sm font-black shadow-lg"
                >
                  RACE!
                </button>
              </div>
            </div>

            {/* Three.js Studio Canvas */}
            <ChibiStageCanvas
              selectedIndex={selectedIndex}
              sliderPosition={sliderValue}
              pose={pose}
              speedMultiplier={speedMultiplier}
              bounceIntensity={bounceIntensity}
              showAllLineup={showAllLineup}
              wireframe={wireframe}
              autoTurntable={autoTurntable}
              pokeTriggerCount={pokeTriggerCount}
              onSelectCharacter={handleSelectCharacter}
              onPokeCharacter={handleTriggerPoke}
            />

            {/* Edge-Pinned Bottom Control Dock */}
            <ControlDock
              selectedCharacter={selectedCharacter}
              selectedIndex={selectedIndex}
              sliderValue={sliderValue}
              pose={pose}
              speedMultiplier={speedMultiplier}
              bounceIntensity={bounceIntensity}
              showAllLineup={showAllLineup}
              wireframe={wireframe}
              autoTurntable={autoTurntable}
              isCollapsed={isDockCollapsed}
              onSelectCharacter={handleSelectCharacter}
              onScrubSlider={handleScrubSlider}
              onCommitSlider={handleCommitSlider}
              onSelectPose={setPose}
              onChangeSpeed={setSpeedMultiplier}
              onChangeBounce={setBounceIntensity}
              onToggleLineup={() => setShowAllLineup((prev) => !prev)}
              onToggleWireframe={() => setWireframe((prev) => !prev)}
              onToggleTurntable={() => setAutoTurntable((prev) => !prev)}
              onTriggerPoke={handleTriggerPoke}
              onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
            />
          </>
        )}
      </main>

      {/* Multi-Agent Git Hub Inspector Modal */}
      <GitAgentHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Reference Sheet Comparison Dialog */}
      {showReferenceModal && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reference-dialog-title"
        >
          <div className="bg-[#FFFDF9] border border-[#E5D9C5] rounded-2xl max-w-2xl w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE3D2]">
              <div>
                <h2
                  id="reference-dialog-title"
                  className="text-base font-bold text-[#2B2118]"
                >
                  Original Concept Sheet — Complete 16-Character Collection (Rows 01–04)
                </h2>
                <p className="text-xs text-[#7D6854]">
                  Click any character below to select it for Party Race or Studio Showcase
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReferenceModal(false)}
                className="p-1.5 rounded-lg text-[#5C4938] hover:bg-[#F5EDE0] hover:text-[#2B2118]"
                aria-label="Close Reference Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl overflow-hidden border border-[#E5D9C5] bg-[#FAF3E8]">
              <img
                src="/assets/game/banners/race_crest_banner.png"
                alt="16 Chibi Block Animals Collection Banner"
                referrerPolicy="no-referrer"
                className="w-full max-h-[54vh] object-contain mx-auto"
              />
            </div>

            <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => {
                    handleSelectCharacter(char.index);
                    setShowReferenceModal(false);
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors truncate ${
                    char.index === selectedIndex
                      ? 'bg-[#2B2118] text-white border-[#2B2118]'
                      : 'bg-[#F8F2E8] text-[#5C4938] border-[#E5D9C5] hover:bg-[#EFE5D5]'
                  }`}
                >
                  {char.index + 1}. {char.shortName}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#5C4938]">
              <span>All 16 models built 100% procedurally in Three.js</span>
              <button
                type="button"
                onClick={() => setShowReferenceModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#2B2118] text-white font-semibold hover:bg-[#423326]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
