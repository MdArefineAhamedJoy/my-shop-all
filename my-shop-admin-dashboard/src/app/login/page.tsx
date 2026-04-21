"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import type { Role } from "@/types/auth";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Welcome back!", {
        description: `Successfully signed in as ${role}.`,
      });

      router.push("/");
    } catch {
      toast.error("Authentication failed", {
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-slate-900 p-6 rounded shadow-xl border border-slate-200 dark:border-slate-800">

   
       
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-lg">
            Sign in to your dashboard
          </p>
        </div>

        {/* Role Tabs */}
        <Tabs
          defaultValue="Admin"
          onValueChange={(v) => setRole(v as Role)}
        >
          <TabsList className="grid grid-cols-3 h-12 border">
            <TabsTrigger value="Admin" className="text-md font-bold cursor-pointer">Admin</TabsTrigger>
            <TabsTrigger value="Staff" className="text-md font-bold cursor-pointer">Staff</TabsTrigger>
            <TabsTrigger value="Customer" className="text-md font-bold cursor-pointer">User</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold text-lg mb-2">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        placeholder="admin@myshop.com"
                        className="pl-12 h-11 text-xl md:text-xl bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center  mb-1">
                    <FormLabel className="text-slate-900 font-semibold text-lg">Password</FormLabel>
                    <button type="button" className="text-sm font-medium text-primary hover:underline">
                      Forgot Password?
                    </button>
                  </div>

                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pl-12 pr-12 h-11 text-xl md:text-xl bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        {...field}
                      />

                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember */}
            <FormField
              name="remember"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      className="w-5 h-5 cursor-pointer"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-slate-900 font-semibold text-md cursor-pointer">
                    Keep me signed in
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button className="w-full h-11 text-xl md:text-xl font-bold shadow-lg shadow-primary/20 cursor-pointer" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="animate-spin mr-2" size={24} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Don’t have an account?{" "}
          <span className="text-primary cursor-pointer">
            Contact admin to create an account
          </span>
        </p>
      </div>
    </div>
  );
}