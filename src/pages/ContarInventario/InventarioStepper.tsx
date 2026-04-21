// src/pages/ContarInventario/InventarioStepper.tsx

import { Check, ClipboardList, Eye, Box } from "lucide-react";
import { cn } from "../../lib/utils";
import { Step } from "./types";

interface InventarioStepperProps {
  currentStep: Step;
}

export function InventarioStepper({ currentStep }: InventarioStepperProps) {
  const steps = [
    { id: "idle", label: "Selección", icon: Box },
    { id: "counting", label: "Conteo Físico", icon: ClipboardList },
    { id: "reviewing", label: "Revisión", icon: Eye },
  ];

  // Determinar el índice del paso actual para calcular el progreso
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="relative flex justify-between w-full max-w-2xl mx-auto mb-8">
      {/* Línea de progreso de fondo */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10" />
      
      {/* Línea de progreso activa */}
      <div 
        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10" 
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                isCompleted 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : isActive 
                    ? "border-primary text-primary ring-4 ring-primary/10" 
                    : "border-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}