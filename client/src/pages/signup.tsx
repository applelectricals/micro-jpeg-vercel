import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signupSchema, type SignupInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, UserPlus, Check, X } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const watchedEmail = form.watch("email");
  const watchedPassword = form.watch("password");

  // Email availability check
  useEffect(() => {
    const checkEmail = async () => {
      if (!watchedEmail || !watchedEmail.includes("@")) {
        setEmailAvailable(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await apiRequest("POST", "/api/auth/check-email", { email: watchedEmail });
        const data = await response.json();
        setEmailAvailable(data.available);
      } catch (error) {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedEmail]);

  // Password strength indicators
  const passwordChecks = {
    length: watchedPassword.length >= 8,
    uppercase: /[A-Z]/.test(watchedPassword),
    lowercase: /[a-z]/.test(watchedPassword),
    number: /[0-9]/.test(watchedPassword),
  };

  const signupMutation = useMutation({
    mutationFn: async (data: SignupInput) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before using all features.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupInput) => {
    if (emailAvailable === false) {
      toast({
        title: "Email unavailable",
        description: "This email is already registered. Please use a different email.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(data);
  };

  const PasswordIndicator = ({ check, label }: { check: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {check ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-gray-400" />
      )}
      <span className={check ? "text-green-700" : "text-gray-500"}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">JPEG Compressor</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Sign Up
            </CardTitle>
            <CardDescription>
              Create an account to start compressing your images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...form.register("firstName")}
                    className={form.formState.errors.firstName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...form.register("lastName")}
                    className={form.formState.errors.lastName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...form.register("email")}
                    className={form.formState.errors.email ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <div className="absolute right-3 top-2.5">
                    {checkingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : emailAvailable === true ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : emailAvailable === false ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
                {emailAvailable === false && (
                  <p className="text-sm text-red-500">This email is already registered</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...form.register("password")}
                    className={form.formState.errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {/* Password strength indicators */}
                {watchedPassword && (
                  <div className="space-y-1 mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
                    <PasswordIndicator check={passwordChecks.length} label="At least 8 characters" />
                    <PasswordIndicator check={passwordChecks.uppercase} label="One uppercase letter" />
                    <PasswordIndicator check={passwordChecks.lowercase} label="One lowercase letter" />
                    <PasswordIndicator check={passwordChecks.number} label="One number" />
                  </div>
                )}
                
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              {signupMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(signupMutation.error as any)?.message || "Signup failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={signupMutation.isPending || emailAvailable === false}
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}