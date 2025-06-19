
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const BetaSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("You're on the list! We'll be in touch soon.", {
        description: "Check your email for a confirmation."
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="gradient-border">
          <div className="gradient-border-inner p-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Join the{" "}
              <span className="text-gradient">beta</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be among the first to experience the future of AI game building. 
              Early access starts soon, and spots are limited.
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow bg-background border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-semibold glow-effect whitespace-nowrap"
                >
                  {isSubmitting ? "Joining..." : "Get early access"}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-sm text-muted-foreground">
              <p className="mb-2">🎮 Full access to Level0 beta</p>
              <p className="mb-2">⚡ Unlimited game generations</p>
              <p>🚀 First to try new features</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BetaSection;
