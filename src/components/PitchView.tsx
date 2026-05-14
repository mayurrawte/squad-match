import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { QrModal } from './QrModal';
import { buildMatchUrl, encodeMatchPayload, shareNative } from '../lib/share';
import type { Match } from '../types';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Team, Player, Position } from '../types';
import {
  FORMATIONS,
  FormationSlot,
  LineRole,
  pickFormation,
  availableFormations,
} from '../lib/formations';
import { getInitials } from '../lib/initials';

// Map Position (FWD) → LineRole (ATT)
function positionMatchesRole(pos: Position, role: LineRole): boolean {
  if (pos === 'FWD' && role === 'ATT') return true;
  return (pos as string) === (role as string);
}

function isInPosition(player: Player, role: LineRole): boolean {
  if (!player.positions || player.positions.length === 0) return false;
  return player.positions.some(p => positionMatchesRole(p, role));
}

/** Greedy fill: for each role priority [GK,DEF,MID,ATT], pick best-fit player */
function buildGreedyState(team: Team, formationName: string, rotationOffset: number = 0): { slots: Array<{ playerId: string | null; isOutOfPosition: boolean }>; bench: string[] } {
  const formation = FORMATIONS[formationName];
  const slots: Array<{ playerId: string | null; isOutOfPosition: boolean }> = formation.slots.map(() => ({ playerId: null, isOutOfPosition: false }));
  const unplaced = [...team.players];

  const rolePriority: LineRole[] = ['GK', 'DEF', 'MID', 'ATT'];

  // Pass 1: fill tagged players (primary → secondary/tertiary)
  for (const role of rolePriority) {
    const roleSlotIndices = formation.slots
      .map((slot, i) => ({ slot, i }))
      .filter(({ slot }) => slot.role === role)
      .map(({ i }) => i);

    for (const si of roleSlotIndices) {
      if (unplaced.length === 0) break;

      // Priority 1: primary position matches (tagged players only)
      let pick = unplaced
        .filter(p => p.positions && p.positions.length > 0 && positionMatchesRole(p.positions[0], role))
        .sort((a, b) => b.skillRating - a.skillRating)[0];

      // Priority 2: secondary/tertiary matches (tagged players only)
      if (!pick) {
        pick = unplaced
          .filter(p => p.positions && p.positions.length > 1 && p.positions.slice(1).some(pos => positionMatchesRole(pos, role)))
          .sort((a, b) => b.skillRating - a.skillRating)[0];
      }

      // Priority 3: out-of-position tagged players (not wildcards)
      if (!pick) {
        pick = [...unplaced]
          .filter(p => p.positions && p.positions.length > 0)
          .sort((a, b) => b.skillRating - a.skillRating)[0];
      }

      if (pick) {
        slots[si].playerId = pick.id;
        slots[si].isOutOfPosition = !isInPosition(pick, role) && !(!pick.positions || pick.positions.length === 0);
        unplaced.splice(unplaced.indexOf(pick), 1);
      }
    }
  }

  // Pass 2: distribute wildcards (no positions set) with fair skill distribution
  // Slot priority for wildcards: ATT first (fun/impactful), then MID, DEF, GK last
  const wildcardSlotPriority: LineRole[] = ['ATT', 'MID', 'DEF', 'GK'];
  const emptySlotsByRole: Array<{ si: number; role: LineRole }> = [];
  for (const role of wildcardSlotPriority) {
    formation.slots.forEach((slot, i) => {
      if (slot.role === role && slots[i].playerId === null) {
        emptySlotsByRole.push({ si: i, role });
      }
    });
  }

  const wildcards = unplaced
    .filter(p => !p.positions || p.positions.length === 0)
    .sort((a, b) => b.skillRating - a.skillRating); // best skill first

  // Assign best wildcard → ATT, next → MID, etc.
  for (let wi = 0; wi < wildcards.length && wi < emptySlotsByRole.length; wi++) {
    const { si, role: _role } = emptySlotsByRole[wi];
    const pick = wildcards[wi];
    slots[si].playerId = pick.id;
    slots[si].isOutOfPosition = false; // wildcards are never "out of position"
    unplaced.splice(unplaced.indexOf(pick), 1);
  }

  // Pass 3: any remaining unplaced (tagged, still no slot) → highest skill, out of position
  for (const role of rolePriority) {
    const roleSlotIndices = formation.slots
      .map((slot, i) => ({ slot, i }))
      .filter(({ slot }) => slot.role === role)
      .map(({ i }) => i)
      .filter(i => slots[i].playerId === null);

    for (const si of roleSlotIndices) {
      if (unplaced.length === 0) break;
      const pick = [...unplaced].sort((a, b) => b.skillRating - a.skillRating)[0];
      if (pick) {
        slots[si].playerId = pick.id;
        slots[si].isOutOfPosition = !isInPosition(pick, role) && !(!pick.positions || pick.positions.length === 0);
        unplaced.splice(unplaced.indexOf(pick), 1);
      }
    }
  }

  // Apply rotation offset: rotate on-pitch slot assignments cyclically
  if (rotationOffset !== 0) {
    const filledSlotIndices = slots
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.playerId !== null)
      .map(({ i }) => i);
    const n = filledSlotIndices.length;
    if (n > 1) {
      const offset = ((rotationOffset % n) + n) % n;
      const playerIds = filledSlotIndices.map(i => slots[i].playerId);
      const rotated = [...playerIds.slice(offset), ...playerIds.slice(0, offset)];
      filledSlotIndices.forEach((si, wi) => {
        const pid = rotated[wi];
        slots[si].playerId = pid;
        if (pid) {
          const player = team.players.find(p => p.id === pid);
          const role = formation.slots[si].role;
          slots[si].isOutOfPosition = player
            ? computeIsOutOfPosition(player, role)
            : false;
        }
      });
    }
  }

  const bench = unplaced.map(p => p.id);
  return { slots, bench };
}

