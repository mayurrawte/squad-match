import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Users, Star, Save, X, RotateCcw } from 'lucide-react';
import { Team, Player } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TeamEditorProps {
  teams: Team[];
  onTeamsUpdate: (teams: Team[]) => void;
  onClose: () => void;
}

export const TeamEditor: React.FC<TeamEditorProps> = ({
  teams,
  onTeamsUpdate,
  onClose,
}) => {
  const [editedTeams, setEditedTeams] = useState<Team[]>(JSON.parse(JSON.stringify(teams))); // Deep copy to avoid mutating original

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const recalculateTeamAverageSkills = (currentTeams: Team[]): Team[] => {
    return currentTeams.map(team => ({
      ...team,
      averageSkill: team.players.length > 0
        ? Math.round((team.players.reduce((sum, p) => sum + p.skillRating, 0) / team.players.length) * 10) / 10
        : 0,
    }));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeTeamId = active.data.current?.sortable?.containerId;
    const overTeamId = over.data.current?.sortable?.containerId || over.id;

    let newTeamsState: Team[] = editedTeams;

    if (activeTeamId === overTeamId) {
      // Intra-team reordering
      newTeamsState = editedTeams.map((team) => {
        if (team.id === activeTeamId) {
          const oldIndex = active.data.current?.sortable?.index;
          const newIndex = over.data.current?.sortable?.index;

          if (oldIndex !== undefined && newIndex !== undefined) {
            const reorderedPlayers = arrayMove(team.players, oldIndex, newIndex);
            console.log('Reordered players in team:', team.name, reorderedPlayers);
            return { ...team, players: reorderedPlayers };
          }
        }
        return team;
      });
    } else {
      // Inter-team moving or swapping
      const sourceTeam = editedTeams.find(team => team.id === activeTeamId);
      const destinationTeam = editedTeams.find(team => team.id === overTeamId);
      const draggedPlayer = sourceTeam?.players.find(p => p.id === active.id);

      if (sourceTeam && destinationTeam && draggedPlayer) {
        const overIsPlayer = over.data.current?.sortable?.items !== undefined;

        if (overIsPlayer) {
          // Scenario 2: Swapping players
          const targetPlayer = destinationTeam.players.find(p => p.id === over.id);
          if (targetPlayer) {
            const newSourcePlayers = sourceTeam.players.filter(p => p.id !== active.id).concat(targetPlayer);
            const newDestinationPlayers = destinationTeam.players.filter(p => p.id !== over.id).concat(draggedPlayer);

            console.log('Swapping players. Dragged:', draggedPlayer.name, 'Target:', targetPlayer.name);

            newTeamsState = editedTeams.map(team => {
              if (team.id === activeTeamId) return { ...team, players: newSourcePlayers };
              if (team.id === overTeamId) return { ...team, players: newDestinationPlayers };
              return team;
            });
          }
        } else {
          // Scenario 1: Moving player to a new team
          const newSourcePlayers = sourceTeam.players.filter(p => p.id !== active.id);
          const newDestinationPlayers = [...destinationTeam.players, draggedPlayer];
          console.log('Moving player', draggedPlayer.name, 'to team', destinationTeam.name);

          newTeamsState = editedTeams.map(team => {
            if (team.id === activeTeamId) return { ...team, players: newSourcePlayers };
            if (team.id === overTeamId) return { ...team, players: newDestinationPlayers };
            return team;
          });
        }
      }
    }
    setEditedTeams(recalculateTeamAverageSkills(newTeamsState));
  };

  const handleEditTeamName = (teamId: string, newName: string) => {
    setEditedTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  // This function is now effectively replaced by the logic in handleDragEnd
  // It can be removed or kept if it's used elsewhere, but for dnd-kit it's not directly used.
  const handleSwapPlayers = (player1: Player, team1Id: string, player2: Player, team2Id: string) => {
    const newTeams = editedTeams.map(team => {
      if (team.id === team1Id) {
        return {
          ...team,
          players: team.players.map(p => p.id === player1.id ? player2 : p),
        };
      } else if (team.id === team2Id) {
        return {
          ...team,
          players: team.players.map(p => p.id === player2.id ? player1 : p),
        };
      }
      return team;
    });

    // Recalculate average skills
    const updatedTeams = newTeams.map(team => ({
      ...team,
      averageSkill: team.players.length > 0
        ? Math.round((team.players.reduce((sum, p) => sum + p.skillRating, 0) / team.players.length) * 10) / 10
        : 0,
    }));

    setEditedTeams(updatedTeams);
  };

  const handleSave = () => {
    onTeamsUpdate(editedTeams);
    onClose();
  };

  const handleReset = () => {
    // Reset to the original teams passed in props, also deep copy
    setEditedTeams(JSON.parse(JSON.stringify(teams)));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowLeftRight className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Edit Teams</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                Drag and drop players between teams to rearrange them
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {editedTeams.map((team) => (
                <motion.div
                  key={team.id}
                  layout
                  className="border-2 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-blue-50"
                  style={{ borderColor: team.color }}
                >
                  <div className="mb-4 text-center">
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => handleEditTeamName(team.id, e.target.value)}
                      className="w-full text-lg font-semibold text-center border-b-2 border-gray-300 focus:border-purple-500 outline-none px-2 py-1 bg-transparent transition-colors"
                      style={{ color: team.color }}
                      placeholder="Team Name"
                    />
                    {/* Original h3 replaced by input
                    <h3 className="text-lg font-semibold" style={{ color: team.color }}>
                      {team.name}
                    </h3>
                    */}
                  <div className="text-sm text-gray-600 mt-2"> {/* Added mt-2 for spacing */}
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>Avg: {team.averageSkill}/10</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span>{team.players.length} players</span>
                    </div>
                  </div>
                </div>
                <SortableContext items={team.players.map(p => p.id)} strategy={sortableKeyboardCoordinates}>
                  <div className="space-y-2 min-h-[200px]">
                    <AnimatePresence>
                      {team.players.map((player) => {
                        const {
                          attributes,
                          listeners,
                          setNodeRef,
                          transform,
                          transition,
                          isDragging,
                        } = useSortable({ id: player.id });

                        const style = {
                          transform: CSS.Transform.toString(transform),
                          transition: transition || undefined, // Ensure transition is not null
                          opacity: isDragging ? 0.7 : 1,
                          zIndex: isDragging ? 100 : 'auto',
                        };

                        return (
                          <motion.div
                            ref={setNodeRef}
                            style={style}
                            {...attributes}
                            {...listeners}
                            key={player.id}
                            layout // Framer Motion layout animation
                            initial={{ opacity: 0, scale: 0.8 }} // Initial animation
                            animate={{ opacity: 1, scale: 1 }}   // Animate in
                            exit={{ opacity: 0, scale: 0.8 }}      // Animate out (via AnimatePresence)
                            className={`flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-all ${isDragging ? 'shadow-xl' : ''}`}
                          >
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {player.name}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-gray-600">
                                  {player.skillRating}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {team.players.length === 0 && (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm">Drop players here</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </motion.div>
            ))}
          </div>
        </DndContext>
          <div className="flex justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};