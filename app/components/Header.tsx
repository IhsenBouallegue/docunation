import { Logo } from "@/components/logo";

export function Header() {
  return (
    <header className="py-6 mb-6 w-full flex flex-col justify-center items-center">
      <Logo className="mb-2 m-auto" />
      <p className="text-muted-foreground">Your personal document companion</p>
    </header>
  );
}
