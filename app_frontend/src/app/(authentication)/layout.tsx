const AuthenticationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
};

export default AuthenticationLayout;
