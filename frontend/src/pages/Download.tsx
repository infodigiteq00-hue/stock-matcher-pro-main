import { Download as DownloadIcon, Monitor, Apple, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InstallerOption = {
  os: string;
  icon: typeof Monitor;
  description: string;
  href: string;
  fileLabel: string;
};

const installerOptions: InstallerOption[] = [
  {
    os: "Windows",
    icon: Monitor,
    description: "Recommended for Windows 10/11 (64-bit).",
    href: "/downloads/Stock Matcher Pro Setup 0.0.0.exe",
    fileLabel: "Stock Matcher Pro Setup (.exe)",
  },
  {
    os: "macOS",
    icon: Apple,
    description: "Installer for modern macOS devices.",
    href: "/downloads/Stock Matcher Pro-0.0.0.dmg",
    fileLabel: "Stock Matcher Pro (.dmg)",
  },
  {
    os: "Linux",
    icon: HardDrive,
    description: "Use AppImage or DEB package based on your distro.",
    href: "/downloads/Stock Matcher Pro-0.0.0.AppImage",
    fileLabel: "Stock Matcher Pro (.AppImage)",
  },
];

const Download = () => (
  <div className="min-h-screen bg-background px-6 py-10">
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Download Stock Matcher Pro Desktop App</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Install the desktop app first. After installation, open the app and use the existing signup/login flow
          inside the desktop application.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {installerOptions.map((option) => {
          const Icon = option.icon;

          return (
            <Card key={option.os} className="flex h-full flex-col">
              <CardHeader className="space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-muted/50">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle>{option.os}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <p className="text-sm text-muted-foreground">{option.fileLabel}</p>
                <Button asChild className="w-full">
                  <a href={option.href} download>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download Installer
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Current authentication behavior remains unchanged.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Download the installer for your operating system.</p>
          <p>2. Install and open Stock Matcher Pro desktop app.</p>
          <p>3. Signup or login from the desktop app screens.</p>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Already installed?{" "}
        <Link className="text-primary underline-offset-4 hover:underline" to="/login">
          Go to login
        </Link>
      </div>
    </div>
  </div>
);

export default Download;
