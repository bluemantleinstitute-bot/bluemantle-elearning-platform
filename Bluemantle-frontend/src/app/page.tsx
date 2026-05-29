"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KnowledgeCard, CardHeader, CardBody } from "@/components/KnowledgeCard";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ userId: email, password }),
      });

      if (data.requireOtp) {
        setIsOtpStep(true);
      } else if (data.success) {
        // Redirect based on role
        if (data.user.role === "student") router.push("/student");
        else if (data.user.role === "teacher") router.push("/teacher");
        else if (data.user.role === "admin" || data.user.role === "owner") router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or unauthorized account.");
    } finally {
      setLoading(false);
    }
  };

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const otp = otpDigits.join("");
      const data = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ userId: email, otp }),
      });

      if (data.success) {
        if (data.user.role === "student") router.push("/student");
        else if (data.user.role === "teacher") router.push("/teacher");
        else if (data.user.role === "admin" || data.user.role === "owner") router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary_fixed_dim/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-secondary_fixed_dim/30 blur-[120px] pointer-events-none" />

      <KnowledgeCard className="w-full max-w-md relative z-10 p-10 bg-surface_container_lowest/80 backdrop-blur-3xl border border-outline_variant/40 shadow-ambient">
        <CardHeader className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-signature-gradient flex items-center justify-center text-on_primary font-bold font-manrope text-2xl mx-auto mb-6 shadow-ambient">
            BA
          </div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Academic Atelier</h1>
          <p className="text-on_surface_variant">
            {isOtpStep ? "Device Verification required" : "Sign in to your learning portal"}
          </p>
        </CardHeader>
        
        <CardBody>
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-bold flex items-center gap-3 animate-shake">
               <ShieldAlert className="w-5 h-5" />
               {error}
            </div>
          )}
          {!isOtpStep ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-on_surface">User ID</label>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface_container_high text-on_surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20 shadow-sm"
                  placeholder="Enter your unique ID"
                  suppressHydrationWarning
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-on_surface flex justify-between">
                  Password
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-primary hover:text-primary_container text-xs font-bold uppercase transition-colors"
                    suppressHydrationWarning
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface_container_high text-on_surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20 shadow-sm"
                  suppressHydrationWarning
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={cn(
                    "w-full rounded-full py-3.5 px-4 font-bold text-sm bg-signature-gradient text-on_primary shadow-ambient transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                    loading && "opacity-70 pointer-events-none"
                  )}
                  suppressHydrationWarning
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <p className="text-xs text-on_surface text-center mb-6 border border-primary/20 bg-primary/5 p-3 rounded-lg">
                We detected a login from a new device. Please enter the 6-digit code sent to your registered email.
              </p>
              
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                     key={idx}
                     type="text"
                     maxLength={1}
                     value={digit}
                     onChange={(e) => {
                       const newDigits = [...otpDigits];
                       newDigits[idx] = e.target.value;
                       setOtpDigits(newDigits);
                       // Auto-focus next input
                       if (e.target.value && idx < 5) {
                         const nextInput = e.target.nextElementSibling as HTMLInputElement;
                         if (nextInput) nextInput.focus();
                       }
                     }}
                     className="w-12 h-14 text-center text-xl font-bold font-manrope bg-surface_container_high text-on_surface rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                     suppressHydrationWarning
                  />
                ))}
              </div>
              
              <div className="pt-6">
                 <button 
                  type="submit" 
                  disabled={loading}
                  className={cn(
                    "w-full rounded-full py-3.5 px-4 font-bold text-sm bg-signature-gradient text-on_primary shadow-ambient transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                    loading && "opacity-70 pointer-events-none"
                  )}
                  suppressHydrationWarning
                >
                  {loading ? "Verifying..." : "Verify Device"}
                </button>
              </div>
              
              <div className="text-center mt-4">
                 <button type="button" className="text-sm font-bold text-primary hover:underline" suppressHydrationWarning>Resend OTP</button>
              </div>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-on_surface_variant">
              Don&apos;t have an account? <a href="#" className="font-semibold text-primary hover:text-primary_container ml-1">Request Access</a>
            </p>
          </div>
        </CardBody>
      </KnowledgeCard>

    </div>
  );
}
