"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, FileCheck, Plane, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Application {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiredDocs: string[];
  status: "available" | "in_progress" | "completed";
}

const applications: Application[] = [
  {
    id: "visa",
    title: "Visa Application",
    description: "Apply for a travel or work visa",
    icon: <Plane className="w-5 h-5" />,
    requiredDocs: ["Passport", "Bank Statements", "Employment Letter"],
    status: "available",
  },
  {
    id: "insurance",
    title: "Travel Insurance",
    description: "Get comprehensive travel insurance",
    icon: <Shield className="w-5 h-5" />,
    requiredDocs: ["Passport", "Travel Itinerary", "Medical History"],
    status: "available",
  },
  {
    id: "housing",
    title: "Housing Application",
    description: "Apply for residential housing",
    icon: <Building2 className="w-5 h-5" />,
    requiredDocs: ["ID Document", "Income Proof", "Bank Statements"],
    status: "available",
  },
  {
    id: "flight",
    title: "Flight Booking",
    description: "Book international flights",
    icon: <Plane className="w-5 h-5" />,
    requiredDocs: ["Passport", "Visa", "Travel Insurance"],
    status: "available",
  },
];

export default function ApplicationsList() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleStartApplication = (appId: string) => {
    setSelectedApp(appId);
    toast.info("Starting application process", {
      description: "This feature is coming soon!",
    });
  };

  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          Available Applications
        </CardTitle>
        <CardDescription>Start an application using your uploaded documents</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <div className={`p-2 rounded-full ${getStatusColor(app.status)}`}>{app.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{app.title}</h3>
                <Badge variant="secondary" className="capitalize">
                  {app.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{app.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {app.requiredDocs.map((doc) => (
                  <Badge key={doc} variant="outline" className="text-xs">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleStartApplication(app.id)} className="shrink-0">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
