import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { supabase } from '../lib/utils';
import { User } from '@supabase/supabase-js';

// Add CSS animations for modal transitions
const modalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  @keyframes slideOut {
    from { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to { 
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
  }
`;

export default function Landing() {
  const navigate = useNavigate();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signinSuccess, setSigninSuccess] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [requireSignInMsg, setRequireSignInMsg] = useState("");
  const [showVerificationMsg, setShowVerificationMsg] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Inject CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = modalStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check for existing session on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowAuthModal(false);
      setIsClosingModal(false);
      setRequireSignInMsg("");
    }, 150);
  };

  const handleInitialPrompt = async () => {
    if (!aiPrompt.trim()) return;
    if (!user) {
      setRequireSignInMsg("You need to sign in to generate a game.");
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      // 1. Create a new project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: aiPrompt.slice(0, 100) || 'Untitled Project',
            code: null
          }
        ])
        .select("*")
        .single();
      if (projectError || !projectData) {
        setError('Failed to create project.');
        setIsGenerating(false);
        return;
      }
      const projectId = projectData.id;
      // 2. Add the user's prompt as the first message
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert([
          {
            connection_id: projectId,
            sender: 'user',
            message: aiPrompt
          }
        ]);
      if (userMsgError) {
        setError('Failed to save your message.');
        setIsGenerating(false);
        return;
      }
      // 3. Get AI response
      const { data, error } = await supabase.functions.invoke('kimi_k2_proxy', {
        body: {
          messages: [{ role: 'user', content: aiPrompt }],
          systemPrompt: undefined // or import systemPrompt if needed
        }
      });
      if (error) throw new Error(error.message || 'Kimi K2 proxy error');
      const result = data;
      if (result && result.code && result.code.trim()) {
        // 4. Add AI response as a message (raw text, no splitting)
        const { error: aiMsgError } = await supabase
          .from('chat_messages')
          .insert([
            {
              connection_id: projectId,
              sender: 'ai',
              message: result.thinking || ''
            }
          ]);
        if (aiMsgError) {
          setError('Failed to save AI message.');
          setIsGenerating(false);
          return;
        }
        // 5. Update the project with the code from the first AI response
        await supabase
          .from('projects')
          .update({ code: result.code })
          .eq('id', projectId);
        // 6. Navigate to Chat page with projectId (no state)
        console.log("JAMES")
        navigate(`/projects/${projectId}`);
      } else {
        setError('No code was generated.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (authMode === 'signup') {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: { username: authForm.name }
        }
      });
      if (error) {
        console.log("Error signing up", error);
        return;
      }
      // Insert into users table
      const { error: dbError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          email: authForm.email,
          username: authForm.name,
        }
      ]);
      if (dbError) {
        console.log("Error inserting new user", dbError);
        return;
      }
      setSignupSuccess(true);
      setShowVerificationMsg(true);
      return;
    }
    if (authMode === 'signin') {
      setSigninError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      if (error) {
        setSigninError(error.message);
        return;
      }
      setSigninSuccess(true);
      setTimeout(() => {
        setSigninSuccess(false);
        handleCloseModal();
      }, 1500);
      return;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowProfileDropdown(false);
  };

  const handleResend = async () => {
    setResendError(null);
    setResendSuccess(false);
    
    const { data, error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
      options: {
        data: { username: authForm.name }
      }
    });
    
    if (error) {
      setResendError(error.message);
      return;
    }
    
    setResendSuccess(true);
    setTimeout(() => {
      setResendSuccess(false);
    }, 3000);
  };

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <header className="relative z-20 flex justify-between items-center p-6 sm:p-8">
        <Logo showText={false} />
        {user ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="bg-[#444] text-white px-4 py-2 rounded-lg hover:bg-[#555] transition-colors"
            >
              My Projects
            </button>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold hover:bg-neon-cyan/90 transition-all duration-300 hover:scale-105"
              >
                {user.user_metadata?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#23272f] rounded-lg shadow-lg border border-[#444] py-2 z-50">
                  <div className="px-4 py-2 text-sm text-[#e5e7ef] border-b border-[#444]">
                    {user.user_metadata?.username || user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-[#888] hover:text-white hover:bg-[#181c24] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-neon-cyan text-black font-semibold px-6 py-2 rounded-lg shadow glow-effect hover:bg-neon-cyan/90 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Main Hero Content */}
      <div className="flex-1 flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-teal-900/20 animate-gradient-shift bg-[length:400%_400%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_50%)]" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full animate-float opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Turn{" "}
            <span className="text-gradient">words</span>
            {" "}into{" "}
            <span className="text-gradient">worlds</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            <span className="text-neon-cyan font-medium">AI-powered game prototyping in seconds.</span>
          </p>

          {/* Demo placeholder */}
          <form
          className="w-full max-w-xl mx-auto flex flex-col items-center justify-center"
          onSubmit={e => {
            e.preventDefault();
            handleInitialPrompt();
          }}
        >
          <textarea
            className="w-full h-32 p-4 rounded-lg border border-[#444] bg-[#23272f] text-white text-lg focus:outline-none focus:border-[#00ffff] resize-none shadow-lg"
            placeholder="Describe your game (e.g., 'A lava platformer with double jump and spikes')"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleInitialPrompt();
              }
            }}
            disabled={isGenerating}
            autoFocus
          />

          <Button
            type="submit"
            size='lg'
            className="mt-6 bg-neon-cyan text-black hover:bg-neon-cyan/90 font-semibold px-8 py-4 text-lg glow-effect transition-all duration-300 hover:scale-105"
            disabled={isGenerating || !aiPrompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate Game'}
          </Button>
          {error && (
            <div className="mt-4 text-red-400 text-base">Error: {error}</div>
          )}
        </form>
        </div>
      </div>

      {/* Auth Modal */}
      {(showAuthModal || isClosingModal) && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out"
          style={{
            animation: isClosingModal ? 'fadeOut 0.3s ease-out' : 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            className="bg-[#23272f] rounded-xl p-8 max-w-md w-full border border-[#444] shadow-2xl transition-all duration-300 ease-out"
            style={{
              animation: isClosingModal ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out'
            }}
          >
            {requireSignInMsg && (
              <div className="mb-4 text-center text-yellow-400 font-semibold text-base animate-fade-in">
                {requireSignInMsg}
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[#888] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {showVerificationMsg ? (
              <div className="text-center">
                <div className="mb-6 text-green-400 font-semibold text-lg">
                  Verification email sent!
                </div>
                <p className="text-[#888] text-sm mb-6">
                  Please check your email and click the verification link to complete your sign up.
                </p>
                <button
                  onClick={handleResend}
                  className="bg-neon-cyan text-black font-semibold px-6 py-2 rounded hover:bg-neon-cyan/90 transition-colors"
                >
                  Resend Email
                </button>
                {resendError && (
                  <div className="mt-4 text-center text-red-400 font-semibold text-sm">
                    {resendError}
                  </div>
                )}
                {resendSuccess && (
                  <div className="mt-4 text-center text-green-400 font-semibold text-sm">
                    Verification email resent successfully!
                  </div>
                )}
                <button
                  onClick={handleCloseModal}
                  className="block w-full mt-4 text-[#888] hover:text-white transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-[#e5e7ef] mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                        className="w-full px-4 py-2 rounded border border-[#444] bg-[#181c24] text-white focus:outline-none focus:border-[#00ffff]"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#e5e7ef] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      className="w-full px-4 py-2 rounded border border-[#444] bg-[#181c24] text-white focus:outline-none focus:border-[#00ffff]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e5e7ef] mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full px-4 py-2 rounded border border-[#444] bg-[#181c24] text-white focus:outline-none focus:border-[#00ffff]"
                      required
                    />
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-[#e5e7ef] mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={authForm.confirmPassword}
                        onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 rounded border border-[#444] bg-[#181c24] text-white focus:outline-none focus:border-[#00ffff]"
                        required
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-neon-cyan text-black font-semibold py-2 rounded hover:bg-neon-cyan/90 transition-colors"
                  >
                    {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-[#888] text-sm">
                    {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                    <button
                      onClick={() => {
                        setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                        setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
                      }}
                      className="text-neon-cyan hover:text-neon-cyan/80 transition-colors font-medium"
                    >
                      {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>

                {signinError && (
                  <div className="mt-4 text-center text-red-400 font-semibold text-base animate-fade-in">
                    {signinError}
                  </div>
                )}
                {signinSuccess && (
                  <div className="mt-6 text-center text-green-400 font-semibold text-lg animate-fade-in">
                    Sign in successful!
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}