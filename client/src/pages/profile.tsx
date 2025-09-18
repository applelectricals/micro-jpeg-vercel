import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, LogOut, Settings, Activity, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Clear local cache first
        queryClient.clear();
        
        // Use fetch to call logout endpoint
        const response = await fetch('/api/logout', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          // Logout successful, manually redirect
          window.location.href = '/';
          return;
        } else {
          throw new Error('Logout failed');
        }
      } catch (error) {
        // If API fails, still clear cache and redirect
        queryClient.clear();
        window.location.href = '/';
      }
    },
    onError: (error: any) => {
      // Fallback: clear cache and redirect anyway
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "A new verification email has been sent to your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send verification email.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile Dashboard</h1>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
            >
              Back to Compressor
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Email Verification Alert */}
        {user.isEmailVerified !== "true" && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Please verify your email address</strong> to access all features.
                  <br />
                  <span className="text-sm">Check your inbox for the verification email.</span>
                </div>
                <Button
                  onClick={() => resendVerificationMutation.mutate()}
                  disabled={resendVerificationMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  {resendVerificationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Email"
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : "User"
                    }
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm">{user.email}</span>
                  <Badge variant={user.isEmailVerified === "true" ? "default" : "secondary"}>
                    {user.isEmailVerified === "true" ? "Verified" : "Unverified"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Member since:</span>
                  <span className="text-sm">{formatDate(user.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Last login:</span>
                  <span className="text-sm">{formatDate(user.lastLogin)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/")}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Compression History
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings (Coming Soon)
                </Button>
              </div>

              <Separator />

              <div className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? "Logging out..." : "Sign Out"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>
                Overview of your compression activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">--</div>
                  <div className="text-sm text-gray-600">Total Compressions</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">--</div>
                  <div className="text-sm text-gray-600">Space Saved</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">--</div>
                  <div className="text-sm text-gray-600">Files Processed</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">--</div>
                  <div className="text-sm text-gray-600">Avg. Compression</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                Statistics will be available after you start compressing images
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}