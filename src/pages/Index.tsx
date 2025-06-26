
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Github, Zap, TrendingUp, CheckCircle, Play, Settings, BarChart3, Clock, Target, Star, GitBranch, Calendar, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = "https://ctjknzdjkqlqokryered.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0amtuemRqa3FscW9rcnllcmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTQ4MjMsImV4cCI6MjA2NjM3MDgyM30.ulCw7UKS4v-yItzoa-eDJkUe8vS0nT_ZwB9wRXKJViM";

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Webhooks
const gitWebhook = "https://n8n.srv850687.hstgr.cloud/webhook/gitmaxing";
const dataWebhook = "https://n8n.srv850687.hstgr.cloud/webhook/gitmaxingdata";

const Index = () => {
  // State management
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialsConfirmed, setCredentialsConfirmed] = useState(false);

  // Form data
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [repoData, setRepoData] = useState({
    repoUrl: '',
    githubApi: '',
    triggerCount: 5,
    intervalSeconds: 5
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
        toast({
          title: "Session error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        handleAuthState(session);
      }

      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        handleAuthState(session);
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to initialize authentication system",
        variant: "destructive",
      });
    }
  };

  // Handle authentication state changes
  const handleAuthState = async (session) => {
    if (session?.user) {
      setCurrentUser(session.user);
      setIsAuthenticated(true);
      await sendLoginData(session.user);
      await loadUserData(session.user);
    } else {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCredentialsConfirmed(false);
      setUserData(null);
      setIsDataLoaded(false);
      clearLocalStorage();
    }
  };

  // Send login data to backend
  const sendLoginData = async (user) => {
    try {
      const loginData = {
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        profile_image: user.user_metadata?.avatar_url || '',
        user_metadata: user.user_metadata,
        type: "login",
        timestamp: new Date().toISOString()
      };

      await fetch(dataWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });
    } catch (error) {
      console.error('Error sending login data:', error);
    }
  };

  // Load user data from backend
  const loadUserData = async (user) => {
    if (isDataLoaded) return;

    try {
      const requestData = {
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        user_metadata: user.user_metadata,
        type: "retrieveUserData",
        timestamp: new Date().toISOString()
      };

      const response = await fetch(dataWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const responseText = await response.text();
        if (responseText && responseText.trim() !== '') {
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            const jsonMatch = responseText.match(/\{.*\}/s);
            if (jsonMatch) {
              data = JSON.parse(jsonMatch[0]);
            }
          }

          if (Array.isArray(data) && data.length > 0) {
            setUserData(data[0]);
            fillFormWithUserData(data[0]);
          } else if (data && (data.user_email || data.email)) {
            setUserData(data);
            fillFormWithUserData(data);
          } else {
            loadFromLocalStorage(user);
          }
        } else {
          loadFromLocalStorage(user);
        }
      }
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading user data:', error);
      loadFromLocalStorage(user);
    }
  };

  // Fill form with user data
  const fillFormWithUserData = (data) => {
    if (!data) return;

    setRepoData(prev => ({
      ...prev,
      repoUrl: data.repo_url || '',
      githubApi: data.github_api || '',
      triggerCount: data.trigger_count || 5,
      intervalSeconds: data.interval_seconds || 5
    }));

    if (data.repo_url && data.github_api) {
      setCredentialsConfirmed(true);
    }
  };

  // Local storage functions
  const saveToLocalStorage = (data) => {
    if (!currentUser || !data) return;
    try {
      const dataToSave = { userData: data, timestamp: new Date().toISOString() };
      localStorage.setItem(`gitMaxingData_${currentUser.id}`, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (user) => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`gitMaxingData_${user.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        const savedTime = new Date(data.timestamp);
        const now = new Date();
        if (now - savedTime < 60 * 60 * 1000) {
          setUserData(data.userData);
          fillFormWithUserData(data.userData);
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const clearLocalStorage = () => {
    if (!currentUser) return;
    try {
      localStorage.removeItem(`gitMaxingData_${currentUser.id}`);
      const execLogKey = `execLog_${currentUser.id}`;
      const execLog = localStorage.getItem(execLogKey);
      if (execLog) {
        setExecutionLog(JSON.parse(execLog));
      }
    } catch (error) {
      console.error('Error with localStorage:', error);
    }
  };

  // Authentication functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let result;
      if (authMode === 'signin') {
        result = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });
      } else {
        result = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { email: authData.email }
          }
        });
      }

      const { data, error } = result;

      if (error) {
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (authMode === 'signup' && !data.session) {
          toast({
            title: "Account created successfully!",
            description: "Please check your email to confirm your account before signing in.",
          });
          setTimeout(() => setAuthMode('signin'), 3000);
        } else if (data.session) {
          toast({
            title: "Welcome to Git Maxing!",
            description: "Authentication successful",
          });
        }
        setAuthData({ email: '', password: '' });
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        toast({
          title: "Google sign-in failed",
          description: "Please try email sign-in instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "See you next time!",
        });
      }
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const confirmCredentials = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestData = {
        user_id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
        profile_image: currentUser.user_metadata?.avatar_url || '',
        user_metadata: currentUser.user_metadata,
        type: "URLs",
        repoUrl: repoData.repoUrl,
        githubApi: repoData.githubApi,
        triggerCount: repoData.triggerCount,
        intervalSeconds: repoData.intervalSeconds,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(dataWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const updatedUserData = {
          ...userData,
          repo_url: repoData.repoUrl,
          github_api: repoData.githubApi,
          trigger_count: repoData.triggerCount,
          interval_seconds: repoData.intervalSeconds,
          user_email: currentUser.email,
          user_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0]
        };
        
        setUserData(updatedUserData);
        setCredentialsConfirmed(true);
        saveToLocalStorage(updatedUserData);
        
        toast({
          title: "Credentials confirmed!",
          description: "Your repository is now configured for Git Maxing",
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Error confirming credentials",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const manualTrigger = async () => {
    if (!credentialsConfirmed) {
      toast({
        title: "Credentials required",
        description: "Please confirm your credentials first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      toast({
        title: "Starting Git Maxing",
        description: `Executing ${repoData.triggerCount} triggers with ${repoData.intervalSeconds}s intervals`,
      });

      for (let i = 0; i < repoData.triggerCount; i++) {
        try {
          const response = await fetch(gitWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              repoUrl: repoData.repoUrl,
              githubApi: repoData.githubApi,
              userEmail: currentUser.email,
              triggerType: "manual",
              timestamp: new Date().toISOString()
            })
          });

          if (response.ok) {
            successCount++;
            addToExecutionLog(repoData.repoUrl, "Success", "manual");
          } else {
            failCount++;
            addToExecutionLog(repoData.repoUrl, "Failed", "manual");
          }
        } catch (error) {
          failCount++;
          addToExecutionLog(repoData.repoUrl, "Error", "manual", error.message);
        }

        if (i < repoData.triggerCount - 1) {
          await new Promise(resolve => setTimeout(resolve, repoData.intervalSeconds * 1000));
        }
      }

      toast({
        title: "Git Maxing completed!",
        description: `${successCount} successful, ${failCount} failed executions`,
      });

    } catch (error) {
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToExecutionLog = (repoUrl, status, triggerType, errorMessage = null) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      repoUrl: repoUrl.substring(0, 50) + (repoUrl.length > 50 ? '...' : ''),
      status,
      triggerType,
      errorMessage
    };

    setExecutionLog(prev => {
      const newLog = [logEntry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(`execLog_${currentUser.id}`, JSON.stringify(newLog));
      } catch (error) {
        console.error("Error saving execution log:", error);
      }
      return newLog;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Github className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Git Maxing</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
              <span className="hover:text-white cursor-pointer">Features</span>
              <span className="hover:text-white cursor-pointer">How it works</span>
              <span className="hover:text-white cursor-pointer">Pricing</span>
              <Button variant="outline" size="sm" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                Sign in
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-8">
              <Star className="h-4 w-4 text-green-500" />
              <span className="text-sm text-slate-300">Transform your GitHub presence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Build <span className="text-green-500">GitHub</span> Profiles
              <br />
              <span className="text-slate-400">that stand out</span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Automate your GitHub contribution patterns with precision. Create consistent, 
              professional commit histories that showcase your coding dedication.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg">
                <Play className="h-5 w-5 mr-2" />
                Start Building
              </Button>
              <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg">
                <GitBranch className="h-5 w-5 mr-2" />
                View Examples
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Manual Control</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Real-time Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Before/After Section */}
        <div className="px-6 py-24 bg-slate-800/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                See the Transformation
              </h2>
              <p className="text-lg text-slate-400">
                Watch how Git Maxing transforms sparse contribution graphs into impressive patterns
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 rotate-180" />
                    Before Git Maxing
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Sparse, inconsistent contribution pattern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1 mb-4">
                    {Array.from({ length: 84 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`h-3 rounded-sm ${
                          Math.random() > 0.8 ? 'bg-green-300/40' : 'bg-slate-700'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    Only 23 contributions in the last 3 months
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    After Git Maxing
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Consistent, professional contribution pattern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1 mb-4">
                    {Array.from({ length: 84 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`h-3 rounded-sm ${
                          Math.random() > 0.3 ? 'bg-green-500' : 'bg-green-400/60'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    147 contributions in the last 3 months
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="px-6 py-24">
          <div className="max-w-md mx-auto">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  {authMode === 'signin' ? 'Welcome Back' : 'Get Started'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {authMode === 'signin' ? 'Sign in to continue' : 'Create your account to start Git Maxing'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={signInWithGoogle}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-800 text-slate-400">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                    {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
                  </Button>
                </form>
                
                <div className="text-center text-sm">
                  {authMode === 'signin' ? (
                    <span className="text-slate-400">
                      Don't have an account? 
                      <button onClick={() => setAuthMode('signup')} className="text-green-400 hover:underline ml-1">
                        Sign up
                      </button>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Already have an account? 
                      <button onClick={() => setAuthMode('signin')} className="text-green-400 hover:underline ml-1">
                        Sign in
                      </button>
                    </span>
                  )}
                </div>

                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg text-sm">
                  <h4 className="font-medium mb-2 text-white">📖 GitHub API Setup:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-xs">
                    <li>Go to GitHub Settings → Personal access tokens</li>
                    <li>Click "Generate new token" (classic)</li>
                    <li>Select required scopes</li>
                    <li>Copy the generated token</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Github className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Git Maxing</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Welcome, {currentUser?.user_metadata?.full_name || currentUser?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="setup" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white border">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="trigger" disabled={!credentialsConfirmed} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Execute
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Repository Configuration
                </CardTitle>
                <CardDescription>
                  Configure your GitHub repository and API credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {credentialsConfirmed ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Credentials Confirmed</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Repository:</strong> {repoData.repoUrl.split('/').slice(-2).join('/')}</p>
                        <p><strong>API Token:</strong> {repoData.githubApi.substring(0, 12)}...</p>
                        <p><strong>Trigger Settings:</strong> {repoData.triggerCount}x executions, {repoData.intervalSeconds}s intervals</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setCredentialsConfirmed(false)}
                      className="w-full"
                    >
                      Edit Credentials
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={confirmCredentials} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">GitHub Repository URL</label>
                      <Input
                        type="url"
                        placeholder="https://github.com/username/repository"
                        value={repoData.repoUrl}
                        onChange={(e) => setRepoData(prev => ({ ...prev, repoUrl: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">GitHub API Token</label>
                      <Input
                        type="password"
                        placeholder="github_pat_..."
                        value={repoData.githubApi}
                        onChange={(e) => setRepoData(prev => ({ ...prev, githubApi: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Trigger Count</label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={repoData.triggerCount}
                          onChange={(e) => setRepoData(prev => ({ ...prev, triggerCount: parseInt(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Interval (seconds)</label>
                        <Input
                          type="number"
                          min="1"
                          value={repoData.intervalSeconds}
                          onChange={(e) => setRepoData(prev => ({ ...prev, intervalSeconds: parseInt(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                      {isLoading ? 'Confirming...' : 'Confirm Credentials'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trigger" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Manual Trigger
                </CardTitle>
                <CardDescription>
                  Execute your configured Git Maxing sequence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Triggers</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">{repoData.triggerCount}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Interval</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">{repoData.intervalSeconds}s</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Time</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        {Math.ceil((repoData.triggerCount * repoData.intervalSeconds) / 60)}min
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={manualTrigger} 
                  className="w-full py-6 text-lg bg-green-500 hover:bg-green-600" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Executing Git Maxing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Start Git Maxing
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Execution History
                </CardTitle>
                <CardDescription>
                  Track your Git Maxing execution history and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {executionLog.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No executions yet. Start your first Git Maxing session!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {executionLog.map((entry) => (
                      <div 
                        key={entry.id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          entry.status === 'Success' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{entry.repoUrl}</p>
                          {entry.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{entry.errorMessage}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={entry.status === 'Success' ? 'default' : 'destructive'}
                            className="mb-1"
                          >
                            {entry.status}
                          </Badge>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
