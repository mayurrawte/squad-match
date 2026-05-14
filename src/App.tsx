import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Homepage } from './components/Homepage';
import { PlayerCard } from './components/PlayerCard';
import { AddPlayerForm } from './components/AddPlayerForm';
import { TeamGenerator } from './components/TeamGenerator';
import { MatchCard } from './components/MatchCard';
import { CreateMatchModal } from './components/CreateMatchModal';
import { ScanQrModal } from './components/QrModal';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { Player, Team, Match } from './types';
import { updateMatch } from './lib/database';
import toast from 'react-hot-toast';

type SortKey = 'name-asc' | 'name-desc' | 'skill-desc' | 'skill-asc' | 'matches' | 'winpct';
type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD' | 'any';

function sortPlayers(players: Player[], key: SortKey): Player[] {
  const arr = [...players];
  const byName = (a: Player, b: Player) => a.name.localeCompare(b.name);
  switch (key) {
    case 'name-asc':  return arr.sort(byName);
    case 'name-desc': return arr.sort((a, b) => -byName(a, b));
    case 'skill-desc': return arr.sort((a, b) => b.skillRating - a.skillRating || byName(a, b));
    case 'skill-asc':  return arr.sort((a, b) => a.skillRating - b.skillRating || byName(a, b));
    case 'matches':    return arr.sort((a, b) => b.matchesPlayed - a.matchesPlayed || byName(a, b));
    case 'winpct': {
      const pct = (p: Player) => p.matchesPlayed > 0 ? p.wins / p.matchesPlayed : 0;
      return arr.sort((a, b) => pct(b) - pct(a) || byName(a, b));
    }
    default: return arr;
  }
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name-asc',   label: 'name ↑' },
  { value: 'name-desc',  label: 'name ↓' },
  { value: 'skill-desc', label: 'skill ↓' },
  { value: 'skill-asc',  label: 'skill ↑' },
  { value: 'matches',    label: 'matches' },
  { value: 'winpct',     label: 'win %' },
];

