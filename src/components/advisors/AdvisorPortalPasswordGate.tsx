import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User } from "lucide-react";

interface AdvisorPortalPasswordGateProps {
  advisorName: string;
  onSuccess: () => void;
  correctPassword: string;
}

export const AdvisorPortalPasswordGate = ({
  advisorName,
  onSuccess,
  correctPassword,
}: AdvisorPortalPasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onSuccess();
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4" dir="ltr">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Hello, {advisorName}!</CardTitle>
          <p className="text-muted-foreground mt-2">Enter your password to access your portal</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center pl-10"
                autoFocus
                dir="ltr"
              />
              {error && (
                <p className="text-destructive text-sm mt-2 text-center">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};