function computeIsOutOfPosition(player: Player, role: LineRole): boolean {
  if (!player.positions || player.positions.length === 0) return false;
  return !player.positions.some(p => positionMatchesRole(p, role));
}

// ── Team marker colors ───────────────────────────────────────────────────────
const TEAM_STROKE = ['#1E40AF', '#DC2626', '#16A34A', '#D97706']; // blue, red, green, amber
const TEAM_FILL   = ['rgba(30,64,175,0.12)', 'rgba(220,38,38,0.12)', 'rgba(22,163,74,0.12)', 'rgba(217,119,6,0.12)'];
const TEAM_TEXT   = ['#1E40AF', '#DC2626', '#16A34A', '#92400E'];

// ── pitch geometry ────────────────────────────────────────────────────────────
const VW = 900;
const VH = 560;
const M  = 28;
const HALF_W = (VW - M * 2) / 2;
const HALF_H = VH - M * 2;

function pitchX(normX: number, teamIndex: number): number {
  return M + (teamIndex === 0 ? normX * HALF_W : HALF_W + (1 - normX) * HALF_W);
}
function pitchY(normY: number): number {
  return M + normY * HALF_H;
}

function slotId(teamIdx: number, slotIdx: number) { return `slot-${teamIdx}-${slotIdx}`; }
function benchId(teamIdx: number, playerIdx: number) { return `bench-${teamIdx}-${playerIdx}`; }

interface SlotAssignment { playerId: string | null; isOutOfPosition: boolean; }
interface TeamPitchState { formation: string; slots: SlotAssignment[]; bench: string[]; }

function buildInitialState(team: Team, formationName: string, rotationOffset: number = 0): TeamPitchState {
  const { slots, bench } = buildGreedyState(team, formationName, rotationOffset);
  return { formation: formationName, slots, bench };
}

// ── SVG defs: marker wobble filter ───────────────────────────────────────────
const MarkerDefs: React.FC = () => (
  <defs>
    <filter id="marker" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
);

// ── Player marker (draggable) ─────────────────────────────────────────────────
interface MarkerProps {
  id: string;
  player: Player;
  cx: number;
  cy: number;
  r: number;
  teamIdx: number;
  isOutOfPosition?: boolean;
  onHover?: (id: string | null) => void;
  onSpotlight?: (id: string) => void;
  isSpotlit?: boolean;
  isDimmed?: boolean;
  isDragActive?: boolean;
  hoveredPlayerId?: string | null;
  hasBibs?: boolean;
}