const POSITION_FILTERS: PositionFilter[] = ['all', 'GK', 'DEF', 'MID', 'FWD', 'any'];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);
  const [showScanQr, setShowScanQr] = useState(false);

  // Roster sort/filter/select state
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<PositionFilter>('all');
  const [skillMin, setSkillMin] = useState(1);
  const [skillMax, setSkillMax] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const {
    players,
    matches,
    loading: dataLoading,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addMatch,
    refresh
  } = useData(user?.id);

  // Esc clears selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIds(new Set());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Query-param match routing: ?match=<id>
  useEffect(() => {
    if (matches.length === 0) return; // wait until data is loaded
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    if (!matchId) return;
    const found = matches.find(m => m.id === matchId);
    if (found) {
      setActiveTab('matches');
    } else {
      toast.error('match not found');
    }
    // Clear query param
    history.replaceState(null, '', window.location.pathname);
  }, [matches]);

  const handleImportMatch = useCallback((importedMatch: Match) => {
    // Merge players from imported match into local roster (skip existing by id)
    const allImportedPlayers: Player[] = importedMatch.teams.flatMap(t => t.players);
    // Only add players not already in roster
    allImportedPlayers.forEach(p => {
      if (!players.find(existing => existing.id === p.id)) {
        // addPlayer expects the player — use existing hook
        // We can't easily call addPlayer for each, so we add via match data.
        // For now the match carries the player data within teams.
      }
    });
    addMatch(importedMatch);
    setActiveTab('matches');
    toast.success('imported match');
  }, [players, addMatch]);

  const handleDeletePlayer = (playerId: string) => {
    deletePlayer(playerId);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(playerId); return n; });
    toast.success('Player deleted successfully');
  };

  const handleCreateMatch = (teams: Team[]) => {
    setPendingTeams(teams);
    setShowCreateMatch(true);
  };

  const handleMatchCreated = (match: Match) => {
    addMatch(match);
    setActiveTab('matches');
    toast.success('Match created successfully!');
  };

  const handleUpdateMatch = async (matchId: string, winnerId?: string) => {
    try {
      if (user) {
        await updateMatch(matchId, { winnerId });
        await refresh();
        toast.success('Match result updated successfully!');
      } else {
        toast.error('Please sign in to update match results');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match result');
    }
  };

  const handleMatchTeamsChange = async (matchId: string, newTeams: Team[]) => {
    try {
      if (user) {
        await updateMatch(matchId, { teams: newTeams });
        await refresh();
        toast.success('Match teams updated successfully!');
      } else {
        toast.error('Please sign in to update match teams.');
      }
    } catch (error) {
      console.error('Error updating match teams:', error);
      toast.error('Failed to update match teams.');
    }
  };

  // Derived filtered + sorted player list
  const filteredPlayers = (() => {
    let list = sortPlayers(players, sortKey);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    if (posFilter !== 'all') {
      if (posFilter === 'any') {
        list = list.filter(p => !p.positions || p.positions.length === 0);
      } else {
        list = list.filter(p => p.positions?.includes(posFilter as 'GK' | 'DEF' | 'MID' | 'FWD'));
      }
    }
    list = list.filter(p => p.skillRating >= skillMin && p.skillRating <= skillMax);
    return list;
  })();

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPlayers.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredPlayers]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (checked) n.add(id); else n.delete(id);
      return n;
    });
  }, []);

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    ids.forEach(id => deletePlayer(id));
    setSelectedIds(new Set());
    toast.success(`Deleted ${ids.length} player${ids.length > 1 ? 's' : ''}`);
  };

  const handleBulkAddToMatch = () => {
    const selected = players.filter(p => selectedIds.has(p.id));
    if (selected.length < 2) {
      toast.error('Select at least 2 players');
      return;
    }
    // Split evenly into 2 teams as a pending pool
    const half = Math.ceil(selected.length / 2);
    const teamA: Team = {
      id: 'bulk-a-' + Date.now(),
      name: 'team a',
      players: selected.slice(0, half),
      averageSkill: Math.round(selected.slice(0, half).reduce((s, p) => s + p.skillRating, 0) / half * 10) / 10,
      color: '#1E40AF',
    };
    const teamB: Team = {
      id: 'bulk-b-' + Date.now(),
      name: 'team b',
      players: selected.slice(half),
      averageSkill: selected.slice(half).length > 0
        ? Math.round(selected.slice(half).reduce((s, p) => s + p.skillRating, 0) / selected.slice(half).length * 10) / 10
        : 0,
      color: '#DC2626',
    };
    setPendingTeams([teamA, teamB]);
    setShowCreateMatch(true);
  };

  const allVisibleSelected = filteredPlayers.length > 0 && filteredPlayers.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-whiteboard)' }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-line)', borderTopColor: 'var(--color-ink)' }} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Homepage onNavigate={setActiveTab} />;

      case 'players':
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="section-heading flex-1 mr-6">
                the squad
              </div>
              <AddPlayerForm onAdd={addPlayer} />
            </div>

            {players.length === 0 ? (
              <div className="py-10">
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.5deg)', display: 'inline-block' }}>
                  no players. add some.
                </p>
              </div>
            ) : (
              <div>
                {/* Search + filters */}
                <div className="space-y-2 mb-3">
                  {/* Search input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="find a player…"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1.5px solid var(--color-line)',
                      outline: 'none',
                      fontFamily: 'var(--font-hand)',
                      fontSize: '1rem',
                      color: 'var(--color-ink)',
                      padding: '0.3rem 0',
                    }}
                  />

                  {/* Position filter chips + skill range */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      {POSITION_FILTERS.map(f => (
                        <button
                          key={f}
                          onClick={() => setPosFilter(f)}
                          style={{
                            fontFamily: 'var(--font-hand)',
                            fontSize: '0.78rem',
                            padding: '0.1rem 0.45rem',
                            border: `1.5px solid ${posFilter === f ? 'var(--color-ink)' : 'var(--color-line)'}`,
                            backgroundColor: posFilter === f ? 'var(--color-ink)' : 'transparent',
                            color: posFilter === f ? '#fff' : 'var(--color-ink-soft)',
                            cursor: 'pointer',
                            borderRadius: 0,
                          }}
                        >
                          {f.toLowerCase()}
                        </button>
                      ))}
                    </div>

                    {/* Skill range */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)' }}>skill</span>
                      <input
                        type="number"
                        min={1} max={10} value={skillMin}
                        onChange={e => setSkillMin(Math.min(Number(e.target.value), skillMax))}
                        style={{
                          width: 32, fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                          border: 'none', borderBottom: '1px solid var(--color-line)',
                          background: 'transparent', color: 'var(--color-ink)', textAlign: 'center', outline: 'none',
                        }}
                      />
                      <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)' }}>–</span>
                      <input
                        type="number"
                        min={1} max={10} value={skillMax}
                        onChange={e => setSkillMax(Math.max(Number(e.target.value), skillMin))}
                        style={{
                          width: 32, fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                          border: 'none', borderBottom: '1px solid var(--color-line)',
                          background: 'transparent', color: 'var(--color-ink)', textAlign: 'center', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sort + select-all header row */}
                <div className="flex items-center gap-3 py-1.5 px-3" style={{ borderBottom: '1.5px solid var(--color-line)' }}>
                  {/* Select all checkbox */}
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    style={{ width: 14, height: 14, flexShrink: 0, accentColor: 'var(--color-blue)', cursor: 'pointer' }}
                    title="select all visible"
                  />

                  {someSelected ? (
                    /* Bulk action bar */
                    <div className="flex items-center gap-2 flex-1">
                      <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}>
                        {selectedIds.size} selected
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.55rem',
                          border: '1.5px solid var(--color-red)',
                          backgroundColor: 'transparent',
                          color: 'var(--color-red)',
                          cursor: 'pointer',
                          borderRadius: 0,
                        }}
                      >
                        delete ({selectedIds.size})
                      </button>
                      <button
                        onClick={handleBulkAddToMatch}
                        className="btn-marker"
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}
                      >
                        add to match
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        style={{ fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        esc
                      </button>
                    </div>
                  ) : (
                    /* Sort selector */
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest flex-1" style={{ color: 'var(--color-ink-soft)' }}>Player</span>
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest w-6 text-right" style={{ color: 'var(--color-ink-soft)' }}>Skill</span>
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest w-14 text-right hidden sm:block" style={{ color: 'var(--color-ink-soft)' }}>W·P</span>
                      <select
                        value={sortKey}
                        onChange={e => setSortKey(e.target.value as SortKey)}
                        style={{
                          fontFamily: 'var(--font-hand)',
                          fontSize: '0.75rem',
                          border: '1px solid var(--color-line)',
                          background: 'var(--color-card)',
                          color: 'var(--color-ink)',
                          padding: '0.1rem 0.3rem',
                          borderRadius: 0,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {SORT_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Count */}
                  <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)', flexShrink: 0 }}>
                    {filteredPlayers.length} of {players.length}
                  </span>
                </div>

                {filteredPlayers.length === 0 ? (
                  <div className="py-6 px-3">
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--color-ink-soft)' }}>
                      no matches for those filters.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredPlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        onUpdate={updatePlayer}
                        onDelete={handleDeletePlayer}
                        selected={selectedIds.has(player.id)}
                        onSelect={handleSelectOne}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </motion.div>
        );

      case 'teams':
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="section-heading">
              the teams
            </div>

            {players.length < 2 ? (
              <div className="py-10">
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.4deg)', display: 'inline-block' }}>
                  pick the squad first.
                </p>
              </div>
            ) : (
              <TeamGenerator
                players={players}
                onCreateMatch={handleCreateMatch}
              />
            )}
          </motion.div>
        );

      case 'matches':
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="section-heading">
              what we played
            </div>

            {matches.length === 0 ? (
              <div className="py-10">
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.4deg)', display: 'inline-block' }}>
                  no games yet. go play.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                <AnimatePresence>
                  {matches
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onUpdateMatch={handleUpdateMatch}
                        showUpdateButton={true}
                        onUpdateMatchTeams={handleMatchTeamsChange}
                      />
                    ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
        onScanQr={() => setShowScanQr(true)}
      >
        {renderContent()}
      </Layout>

      <CreateMatchModal
        isOpen={showCreateMatch}
        onClose={() => setShowCreateMatch(false)}
        teams={pendingTeams}
        onCreateMatch={handleMatchCreated}
      />

      <AnimatePresence>
        {showScanQr && (
          <ScanQrModal
            key="app-scan-qr"
            onClose={() => setShowScanQr(false)}
            onImportMatch={handleImportMatch}
          />
        )}
      </AnimatePresence>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;
