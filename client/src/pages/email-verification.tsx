import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Mail, Loader2 } from "lucide-react";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    setToken(tokenParam);
  }, []);

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await apiRequest("GET", `/api/auth/verify-email/${verificationToken}`, null);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. Welcome to JPEG Compressor!",
      });
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resend verification email mutation
  const resendMutation = useMutation({
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
        title: "Failed to Send Email",
        description: error.message || "Could not send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-verify when token is available
  useEffect(() => {
    if (token && !verifyEmailMutation.isPending) {
      verifyEmailMutation.mutate(token);
    }
  }, [token]);

  // Check if user is authenticated to show resend option
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">JPEG Compressor</h1>
          <p className="mt-2 text-gray-600">Email Verification</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verifyEmailMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : verifyEmailMutation.isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : verifyEmailMutation.isError ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Mail className="w-5 h-5 text-blue-600" />
              )}
              Email Verification
            </CardTitle>
            <CardDescription>
              {verifyEmailMutation.isPending
                ? "Verifying your email address..."
                : verifyEmailMutation.isSuccess
                ? "Verification successful!"
                : verifyEmailMutation.isError
                ? "Verification failed"
                : "Verify your email to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifyEmailMutation.isPending && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Please wait while we verify your email address...
                </AlertDescription>
              </Alert>
            )}

            {verifyEmailMutation.isSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Your email has been successfully verified! You'll be redirected to the home page shortly.
                </AlertDescription>
              </Alert>
            )}

            {verifyEmailMutation.isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {verifyEmailMutation.error?.message || "Verification failed. The link may be expired or invalid."}
                </AlertDescription>
              </Alert>
            )}

            {!token && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  No verification token found. Please check your email for the verification link.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 pt-4">
              {verifyEmailMutation.isSuccess && (
                <Button onClick={() => setLocation("/")} className="w-full">
                  Continue to Home
                </Button>
              )}

              {verifyEmailMutation.isError && user && user.isEmailVerified !== "true" && (
                <Button
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {user && user.isEmailVerified !== "true" && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Check Your Email</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    We've sent a verification link to <strong>{user.email}</strong>. 
                    Click the link in the email to verify your account.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Didn't receive the email? Check your spam folder or resend the verification email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}