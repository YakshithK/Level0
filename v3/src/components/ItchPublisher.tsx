import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GameFiles {
  [key: string]: string;
}

interface ItchPublisherProps {
  gameFiles: GameFiles;
  isOpen: boolean;
  onClose: () => void;
}

const ItchPublisher = ({ gameFiles, isOpen, onClose }: ItchPublisherProps) => {
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Function to create a zip file from game files
  const createZipFromFiles = async (files: GameFiles): Promise<Blob> => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add each file to the zip
    Object.entries(files).forEach(([filePath, content]) => {
      zip.file(filePath, content);
    });
    
    // Generate the zip file
    return await zip.generateAsync({ type: "blob" });
  };

  const handlePublish = async () => {
    if (!apiKey || !username || !gameSlug) {
      toast.error("Please fill in all fields");
      return;
    }

    if (Object.keys(gameFiles).length === 0) {
      toast.error("No game files to publish");
      return;
    }

    setIsPublishing(true);

    try {
      // 1. Create zip from game files
      toast.info("Creating game package...");
      const zipBlob = await createZipFromFiles(gameFiles);
      
      // 2. Upload zip to Supabase Storage
      toast.info("Uploading to storage...");
      const fileName = `game-${Date.now()}.zip`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('games')
        .upload(fileName, zipBlob);

      if (uploadError) {
        throw new Error(`Failed to upload to storage: ${uploadError.message}`);
      }

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from('games')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log("File uploaded to:", publicUrl);

      // 4. Call the Edge Function
      toast.info("Publishing to itch.io...");
      
      const { data, error } = await supabase.functions.invoke('publish-to-itch', {
        body: {
          api_key: apiKey,
          username: username,
          game_slug: gameSlug,
          channel: "html5",
          zip_url: publicUrl
        }
      });

      if (error) throw error;

      // Check if publish was successful
      if (data?.success) {
        // Show progress messages if available
        if (data.messages) {
          data.messages.forEach((msg: any) => {
            if (msg.message) {
              toast.info(msg.message);
            }
          });
        }
        toast.success("Game published to Itch.io successfully!");
        onClose();
      } else {
        throw new Error(data?.error || "Failed to publish game");
      }
      
    } catch (error) {
      console.error('Error publishing to Itch.io:', error);
      toast.error(error instanceof Error ? error.message : "Failed to publish to Itch.io");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish to Itch.io
          </DialogTitle>
          <DialogDescription>
            First, create your game project on Itch.io, then use your API key and Game Slug to publish updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">
              Itch.io API Key
              <a 
                href="https://itch.io/user/settings/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Get API Key <ExternalLink className="h-3 w-3" />
              </a>
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Your Itch.io API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Itch.io Username</Label>
            <Input
              id="username"
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="game-slug">
              Game Slug
              <a 
                href="https://itch.io/game/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Create Game on Itch.io <ExternalLink className="h-3 w-3" />
              </a>
            </Label>
            <Input
              id="game-slug"
              placeholder="my-awesome-game"
              value={gameSlug}
              onChange={(e) => setGameSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The URL-friendly name of your game (e.g., "my-awesome-game")
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm font-medium">Files to publish:</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {Object.keys(gameFiles).map(file => (
                <div key={file}>• {file}</div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publish to Itch.io
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItchPublisher;