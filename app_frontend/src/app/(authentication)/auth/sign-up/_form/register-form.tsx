"use client";

import signUpFormSchema, {
  SignUpFormValues,
} from "@/lib/schemas/sign-up-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { Form, useForm } from "react-hook-form";

const RegisterForm = () => {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      </form>
    </Form>
  );
};

export default RegisterForm;