const PlayerMarker: React.FC<MarkerProps> = ({
  id, player, cx, cy, r, teamIdx, isOutOfPosition,
  onHover, onSpotlight, isSpotlit, isDimmed, isDragActive, hoveredPlayerId,
  hasBibs,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  const initials = getInitials(player.name);
  const stroke = TEAM_STROKE[teamIdx] ?? '#1A1A1A';
  const fill   = TEAM_FILL[teamIdx]   ?? 'rgba(0,0,0,0.08)';
  const tcolor = TEAM_TEXT[teamIdx]   ?? '#1A1A1A';
  const posLabel = player.positions?.map(p => p.toLowerCase()).join('·') ?? '';

  const opacity = isDimmed ? 0.35 : (isDragging ? 0.4 : 1);
  const scale = isSpotlit ? 1.15 : 1;

  return (
    <g
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', opacity, transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px` }}
      onMouseEnter={() => { if (!isDragActive) onHover?.(player.id); }}
      onMouseLeave={() => onHover?.(null)}
      onClick={(e) => { e.stopPropagation(); onSpotlight?.(player.id); }}
    >
      {/* Out-of-position dashed ring */}
      {isOutOfPosition && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#1A1A1A"
          strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} filter="url(#marker)" />
      )}
      {/* Bibs sash — yellow rect at bottom of marker */}
      {hasBibs && (
        <rect
          x={cx - r} y={cy + r * 0.35}
          width={r * 2} height={r * 0.65}
          fill="#FACC15" opacity={0.8}
          filter="url(#marker)"
          clipPath={`circle(${r}px at 0px ${-(r * 0.35)}px)`}
        />
      )}
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={hasBibs ? '#FACC15' : stroke}
        strokeWidth={hasBibs ? 3 : 2.5} strokeLinecap="round" filter="url(#marker)" opacity={0.92} />
      {/* Initials */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontFamily="'Kalam', cursive" fontWeight="700" fontSize={r * 0.62} fill={tcolor}>
        {initials}
      </text>
      {/* Skill number below */}
      <text x={cx} y={cy + r + 9} textAnchor="middle" dominantBaseline="middle"
        fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize={9} fill={tcolor} opacity={0.8}>
        {player.skillRating}
      </text>
      {/* Name label */}
      <text x={cx} y={cy + r + 19} textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Caveat', cursive" fontSize={10} fill="#1A1A1A" opacity={0.8}>
        {player.name.slice(0, 5).toLowerCase()}
      </text>
      {isOutOfPosition && (
        <text x={cx} y={cy + r + 29} textAnchor="middle" dominantBaseline="middle"
          fontFamily="'Caveat', cursive" fontStyle="italic" fontSize={9} fill="#1A1A1A" opacity={0.55}>
          out of pos
        </text>
      )}

      {/* Tooltip via foreignObject — desktop hover only */}
      {hoveredPlayerId === player.id && !isDragActive && (
        <foreignObject
          x={cx - 68} y={cy - r - 74}
          width={136} height={70}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div
            style={{
              background: '#FBFAF2',
              border: '1.5px solid #1A1A1A',
              padding: '0.35rem 0.55rem',
              transform: 'rotate(-0.5deg)',
              fontFamily: "'Caveat', cursive",
              fontSize: '11px',
              color: '#1A1A1A',
              lineHeight: 1.45,
              boxShadow: '1px 1px 0 rgba(26,26,26,0.12)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: '12px', textTransform: 'lowercase' }}>
              {player.name}
            </div>
            <div style={{ opacity: 0.75 }}>
              {posLabel || 'no pos'} · skill: {player.skillRating} · W{player.wins} P{player.matchesPlayed}
            </div>
            {isOutOfPosition && (
              <div style={{ fontStyle: 'italic', opacity: 0.65 }}>out of position →</div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

// ── Slot (droppable target) ───────────────────────────────────────────────────
interface SlotProps { id: string; cx: number; cy: number; r: number; role: string; isEmpty: boolean; isDragActive?: boolean; }

const PitchSlot: React.FC<SlotProps> = ({ id, cx, cy, r, isEmpty, isDragActive }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <g ref={setNodeRef}>
      {isEmpty && (
        <>
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={isOver ? '#1E40AF' : '#1A1A1A'}
            strokeWidth={isOver ? 2 : 1.2}
            strokeDasharray={isOver ? '0' : '5 3'}
            opacity={isOver ? 0.8 : isDragActive ? 0.55 : 0.3}
            filter="url(#marker)"
          />
          {isDragActive && !isOver && (
            <text
              x={cx} y={cy + r + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'Caveat', cursive"
              fontSize={9}
              fill="#1A1A1A"
              opacity={0.45}
            >
              ↓
            </text>
          )}
        </>
      )}
      {!isEmpty && isOver && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#1E40AF" strokeWidth={2} />
      )}
    </g>
  );
};

// ── Pitch markings (hand-drawn) ───────────────────────────────────────────────
const PitchMarkings: React.FC = () => {
  const stroke = '#1A1A1A';
  const sw = 2.8;
  const op = 0.88;

  const left   = M;
  const right  = VW - M;
  const top    = M;
  const bottom = VH - M;
  const midX   = VW / 2;
  const midY   = (top + bottom) / 2;
  const totalH = bottom - top;
  const totalW = right - left;

  const penW    = totalW * 0.157;
  const penH    = totalH * 0.593;
  const sixW    = totalW * 0.052;
  const sixH    = totalH * 0.269;
  const centerR = totalH * 0.147;
  const penSpotX = left + totalW * 0.113;
  const cornerR  = totalH * 0.013;

  return (
    <g stroke={stroke} strokeWidth={sw} fill="none" opacity={op}
      strokeLinecap="round" strokeLinejoin="round" filter="url(#marker)">
      <rect x={left} y={top} width={totalW} height={totalH} />
      <line x1={midX} y1={top} x2={midX} y2={bottom} />
      <circle cx={midX} cy={midY} r={centerR} />
      <circle cx={midX} cy={midY} r={3} fill={stroke} />
      <rect x={left}         y={midY - penH / 2} width={penW} height={penH} />
      <rect x={left}         y={midY - sixH / 2} width={sixW} height={sixH} />
      <circle cx={penSpotX}  cy={midY} r={3} fill={stroke} />
      <rect x={right - penW} y={midY - penH / 2} width={penW} height={penH} />
      <rect x={right - sixW} y={midY - sixH / 2} width={sixW} height={sixH} />
      <circle cx={right - penSpotX + left} cy={midY} r={3} fill={stroke} />
      <path d={`M ${left + cornerR * 3} ${top} A ${cornerR * 3} ${cornerR * 3} 0 0 0 ${left} ${top + cornerR * 3}`} />
      <path d={`M ${left} ${bottom - cornerR * 3} A ${cornerR * 3} ${cornerR * 3} 0 0 0 ${left + cornerR * 3} ${bottom}`} />
      <path d={`M ${right - cornerR * 3} ${top} A ${cornerR * 3} ${cornerR * 3} 0 0 0 ${right} ${top + cornerR * 3}`} />
      <path d={`M ${right} ${bottom - cornerR * 3} A ${cornerR * 3} ${cornerR * 3} 0 0 0 ${right - cornerR * 3} ${bottom}`} />
    </g>
  );
};

// ── Tactical annotations ──────────────────────────────────────────────────────
interface TacticalAnnotationsProps {
  teams: Team[];
  pitchStates: TeamPitchState[];
}

function getLineSkill(teamIdx: number, role: string, state: TeamPitchState, team: Team): number {
  const formation = FORMATIONS[state.formation];
  const pMap = new Map(team.players.map(p => [p.id, p]));
  let total = 0;
  let count = 0;
  formation.slots.forEach((slot, i) => {
    if (slot.role === role && state.slots[i]?.playerId) {
      const p = pMap.get(state.slots[i].playerId!);
      if (p) { total += p.skillRating; count++; }
    }
  });
  return count > 0 ? total / count : 0;
}

function totalSkill(state: TeamPitchState, team: Team): number {
  const pMap = new Map(team.players.map(p => [p.id, p]));
  let total = 0;
  state.slots.forEach(sl => {
    if (sl.playerId) {
      const p = pMap.get(sl.playerId);
      if (p) total += p.skillRating;
    }
  });
  return total;
}

const TacticalAnnotations: React.FC<TacticalAnnotationsProps> = ({ teams, pitchStates }) => {
  if (teams.length < 2) return null;

  const midX = VW / 2;
  const midY = VH / 2;

  const team0AttSkill  = getLineSkill(0, 'ATT',  pitchStates[0], teams[0]);
  const team1DefSkill  = getLineSkill(1, 'DEF',  pitchStates[1], teams[1]);
  const total0 = totalSkill(pitchStates[0], teams[0]);
  const total1 = totalSkill(pitchStates[1], teams[1]);
  const skillGap = total0 + total1 > 0
    ? Math.abs(total0 - total1) / Math.max(total0, total1)
    : 0;
  const weakerTeamIdx = total0 < total1 ? 0 : 1;

  return (
    <g fontFamily="'Caveat', cursive" fontSize="13" filter="url(#marker)">
      {/* Decorative top-left label: "today's match" */}
      <text
        x={M + 6} y={M + 14}
        fill="#1A1A1A" opacity={0.55} fontSize="12"
        transform="rotate(-2, 34, 42)"
      >
        today's match
      </text>

      {/* If Team A has stronger ATT: press-high arrow */}
      {team0AttSkill > 5 && (
        <g opacity={0.65}>
          <path
            d={`M ${midX - 60} ${midY - 20} Q ${midX - 30} ${midY - 60} ${midX + 40} ${midY - 30}`}
            stroke="#1E40AF" strokeWidth="2" fill="none" strokeLinecap="round"
            markerEnd="url(#arrow-blue)"
          />
          <text x={midX - 55} y={midY - 38} fill="#1E40AF" fontSize="11" transform="rotate(-6)">
            press high
          </text>
        </g>
      )}

      {/* If Team B has strong DEF: deep line */}
      {team1DefSkill > 5.5 && (
        <g opacity={0.6}>
          <line
            x1={midX + 80} y1={midY - 60}
            x2={midX + 80} y2={midY + 60}
            stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"
          />
          <text x={midX + 82} y={midY + 78} fill="#DC2626" fontSize="11" transform="rotate(90, ${midX+82}, ${midY+78})">
            deep line
          </text>
        </g>
      )}

      {/* Skill gap annotation */}
      {skillGap > 0.15 && (
        <g opacity={0.6}>
          <text
            x={weakerTeamIdx === 0 ? M + HALF_W * 0.4 : M + HALF_W + HALF_W * 0.4}
            y={VH - M - 8}
            fill="#1A1A1A" fontSize="12"
            transform={`rotate(-3)`}
          >
            tough match
          </text>
        </g>
      )}

      {/* Arrow marker defs */}
      <defs>
        <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#1E40AF" opacity="0.7" />
        </marker>
      </defs>
    </g>
  );
};

// ── Formation selector ────────────────────────────────────────────────────────
interface FormationSelectorProps {
  playerCount: number;
  current: string;
  teamIdx: number;
  onChange: (f: string) => void;
}

const FormationSelector: React.FC<FormationSelectorProps> = ({ playerCount, current, teamIdx, onChange }) => {
  const options = availableFormations(playerCount);
  const color = TEAM_STROKE[teamIdx] ?? '#1A1A1A';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map(f => {
        const active = f === current;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className="px-2 py-0.5 text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              border: `1.5px solid ${active ? color : 'var(--color-line)'}`,
              backgroundColor: active ? color : 'transparent',
              color: active ? '#fff' : 'var(--color-ink-soft)',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
};

// ── Skill heatmap bar ─────────────────────────────────────────────────────────
interface SkillBarProps {
  label: string;
  value: number;
  max: number;
  teamIdx: number;
}

const SkillBar: React.FC<SkillBarProps> = ({ label, value, max, teamIdx }) => {
  const pct = max > 0 ? value / max : 0;
  const color = TEAM_STROKE[teamIdx] ?? '#1A1A1A';
  return (
    <div className="mb-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.75rem', color: 'var(--color-ink-soft)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-ink-soft)' }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 6, backgroundColor: 'var(--color-line)', position: 'relative', borderRadius: 0 }}>
        <div
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: color,
            opacity: 0.75,
            borderRadius: 0,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

// ── Scout card ────────────────────────────────────────────────────────────────
interface ScoutCardProps { player: Player; onClose: () => void; }

const ScoutCard: React.FC<ScoutCardProps> = ({ player, onClose }) => {
  const winRate = player.matchesPlayed > 0
    ? Math.round((player.wins / player.matchesPlayed) * 100)
    : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        background: '#FBFAF2',
        border: '1.5px solid #1A1A1A',
        padding: '0.75rem 1rem',
        marginTop: '0.5rem',
        transform: 'rotate(-0.5deg)',
        maxWidth: 320,
        cursor: 'pointer',
        boxShadow: '2px 2px 0 rgba(26,26,26,0.1)',
        position: 'relative',
      }}
    >
      <div style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A', textTransform: 'lowercase', marginBottom: '0.35rem' }}>
        {player.name}
      </div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: '0.9rem', color: '#1A1A1A', opacity: 0.75, lineHeight: 1.5 }}>
        <div>positions: {player.positions?.map(p => p.toLowerCase()).join(' · ') || '—'}</div>
        <div>skill: {player.skillRating} · wins: {player.wins} · played: {player.matchesPlayed}</div>
        <div>win rate: {winRate}%</div>
      </div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: '0.72rem', color: '#1A1A1A', opacity: 0.4, marginTop: '0.3rem', fontStyle: 'italic' }}>
        click to dismiss
      </div>
    </motion.div>
  );
};

// ── Preview totals helper ─────────────────────────────────────────────────────
function previewTotals(
  pitchStates: TeamPitchState[],
  teams: Team[],
  activeId: string | null,
  playerById: Map<string, Player>,
): [number | null, number | null] {
  if (!activeId) return [null, null];

  const draggedPlayer = playerById.get(activeId);
  if (!draggedPlayer) return [null, null];

  // Find source team
  let srcTeamIdx = -1;
  for (let ti = 0; ti < pitchStates.length; ti++) {
    const state = pitchStates[ti];
    if (state.slots.some(s => s.playerId === activeId) || state.bench.includes(activeId)) {
      srcTeamIdx = ti;
      break;
    }
  }
  if (srcTeamIdx === -1) return [null, null];

  // Compute totals with active player removed from source
  const totals = pitchStates.map((state, ti) => {
    const team = teams[ti];
    return totalSkill(state, team);
  });

  // Remove from source
  totals[srcTeamIdx] -= draggedPlayer.skillRating;

  return [totals[0] ?? null, totals[1] ?? null];
}

// ── Main PitchView ────────────────────────────────────────────────────────────
interface PitchViewProps {
  teams: Team[];
  onTeamsChange: (teams: Team[]) => void;
  bibsTeam?: 0 | 1 | null;
  match?: Match;
}

export const PitchView: React.FC<PitchViewProps> = ({ teams, onTeamsChange, bibsTeam = null, match }) => {
  const firstTwo = teams.slice(0, 2);

  const [pitchStates, setPitchStates] = useState<TeamPitchState[]>(() =>
    firstTwo.map((team) => {
      const f = pickFormation(team.players.length);
      return buildInitialState(team, f);
    })
  );

  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rotationOffsets, setRotationOffsets] = useState<number[]>(() => firstTwo.map(() => 0));
  // Track whether the hint label has been dismissed (first click hides it)
  const [hintDismissed, setHintDismissed] = useState<boolean[]>(() => firstTwo.map(() => false));
  // Ref for tap-and-hold reset timer per team
  const holdTimers = useRef<Array<ReturnType<typeof setTimeout> | null>>(firstTwo.map(() => null));
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const playerById = new Map<string, Player>();
  teams.forEach(t => t.players.forEach(p => playerById.set(p.id, p)));

  function resolvePlayer(id: string): { player: Player; teamIdx: number; isBench: boolean; idx: number } | null {
    for (let ti = 0; ti < pitchStates.length; ti++) {
      const state = pitchStates[ti];
      for (let si = 0; si < state.slots.length; si++) {
        if (state.slots[si].playerId === id) {
          const player = playerById.get(id);
          if (player) return { player, teamIdx: ti, isBench: false, idx: si };
        }
      }
      const bi = state.bench.indexOf(id);
      if (bi >= 0) {
        const player = playerById.get(id);
        if (player) return { player, teamIdx: ti, isBench: true, idx: bi };
      }
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const newStates = pitchStates.map(s => ({
      ...s,
      slots: s.slots.map(sl => ({ ...sl })),
      bench: [...s.bench],
    }));

    const src = resolvePlayer(draggedId);
    if (!src) return;

    if (overId.startsWith('slot-')) {
      const [, tiStr, siStr] = overId.split('-');
      const dstTeamIdx = parseInt(tiStr);
      const dstSlotIdx = parseInt(siStr);
      const dstSlot = newStates[dstTeamIdx].slots[dstSlotIdx];
      const existingId = dstSlot.playerId;
      const dstFormation = FORMATIONS[newStates[dstTeamIdx].formation];
      const dstSlotRole = dstFormation.slots[dstSlotIdx].role;
      const draggedPlayer = playerById.get(draggedId);

      if (!src.isBench) {
        newStates[src.teamIdx].slots[src.idx].playerId = null;
        newStates[src.teamIdx].slots[src.idx].isOutOfPosition = false;
      } else {
        newStates[src.teamIdx].bench.splice(newStates[src.teamIdx].bench.indexOf(draggedId), 1);
      }

      newStates[dstTeamIdx].slots[dstSlotIdx].playerId = draggedId;
      newStates[dstTeamIdx].slots[dstSlotIdx].isOutOfPosition = draggedPlayer
        ? computeIsOutOfPosition(draggedPlayer, dstSlotRole)
        : false;

      if (existingId) {
        if (!src.isBench) {
          const srcFormation = FORMATIONS[newStates[src.teamIdx].formation];
          const srcSlotRole = srcFormation.slots[src.idx].role;
          const existingPlayer = playerById.get(existingId);
          newStates[src.teamIdx].slots[src.idx].playerId = existingId;
          newStates[src.teamIdx].slots[src.idx].isOutOfPosition = existingPlayer
            ? computeIsOutOfPosition(existingPlayer, srcSlotRole)
            : false;
        } else {
          newStates[src.teamIdx].bench.push(existingId);
        }
      }
    } else if (overId.startsWith('bench-')) {
      const [, tiStr] = overId.split('-');
      const dstTeamIdx = parseInt(tiStr);
      if (!src.isBench) newStates[src.teamIdx].slots[src.idx].playerId = null;
      else newStates[src.teamIdx].bench.splice(newStates[src.teamIdx].bench.indexOf(draggedId), 1);
      newStates[dstTeamIdx].bench.push(draggedId);
    }

    setPitchStates(newStates);

    const updatedTeams = teams.map((team, ti) => {
      if (ti >= firstTwo.length) return team;
      const state = newStates[ti];
      const slotPlayers = state.slots
        .map(s => (s.playerId ? playerById.get(s.playerId) : null))
        .filter(Boolean) as Player[];
      const benchPlayers = state.bench
        .map(id => playerById.get(id))
        .filter(Boolean) as Player[];
      const allPlayers = [...slotPlayers, ...benchPlayers];
      return {
        ...team,
        players: allPlayers,
        averageSkill: allPlayers.length > 0
          ? Math.round((allPlayers.reduce((s, p) => s + p.skillRating, 0) / allPlayers.length) * 10) / 10
          : 0,
      };
    });
    onTeamsChange(updatedTeams);
  }

  function handleFormationChange(teamIdx: number, newFormation: string) {
    const team = firstTwo[teamIdx];
    // Rebuild with all players (on-pitch + bench) for greedy re-placement
    const state = pitchStates[teamIdx];
    const allPlayerIds = [
      ...state.slots.map(s => s.playerId).filter(Boolean) as string[],
      ...state.bench,
    ];
    const allPlayers = allPlayerIds.map(id => playerById.get(id)).filter(Boolean) as Player[];
    const virtualTeam = { ...team, players: allPlayers };
    // Reset rotation offset when formation changes
    const newOffsets = [...rotationOffsets];
    newOffsets[teamIdx] = 0;
    setRotationOffsets(newOffsets);
    const updated = buildInitialState(virtualTeam, newFormation, 0);
    setPitchStates(prev => prev.map((s, i) => (i === teamIdx ? updated : s)));
  }

  function handleRotate(teamIdx: number) {
    const newOffsets = [...rotationOffsets];
    newOffsets[teamIdx] = newOffsets[teamIdx] + 1;
    setRotationOffsets(newOffsets);

    const newHints = [...hintDismissed];
    newHints[teamIdx] = true;
    setHintDismissed(newHints);

    const team = firstTwo[teamIdx];
    const state = pitchStates[teamIdx];
    const allPlayerIds = [
      ...state.slots.map(s => s.playerId).filter(Boolean) as string[],
      ...state.bench,
    ];
    const allPlayers = allPlayerIds.map(id => playerById.get(id)).filter(Boolean) as Player[];
    const virtualTeam = { ...team, players: allPlayers };
    const updated = buildInitialState(virtualTeam, state.formation, newOffsets[teamIdx]);
    setPitchStates(prev => prev.map((s, i) => (i === teamIdx ? updated : s)));
  }

  function handleRotateReset(teamIdx: number) {
    const newOffsets = [...rotationOffsets];
    newOffsets[teamIdx] = 0;
    setRotationOffsets(newOffsets);

    const team = firstTwo[teamIdx];
    const state = pitchStates[teamIdx];
    const allPlayerIds = [
      ...state.slots.map(s => s.playerId).filter(Boolean) as string[],
      ...state.bench,
    ];
    const allPlayers = allPlayerIds.map(id => playerById.get(id)).filter(Boolean) as Player[];
    const virtualTeam = { ...team, players: allPlayers };
    const updated = buildInitialState(virtualTeam, state.formation, 0);
    setPitchStates(prev => prev.map((s, i) => (i === teamIdx ? updated : s)));
  }

  const MARKER_R = 18;

  function renderTeamOnPitch(teamIdx: number) {
    const state = pitchStates[teamIdx];
    const formation = FORMATIONS[state.formation];

    return formation.slots.map((slot: FormationSlot, si: number) => {
      const cx = pitchX(slot.x, teamIdx);
      const cy = pitchY(slot.y);
      const pid = state.slots[si]?.playerId;
      const player = pid ? playerById.get(pid) : null;
      const sid = slotId(teamIdx, si);

      const isOOP = state.slots[si]?.isOutOfPosition ?? false;

      return (
        <g key={sid}>
          <PitchSlot id={sid} cx={cx} cy={cy} r={MARKER_R} role={slot.role} isEmpty={!player} isDragActive={activeId !== null} />
          {player && (
            <motion.g
              key={`marker-${player.id}`}
              animate={{ x: cx, y: cy }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              style={{ originX: 0, originY: 0 }}
            >
              <PlayerMarker
                id={player.id}
                player={player}
                cx={0} cy={0} r={MARKER_R}
                teamIdx={teamIdx}
                isOutOfPosition={isOOP}
                onHover={setHoveredPlayerId}
                onSpotlight={(pid) => setSpotlightId(prev => prev === pid ? null : pid)}
                isSpotlit={spotlightId === player.id}
                isDimmed={spotlightId !== null && spotlightId !== player.id}
                isDragActive={activeId !== null}
                hoveredPlayerId={hoveredPlayerId}
                hasBibs={bibsTeam === teamIdx}
              />
            </motion.g>
          )}
        </g>
      );
    });
  }

  function renderBench(teamIdx: number) {
    const state = pitchStates[teamIdx];
    if (state.bench.length === 0) return null;
    const R = 14;
    const spacing = R * 2 + 10;
    const isRight = teamIdx === 1;

    return (
      <div
        key={`bench-${teamIdx}`}
        className="flex items-start gap-1 mt-2"
        style={{ justifyContent: isRight ? 'flex-end' : 'flex-start' }}
      >
        <span
          style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)', alignSelf: 'center', marginRight: 4 }}
        >
          bench
        </span>
        <svg width={state.bench.length * spacing + R} height={R * 2 + 20} viewBox={`0 0 ${state.bench.length * spacing + R} ${R * 2 + 20}`}>
          <MarkerDefs />
          {state.bench.map((pid, bi) => {
            const player = playerById.get(pid);
            if (!player) return null;
            const cx = R + bi * spacing;
            const cy = R + 1;
            const bid = benchId(teamIdx, bi);
            return (
              <g key={bid}>
                <PitchSlot id={bid} cx={cx} cy={cy} r={R} role="bench" isEmpty={false} isDragActive={activeId !== null} />
                <PlayerMarker
                  id={player.id}
                  player={player}
                  cx={cx} cy={cy} r={R}
                  teamIdx={teamIdx}
                  onHover={setHoveredPlayerId}
                  onSpotlight={(pid) => setSpotlightId(prev => prev === pid ? null : pid)}
                  isSpotlit={spotlightId === player.id}
                  isDimmed={spotlightId !== null && spotlightId !== player.id}
                  isDragActive={activeId !== null}
                  hoveredPlayerId={hoveredPlayerId}
                  hasBibs={bibsTeam === teamIdx}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  const formationLabel = firstTwo.map((t, i) => `${pitchStates[i]?.formation ?? ''}`).join(' vs ');
  const svgRef = useRef<SVGSVGElement>(null);

  const buildSvgAndPng = async (): Promise<{ svgBlob: Blob; pngBlob: Blob | null }> => {
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = svgEl ? serializer.serializeToString(svgEl) : '';
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });

    if (!svgEl) return { svgBlob, pngBlob: null };

    try {
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = VW * 2;
      canvas.height = VH * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      return await new Promise<{ svgBlob: Blob; pngBlob: Blob | null }>(resolve => {
        canvas.toBlob(blob => resolve({ svgBlob, pngBlob: blob }), 'image/png');
      });
    } catch {
      return { svgBlob, pngBlob: null };
    }
  };

  const handleCopyImage = async () => {
    setShareMenuOpen(false);
    const { svgBlob, pngBlob } = await buildSvgAndPng();
    if (pngBlob) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        toast.success('copied tactics →');
        return;
      } catch { /* fall through */ }
    }
    // fallback SVG download
    const a = document.createElement('a');
    a.href = URL.createObjectURL(svgBlob);
    a.download = 'tactics.svg';
    a.click();
    toast.success('saved tactics.svg');
  };

  const handleDownloadImage = async () => {
    setShareMenuOpen(false);
    const { svgBlob, pngBlob } = await buildSvgAndPng();
    if (pngBlob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = 'match-tactics.png';
      a.click();
      toast.success('saved tactics.png');
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(svgBlob);
      a.download = 'tactics.svg';
      a.click();
      toast.success('saved tactics.svg');
    }
  };

  const handleShareQr = () => {
    setShareMenuOpen(false);
    if (match?.id) {
      setQrData(buildMatchUrl(match.id));
    } else {
      // Offline payload — build a synthetic match from current teams
      const offlineMatch: Match = {
        id: 'offline-' + Date.now(),
        name: formationLabel,
        teams: firstTwo,
        date: new Date(),
        isPublic: false,
        bibsTeam: bibsTeam,
      };
      setQrData(encodeMatchPayload(offlineMatch));
    }
  };

  const handleShareNative = async () => {
    setShareMenuOpen(false);
    const { pngBlob } = await buildSvgAndPng();
    if (!pngBlob) {
      toast.error('could not render image');
      return;
    }
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toLowerCase();
    const caption = `tactics · ${formationLabel.toLowerCase()} · ${dateStr}`;
    const matchUrl = match?.id ? buildMatchUrl(match.id) : undefined;
    const result = await shareNative({
      pngBlob,
      filename: 'match-tactics.png',
      title: 'match tactics',
      text: caption,
      url: matchUrl,
    });
    if (result === 'wa-fallback') {
      toast.success('opened whatsapp ↗');
    } else if (result === 'unsupported') {
      toast('share not supported — try copy image', { icon: '↓' });
    }
    // 'shared' — OS share sheet handles feedback
  };

  // Squad list for legend
  const teamAPlayers = firstTwo[0] ? pitchStates[0]?.slots
    .map(s => s.playerId ? playerById.get(s.playerId) : null)
    .filter(Boolean) as Player[] : [];
  const teamBPlayers = firstTwo[1] ? pitchStates[1]?.slots
    .map(s => s.playerId ? playerById.get(s.playerId) : null)
    .filter(Boolean) as Player[] : [];

  // Skill by line for heatmap
  const roleOrder: Array<'GK' | 'DEF' | 'MID' | 'ATT'> = ['GK', 'DEF', 'MID', 'ATT'];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Formation selectors + title */}
      <div className="flex justify-between items-start gap-4 mb-1">
        {firstTwo.map((team, ti) => (
          <div
            key={team.id}
            className="flex-1 flex flex-col gap-1.5"
            style={{ alignItems: ti === 0 ? 'flex-start' : 'flex-end' }}
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: TEAM_STROKE[ti],
                }}
              />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: TEAM_STROKE[ti], textTransform: 'lowercase' }}>
                {team.name}
              </span>
            </div>
            {/* Skill total with live drag preview */}
            {(() => {
              const [p0, p1] = previewTotals(pitchStates, firstTwo, activeId, playerById);
              const baseTot = totalSkill(pitchStates[ti], firstTwo[ti]);
              const previewTot = ti === 0 ? p0 : p1;
              const delta = previewTot !== null ? previewTot - baseTot : null;
              return (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-ink-soft)' }}>
                    total: {baseTot.toFixed(1)}
                  </span>
                  {delta !== null && delta !== 0 && (
                    <span style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: '0.8rem',
                      color: delta > 0 ? '#16A34A' : '#DC2626',
                    }}>
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center gap-2 flex-wrap">
              <FormationSelector
                playerCount={team.players.length}
                current={pitchStates[ti]?.formation}
                teamIdx={ti}
                onChange={f => handleFormationChange(ti, f)}
              />
              {/* Rotate button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <button
                  title="rotate everyone one spot"
                  onMouseDown={() => {
                    holdTimers.current[ti] = setTimeout(() => {
                      handleRotateReset(ti);
                      holdTimers.current[ti] = null;
                    }, 600);
                  }}
                  onMouseUp={() => {
                    if (holdTimers.current[ti] !== null) {
                      clearTimeout(holdTimers.current[ti]!);
                      holdTimers.current[ti] = null;
                      handleRotate(ti);
                    }
                  }}
                  onMouseLeave={() => {
                    if (holdTimers.current[ti] !== null) {
                      clearTimeout(holdTimers.current[ti]!);
                      holdTimers.current[ti] = null;
                    }
                  }}
                  style={{
                    fontFamily: "'Kalam', cursive",
                    fontSize: '0.8rem',
                    border: `1.5px solid ${TEAM_STROKE[ti]}`,
                    backgroundColor: 'transparent',
                    color: TEAM_STROKE[ti],
                    borderRadius: 2,
                    padding: '0 6px',
                    height: 22,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  <span>↻</span>
                  {rotationOffsets[ti] > 0 && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleRotateReset(ti); }}
                      title="click to reset rotation"
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: '0.72rem',
                        color: 'var(--color-ink-soft)',
                        cursor: 'pointer',
                      }}
                    >
                      {rotationOffsets[ti]}
                    </span>
                  )}
                </button>
                {!hintDismissed[ti] && (
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: '0.65rem',
                      color: 'var(--color-ink-soft)',
                      whiteSpace: 'nowrap',
                      opacity: 0.7,
                    }}
                  >
                    rotate everyone one spot
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pitch title + share */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-ink)', textTransform: 'lowercase' }}>
            today's match
          </span>
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginLeft: '0.6rem' }}>
            {formationLabel.toLowerCase()}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShareMenuOpen(prev => !prev)}
            style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '0.8rem',
              border: '1.5px solid var(--color-line)',
              backgroundColor: 'transparent',
              color: 'var(--color-ink-soft)',
              padding: '0.15rem 0.5rem',
              cursor: 'pointer',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ink-soft)'; }}
            title="share options"
          >
            share ↓
          </button>
          <AnimatePresence>
            {shareMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  backgroundColor: '#FBFAF2',
                  border: '1.5px solid #1A1A1A',
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                  zIndex: 100,
                  minWidth: 130,
                }}
              >
                {/* Primary action: native share */}
                <button
                  onClick={handleShareNative}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: "'Kalam', cursive",
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#FBFAF2',
                    backgroundColor: '#1A1A1A',
                    border: 'none',
                    borderBottom: '1.5px solid #1A1A1A',
                    padding: '0.4rem 0.65rem',
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
                >
                  share →
                </button>
                {/* Secondary options */}
                {[
                  { label: 'copy image', action: handleCopyImage },
                  { label: 'download image', action: handleDownloadImage },
                  { label: 'share via qr', action: handleShareQr },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: "'Caveat', cursive",
                      fontSize: '0.85rem',
                      color: '#1A1A1A',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #D8D9D0',
                      padding: '0.35rem 0.65rem',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F2F4F0')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SVG pitch */}
      <div style={{ border: '1.5px solid var(--color-line)', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: 'var(--color-pitch)' }}
          onClick={() => setSpotlightId(null)}
        >
          <MarkerDefs />
          <PitchMarkings />
          <TacticalAnnotations teams={firstTwo} pitchStates={pitchStates} />
          {/* Export overlay: formation + date */}
          <text
            x={VW / 2} y={VH - M + 12}
            textAnchor="middle"
            fontFamily="'Caveat', cursive"
            fontSize={11}
            fill="#1A1A1A"
            opacity={0.4}
          >
            {formationLabel.toLowerCase()} · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toLowerCase()}
          </text>
          {/* Team name labels on pitch */}
          {firstTwo.map((team, ti) => {
            const labelX = ti === 0
              ? M + HALF_W * 0.5
              : M + HALF_W + HALF_W * 0.5;
            return (
              <text
                key={team.id}
                x={labelX} y={M - 8}
                textAnchor="middle"
                fontFamily="'Caveat', cursive"
                fontSize={12}
                fill={TEAM_STROKE[ti]}
                opacity={0.5}
              >
                {team.name.toLowerCase().slice(0, 14)}
              </text>
            );
          })}
          {firstTwo.map((_, ti) => renderTeamOnPitch(ti))}
        </svg>
      </div>

      {/* Scout card for spotlight */}
      <AnimatePresence>
        {spotlightId && (() => {
          const p = playerById.get(spotlightId);
          return p ? (
            <ScoutCard
              key={spotlightId}
              player={p}
              onClose={() => setSpotlightId(null)}
            />
          ) : null;
        })()}
      </AnimatePresence>

      {/* Pitch caption */}
      <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)', marginTop: '0.25rem', transform: 'rotate(-0.3deg)', display: 'inline-block' }}>
        drag players to reposition. skill totals below.
      </p>

      {/* Bench rows */}
      <div className="flex justify-between mt-1">
        {firstTwo.map((_, ti) => (
          <div key={ti} className="flex-1">
            {renderBench(ti)}
          </div>
        ))}
      </div>

      {/* Squad list legend — two columns handwritten */}
      {(teamAPlayers.length > 0 || teamBPlayers.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-6" style={{ borderTop: '1px solid var(--color-line)', paddingTop: '0.75rem' }}>
          {firstTwo.map((team, ti) => {
            const players = ti === 0 ? teamAPlayers : teamBPlayers;
            const color = TEAM_STROKE[ti];
            return (
              <div key={team.id}>
                <div
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.85rem',
                    color,
                    fontWeight: 500,
                    marginBottom: '0.35rem',
                    textTransform: 'lowercase',
                  }}
                >
                  {team.name}
                </div>
                <ol className="space-y-0.5">
                  {players.map((p, idx) => (
                    <li key={p.id} className="flex items-baseline gap-1.5">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color, opacity: 0.7, minWidth: '1.2rem' }}>
                        {idx + 1}.
                      </span>
                      <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--color-ink)' }}>
                        {p.name.toLowerCase()}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-ink-soft)', marginLeft: 'auto' }}>
                        {p.skillRating}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill heatmap — hand-drawn bars */}
      {firstTwo.length >= 2 && (
        <div
          className="mt-4 p-3"
          style={{ border: '1px solid var(--color-line)', backgroundColor: 'var(--color-card)' }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-ink)', marginBottom: '0.6rem', textTransform: 'lowercase' }}>
            skill by line
          </div>
          <div className="grid grid-cols-2 gap-6">
            {firstTwo.map((team, ti) => {
              const state = pitchStates[ti];
              const formation = FORMATIONS[state.formation];
              const playerMap = new Map(team.players.map(p => [p.id, p]));

              const maxRoleSkill = 30; // normalise bars against ~max possible
              const rows = roleOrder.map(role => {
                const relevant = formation.slots
                  .map((slot, i) => ({ slot, assignment: state.slots[i] }))
                  .filter(({ slot }) => slot.role === role);
                if (!relevant.length) return null;
                let total = 0;
                relevant.forEach(({ assignment }) => {
                  if (assignment.playerId) {
                    const p = playerMap.get(assignment.playerId);
                    if (p) total += p.skillRating;
                  }
                });
                return { role, total };
              }).filter(Boolean) as Array<{ role: string; total: number }>;

              return (
                <div key={team.id}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: TEAM_STROKE[ti] }}
                    />
                    <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: TEAM_STROKE[ti], textTransform: 'lowercase' }}>
                      {team.name}
                    </span>
                  </div>
                  {rows.map(({ role, total }) => (
                    <SkillBar
                      key={role}
                      label={role.toLowerCase()}
                      value={total}
                      max={maxRoleSkill}
                      teamIdx={ti}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Modal */}
      <AnimatePresence>
        {qrData && (
          <QrModal
            key="pitch-qr"
            data={qrData}
            title={match?.id ? 'scan to view match' : 'scan to import teams'}
            onClose={() => setQrData(null)}
          />
        )}
      </AnimatePresence>
    </DndContext>
  );
};
