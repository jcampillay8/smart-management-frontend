// @ts-nocheck
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker> & {
  onMonthChange?: (date: Date) => void;
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange,
  ...props
}: EnhancedCalendarProps) {
  const [view, setView] = React.useState<"days" | "months" | "years">("days");
  const [internalMonth, setInternalMonth] = React.useState(controlledMonth ?? new Date());
  const displayMonth = controlledMonth ?? internalMonth;

  const handleMonthChange = (d: Date) => {
    setInternalMonth(d);
    onMonthChange?.(d);
  };

  const handleSelectMonth = (monthIdx: number) => {
    const d = new Date(displayMonth);
    d.setMonth(monthIdx);
    handleMonthChange(d);
    setView("days");
  };

  const handleSelectYear = (year: number) => {
    const d = new Date(displayMonth);
    d.setFullYear(year);
    handleMonthChange(d);
    setView("months");
  };

  const currentYear = displayMonth.getFullYear();
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  if (view === "months") {
    return (
      <div className={cn("p-3 pointer-events-auto", className)}>
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => {
            const d = new Date(displayMonth);
            d.setFullYear(d.getFullYear() - 1);
            handleMonthChange(d);
          }}><ChevronLeft className="h-4 w-4" /></Button>
          <button
            onClick={() => setView("years")}
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            {currentYear}
          </button>
          <Button variant="ghost" size="sm" onClick={() => {
            const d = new Date(displayMonth);
            d.setFullYear(d.getFullYear() + 1);
            handleMonthChange(d);
          }}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => handleSelectMonth(i)}
              className={cn(
                "rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent",
                i === displayMonth.getMonth() && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setView("days")} className="text-xs">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (view === "years") {
    return (
      <div className={cn("p-3 pointer-events-auto", className)}>
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => {
            const d = new Date(displayMonth);
            d.setFullYear(d.getFullYear() - 10);
            handleMonthChange(d);
          }}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold">{yearRange[0]} — {yearRange[yearRange.length - 1]}</span>
          <Button variant="ghost" size="sm" onClick={() => {
            const d = new Date(displayMonth);
            d.setFullYear(d.getFullYear() + 10);
            handleMonthChange(d);
          }}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {yearRange.map(y => (
            <button
              key={y}
              onClick={() => handleSelectYear(y)}
              className={cn(
                "rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent",
                y === currentYear && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setView("months")} className="text-xs">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("pointer-events-auto", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        fixedWeeks
        month={displayMonth}
        onMonthChange={handleMonthChange}
        className="p-3"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium cursor-pointer hover:text-primary transition-colors",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
          CaptionLabel: ({ displayMonth: dm }) => (
            <button
              onClick={() => setView("months")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {MONTHS[dm.getMonth()]} {dm.getFullYear()}
            </button>
          ),
        }}
        {...props}
      />
    </div>
  );
}
EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar };
