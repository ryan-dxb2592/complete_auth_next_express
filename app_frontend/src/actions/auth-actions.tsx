'use server'


// Google Sign In
export const googleSignIn = async (code: string) => {
  const response = await fetch("http://localhost:8000/api/v1/auth/google-auth", {
    method: "POST",
    body: JSON.stringify({ code }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

