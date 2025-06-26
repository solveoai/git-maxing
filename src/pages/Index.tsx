
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Github, Zap, TrendingUp, CheckCircle, Play, Settings, BarChart3, Clock, Target } from 'lucide-react';

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

  // Webhooks and config
  const gitWebhook = "https://n8n.srv850687.hstgr.cloud/webhook/gitmaxing";
  const dataWebhook = "https://n8n.srv850687.hstgr.cloud/webhook/gitmaxingdata";

  // Mock authentication for demo (replace with real Supabase later)
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        id: 'user_123',
        email: authData.email,
        user_metadata: {
          full_name: authData.email.split('@')[0]
        }
      };
      
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
      toast({
        title: "Welcome to Git Maxing!",
        description: "Authentication successful",
      });
      
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

  const handleSignOut = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCredentialsConfirmed(false);
    setUserData(null);
    setAuthData({ email: '', password: '' });
    setRepoData({ repoUrl: '', githubApi: '', triggerCount: 5, intervalSeconds: 5 });
    toast({
      title: "Signed out successfully",
      description: "See you next time!",
    });
  };

  const confirmCredentials = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const requestData = {
        user_id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
        type: "URLs",
        repoUrl: repoData.repoUrl,
        githubApi: repoData.githubApi,
        triggerCount: repoData.triggerCount,
        intervalSeconds: repoData.intervalSeconds,
        timestamp: new Date().toISOString()
      };

      // In real implementation, send to dataWebhook
      console.log('Sending credentials:', requestData);
      
      setCredentialsConfirmed(true);
      setUserData(requestData);
      
      toast({
        title: "Credentials confirmed!",
        description: "Your repository is now configured for Git Maxing",
      });
      
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
          // Simulate webhook call
          await new Promise(resolve => setTimeout(resolve, repoData.intervalSeconds * 1000));
          
          const success = Math.random() > 0.2; // 80% success rate for demo
          
          if (success) {
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

    setExecutionLog(prev => [logEntry, ...prev].slice(0, 50));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Github className="h-12 w-12 text-green-600" />
                <h1 className="text-5xl font-bold text-gray-900">
                  Git <span className="text-green-600">Maxing</span>
                </h1>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Transform your GitHub profile with automated commit optimization. 
                Build consistent contribution patterns and showcase your coding dedication.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-12">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Manual Trigger Control</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time Monitoring</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Safe & Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Before/After Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                See the Transformation
              </h2>
              <p className="text-lg text-gray-600">
                Watch how Git Maxing transforms sparse contribution graphs into impressive green patterns
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 rotate-180" />
                    Before Git Maxing
                  </CardTitle>
                  <CardDescription>Sparse, inconsistent contribution pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1 mb-4">
                    {Array.from({ length: 84 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`h-3 rounded-sm ${
                          Math.random() > 0.8 ? 'bg-green-200' : 'bg-gray-100'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Only 23 contributions in the last 3 months
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 border-green-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    After Git Maxing
                  </CardTitle>
                  <CardDescription>Consistent, professional contribution pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1 mb-4">
                    {Array.from({ length: 84 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`h-3 rounded-sm ${
                          Math.random() > 0.3 ? 'bg-green-500' : 'bg-green-200'
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

        {/* Authentication Section */}
        <div className="py-16 bg-white">
          <div className="max-w-md mx-auto px-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {authMode === 'signin' ? 'Welcome Back' : 'Get Started'}
                </CardTitle>
                <CardDescription>
                  {authMode === 'signin' ? 'Sign in to continue' : 'Create your account to start Git Maxing'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAuth} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
                  </Button>
                </form>
                
                <div className="text-center text-sm">
                  {authMode === 'signin' ? (
                    <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-green-600 hover:underline">Sign up</button></>
                  ) : (
                    <>Already have an account? <button onClick={() => setAuthMode('signin')} className="text-green-600 hover:underline">Sign in</button></>
                  )}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
                  <h4 className="font-medium mb-2">📖 GitHub API Setup:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Github className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Git <span className="text-green-600">Maxing</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
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
          <TabsList className="grid w-full grid-cols-3">
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
            <Card>
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

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Confirming...' : 'Confirm Credentials'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trigger" className="space-y-6">
            <Card>
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
                  className="w-full py-6 text-lg" 
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
            <Card>
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
    </div>
  );
};

export default Index;
