import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Gamepad2, Clock, LogOut, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Game {
  id: string;
  title: string;
  description: string | null;
  initial_idea: string | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [newGameTitle, setNewGameTitle] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadGames();
  }, [user, navigate]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error: any) {
      toast.error('Failed to load games');
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRenameClick = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setSelectedGame(game);
    setNewGameTitle(game.title);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!selectedGame || !newGameTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ title: newGameTitle.trim() })
        .eq('id', selectedGame.id);

      if (error) throw error;

      setGames(games.map(g => g.id === selectedGame.id ? { ...g, title: newGameTitle.trim() } : g));
      toast.success('Game renamed successfully');
      setRenameDialogOpen(false);
    } catch (error) {
      toast.error('Failed to rename game');
      console.error('Error renaming game:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGame) return;

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', selectedGame.id);

      if (error) throw error;

      setGames(games.filter(g => g.id !== selectedGame.id));
      toast.success('Game deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete game');
      console.error('Error deleting game:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      {/* Main Content */}
      <main className="relative z-10 flex-1 container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">My Games</h1>
              <p className="text-lg text-muted-foreground">
                {games.length === 0 
                  ? 'Start creating your first game' 
                  : `${games.length} game${games.length === 1 ? '' : 's'} created`
                }
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="glass border-primary/20 hover:border-accent/60"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button
                onClick={() => navigate('/workspace')}
                className="bg-gradient-to-r from-primary to-accent glow-primary"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Game
              </Button>
            </div>
          </div>

          {/* Games Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : games.length === 0 ? (
            <Card className="glass-strong border-primary/20 p-12 text-center">
              <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No games yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first game and start building something amazing!
              </p>
              <Button
                onClick={() => navigate('/workspace')}
                className="bg-gradient-to-r from-primary to-accent glow-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Game
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card 
                  key={game.id}
                  className="glass-strong border-primary/20 p-6 cursor-pointer hover:border-accent/60 smooth-transition group"
                  onClick={() => navigate(`/workspace?gameId=${game.id}`)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Gamepad2 className="h-8 w-8 text-accent" />
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(game.updated_at)}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-accent smooth-transition">
                        {game.title}
                      </h3>
                      {game.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {game.description}
                        </p>
                      )}
                      {game.initial_idea && (
                        <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                          "{game.initial_idea}"
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/50 flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1 hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workspace?gameId=${game.id}`);
                        }}
                      >
                        Open
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => handleRenameClick(e, game)}
                        className="hover:bg-accent/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, game)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="glass-strong border-primary/20">
          <DialogHeader>
            <DialogTitle>Rename Game</DialogTitle>
            <DialogDescription>
              Enter a new name for your game
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="game-title">Game Title</Label>
              <Input
                id="game-title"
                value={newGameTitle}
                onChange={(e) => setNewGameTitle(e.target.value)}
                placeholder="Enter game title"
                className="glass border-border/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameSubmit}
              disabled={!newGameTitle.trim()}
              className="bg-gradient-to-r from-primary to-accent"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-strong border-primary/20">
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGame?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;