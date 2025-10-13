import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { DayPicker } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

export type BirthdayPickerProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  buttonClassName?: string
  id?: string
  dataTestId?: string
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function BirthdayPicker({
  value,
  onChange,
  placeholder = "Pick your birthday",
  disabled,
  className,
  buttonClassName,
  id,
  dataTestId,
}: BirthdayPickerProps) {
  const [date, setDate] = React.useState<Date>(value || new Date())
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Generate year options from 1900 to current year
  const currentYear = new Date().getFullYear()
  const years = React.useMemo(() => {
    const yearArray = []
    for (let year = currentYear; year >= 1900; year--) {
      yearArray.push(year)
    }
    return yearArray
  }, [currentYear])

  const handleYearChange = (yearStr: string) => {
    const newDate = new Date(date)
    newDate.setFullYear(parseInt(yearStr))
    setDate(newDate)
  }

  const handleMonthChange = (monthStr: string) => {
    const monthIndex = months.indexOf(monthStr)
    const newDate = new Date(date)
    newDate.setMonth(monthIndex)
    setDate(newDate)
  }

  const handleDaySelect = (selectedDate: Date | undefined) => {
    onChange?.(selectedDate)
    setIsOpen(false)
  }

  const goToNextMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(date.getMonth() + 1)
    setDate(newDate)
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(date.getMonth() - 1)
    setDate(newDate)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            buttonClassName
          )}
          data-testid={dataTestId}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
        <div className="p-3">
          {/* Month and Year Selectors */}
          <div className="flex gap-2 mb-3">
            <Select 
              value={months[date.getMonth()]} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="flex-1" data-testid="select-month">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={date.getFullYear().toString()} 
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px]" data-testid="select-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar Grid */}
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            month={date}
            onMonthChange={setDate}
            disabled={disabled}
            showOutsideDays
            className="rounded-md border-0"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "hidden",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside:
                "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => (
                <ChevronLeft 
                  className="h-4 w-4" 
                  onClick={goToPreviousMonth}
                />
              ),
              IconRight: () => (
                <ChevronRight 
                  className="h-4 w-4" 
                  onClick={goToNextMonth}
                />
              ),
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { BirthdayPicker }