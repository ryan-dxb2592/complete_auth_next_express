import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";

const AuthenticationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-svh flex items-center justify-center p-4 sm:p-8 bg-muted">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex justify-center items-center size-6 rounded-md bg-primary text-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
          </div>
          Auth App
        </Link>
        {children}
      </div>
    </div>
  );
};

export default AuthenticationLayout;
