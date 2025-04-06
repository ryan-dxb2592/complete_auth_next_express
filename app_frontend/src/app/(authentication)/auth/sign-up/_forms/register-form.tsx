"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/common/password-input";
import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import signUpFormSchema, {
  SignUpFormValues,
} from "@/lib/schemas/sign-up-schema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import {Google} from "developer-icons"

const RegisterForm: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { control } = form;

  const onSubmit = useCallback((data: SignUpFormValues) => {
    console.log(data);
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card>
      <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with Email or Google account
          </CardDescription>
        </CardHeader>
          <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

{/* Google Sign In Button */}
<div className="flex ">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                >
                    <Google className="size-4 " />
                  <span >Sign up with Google</span>
                </Button>
              </div>
{/* End of Google Sign In Button */}

<div className="relative text-sm text-center after:border-border after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="relative z-10 px-2 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>

              {/* Email Sign In Form */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="m@example.com"
                          type="email"
                          // disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Password"
                          // disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Confirm Password"
                          // disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div id="clerk-captcha" />
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  // disabled={isLoading}
                >
                  {/* {isLoading ? (
                    <>
                      <Spinner className="mr-2" size="small" />
                      Creating account...
                    </>
                  ) : ( */}
                    Sign Up
                  {/* )} */}
                </Button>
              </div>
              <div className="text-sm text-center">
                Already have an account?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
};

export default RegisterForm;
