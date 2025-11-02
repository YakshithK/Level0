import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: "user" | "assistant";
  content: string;
  gameFiles?: GameFiles;
}

interface GameFiles {
  [key: string]: string;
}

export const useGamePersistence = (gameId: string | null) => {
  const { user } = useAuth();
  const [currentGameId, setCurrentGameId] = useState<string | null>(gameId);
  const [loading, setLoading] = useState(false);

  // Save or update game
  const saveGame = async (
    title: string,
    gameFiles: GameFiles,
    initialIdea?: string,
    description?: string
  ) => {
    if (!user) return null;

    try {
      if (currentGameId) {
        // Update existing game
        const { error } = await supabase
          .from('games')
          .update({
            title,
            description,
            current_files: gameFiles,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentGameId);

        if (error) throw error;
        return currentGameId;
      } else {
        // Create new game
        const { data, error } = await supabase
          .from('games')
          .insert({
            user_id: user.id,
            title,
            description,
            initial_idea: initialIdea,
            current_files: gameFiles
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentGameId(data.id);
        return data.id;
      }
    } catch (error: any) {
      console.error('Error saving game:', error);
      toast.error('Failed to save game');
      return null;
    }
  };

  // Load game by ID
  const loadGame = async (id: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentGameId(id);
      return data;
    } catch (error: any) {
      console.error('Error loading game:', error);
      toast.error('Failed to load game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Save chat message
  const saveChatMessage = async (
    gameId: string,
    role: 'user' | 'assistant',
    content: string,
    gameFiles?: GameFiles
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          role,
          content,
          game_files: gameFiles || null
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving message:', error);
    }
  };

  // Load chat messages for a game
  const loadChatMessages = async (gameId: string): Promise<Message[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        gameFiles: msg.game_files as GameFiles || undefined
      }));
    } catch (error: any) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  // Save game version
  const saveGameVersion = async (
    gameId: string,
    files: GameFiles,
    versionNumber: number,
    notes?: string,
    deploymentUrl?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('game_versions')
        .insert({
          game_id: gameId,
          version_number: versionNumber,
          files,
          notes,
          deployment_url: deploymentUrl
        });

      if (error) throw error;
      toast.success(`Version ${versionNumber} saved`);
    } catch (error: any) {
      console.error('Error saving version:', error);
      toast.error('Failed to save version');
    }
  };

  return {
    currentGameId,
    loading,
    saveGame,
    loadGame,
    saveChatMessage,
    loadChatMessages,
    saveGameVersion
  };
};