import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, GraduationCap } from "lucide-react";

// NOTE: Temporary password gate — will be replaced with proper multi-tenant
// auth (email/password + Google) in Phase 2. Keeping the Noga password for
// backward compatibility with the existing instance.
const CORRECT_PASSWORD = "NogaNoga123";
const AUTH_KEY = "primrose_auth";
const LEGACY_AUTH_KEY = "noga_crm_auth";

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () =>
      localStorage.getItem(AUTH_KEY) === "true" ||
      localStorage.getItem(LEGACY_AUTH_KEY) === "true",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Primrose IEC</CardTitle>
          <p className="text-muted-foreground text-sm">
            Sign in to your practice
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                autoFocus
              />
              {error && (
                <p className="text-destructive text-sm mt-2 text-center">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
