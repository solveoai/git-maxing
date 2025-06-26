import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Github, Zap, TrendingUp, CheckCircle, Play, Settings, BarChart3, Clock, Target, Star, GitBranch, User } from 'lucide-react';
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialsConfirmed, setCredentialsConfirmed] = useState(false);

  // Form data
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
        const timeDiff = now.getTime() - savedTime.getTime();

        // Only use cached data if it's less than 1 hour old
        if (timeDiff < 60 * 60 * 1000) {
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
          description: "Please try again.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Github className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Git Maxing</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Welcome, {currentUser?.user_metadata?.full_name || currentUser?.email}</span>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={signInWithGoogle}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isLoading ? 'Signing in...' : 'Get Started'}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {!isAuthenticated ? (
        <>
          {/* Hero Section */}
          <div className="relative px-6 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-600 rounded-full px-4 py-2 mb-8">
                <Star className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">Transform your GitHub presence</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Build <span className="text-green-400">GitHub</span> Profiles
                <br />
                <span className="text-gray-400">that stand out</span>
              </h1>
              
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                Automate your GitHub contribution patterns with precision. Create consistent, 
                professional commit histories that showcase your coding dedication.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button 
                  size="lg" 
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {isLoading ? 'Starting...' : 'Start Building'}
                </Button>
                <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
                  <GitBranch className="h-5 w-5 mr-2" />
                  <span className="text-gray-300">View Examples</span>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Manual Control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Real-time Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>
          </div>

          {/* Before/After Section */}
          <div className="px-6 py-24 bg-gray-800/30">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  See the Transformation
                </h2>
                <p className="text-lg text-gray-400">
                  Watch how Git Maxing transforms sparse contribution graphs into impressive patterns
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 rotate-180" />
                      Before Git Maxing
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Sparse, inconsistent contribution pattern
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-1 mb-4">
                      {Array.from({ length: 84 }, (_, i) => (
                        <div 
                          key={i} 
                          className={`h-3 rounded-sm ${
                            Math.random() > 0.8 ? 'bg-green-300/40' : 'bg-gray-700'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      Only 23 contributions in the last 3 months
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      After Git Maxing
                    </CardTitle>
                    <CardDescription className="text-gray-400">
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
                    <p className="text-sm text-gray-500">
                      147 contributions in the last 3 months
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Tutorial Video Section */}
          <div className="px-6 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Setup Tutorial
              </h2>
              <p className="text-lg text-gray-400 mb-12">
                Watch this quick tutorial to learn how to get your GitHub credentials
              </p>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
                <div className="aspect-video w-full max-w-3xl mx-auto">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/vE_S7b43CgI?start=38"
                    title="Git Maxing Setup Tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
                <div className="mt-6 text-left">
                  <h3 className="text-lg font-semibold text-white mb-4">📋 Quick Setup Steps:</h3>
                  <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">GitHub Settings → Personal access tokens</a></li>
                    <li>Click "Generate new token" (classic)</li>
                    <li>Give it a name and select required scopes</li>
                    <li>Copy the generated token (starts with "github_pat_")</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Authenticated User Dashboard
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Tabs defaultValue="setup" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border-gray-700">
              <TabsTrigger value="setup" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                <Settings className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="trigger" disabled={!credentialsConfirmed} className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                <Play className="h-4 w-4" />
                Execute
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                <BarChart3 className="h-4 w-4" />
                Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Github className="h-5 w-5" />
                    Repository Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure your GitHub repository and API credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {credentialsConfirmed ? (
                    <div className="space-y-4">
                      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="font-medium text-green-300">Credentials Confirmed</span>
                        </div>
                        <div className="text-sm text-green-200 space-y-1">
                          <p><strong>Repository:</strong> {repoData.repoUrl.split('/').slice(-2).join('/')}</p>
                          <p><strong>API Token:</strong> {repoData.githubApi.substring(0, 12)}...</p>
                          <p><strong>Trigger Settings:</strong> {repoData.triggerCount}x executions, {repoData.intervalSeconds}s intervals</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setCredentialsConfirmed(false)}
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Edit Credentials
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={confirmCredentials} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-gray-300">GitHub Repository URL</label>
                        <Input
                          type="url"
                          placeholder="https://github.com/username/repository"
                          value={repoData.repoUrl}
                          onChange={(e) => setRepoData(prev => ({ ...prev, repoUrl: e.target.value }))}
                          required
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block text-gray-300">GitHub API Token</label>
                        <Input
                          type="password"
                          placeholder="github_pat_..."
                          value={repoData.githubApi}
                          onChange={(e) => setRepoData(prev => ({ ...prev, githubApi: e.target.value }))}
                          required
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block text-gray-300">Trigger Count</label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={repoData.triggerCount}
                            onChange={(e) => setRepoData(prev => ({ ...prev, triggerCount: parseInt(e.target.value) }))}
                            required
                            className="bg-gray-700/50 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block text-gray-300">Interval (seconds)</label>
                          <Input
                            type="number"
                            min="1"
                            value={repoData.intervalSeconds}
                            onChange={(e) => setRepoData(prev => ({ ...prev, intervalSeconds: parseInt(e.target.value) }))}
                            required
                            className="bg-gray-700/50 border-gray-600 text-white"
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
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="h-5 w-5" />
                    Manual Trigger
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Execute your configured Git Maxing sequence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-blue-300 mb-1">
                          <Target className="h-4 w-4" />
                          <span className="text-sm font-medium">Triggers</span>
                        </div>
                        <p className="text-lg font-bold text-blue-200">{repoData.triggerCount}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-blue-300 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Interval</span>
                        </div>
                        <p className="text-lg font-bold text-blue-200">{repoData.intervalSeconds}s</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-blue-300 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Total Time</span>
                        </div>
                        <p className="text-lg font-bold text-blue-200">
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
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5" />
                    Execution History
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Track your Git Maxing execution history and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {executionLog.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
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
                              ? 'bg-green-900/20 border-green-700/50' 
                              : 'bg-red-900/20 border-red-700/50'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-300">{entry.repoUrl}</p>
                            {entry.errorMessage && (
                              <p className="text-xs text-red-400 mt-1">{entry.errorMessage}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={entry.status === 'Success' ? 'default' : 'destructive'}
                              className="mb-1"
                            >
                              {entry.status}
                            </Badge>
                            <p className="text-xs text-gray-500">
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
      )}
    </div>
  );
};

export default Index;
