import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Tag,
  Users,
  Flag,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { format, addMonths, subMonths, parseISO, addDays } from "date-fns";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
// Type imports removed - types are now JSDoc comments in types/index.js
import { Badge } from "@/components/ui/badge";

export default function Calendar() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [viewType, setViewType] = useState("month");
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "meeting",
    start: new Date().toISOString(),
    end: addDays(new Date(), 1).toISOString(),
    allDay: false,
    attendees: [],
  });
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isViewEventDialogOpen, setIsViewEventDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsInitialLoading(true);
        const eventsData = await apiService.getEvents();
        setAllEvents(eventsData);
        setFilteredEvents(eventsData);
      } catch (error) {
        console.error("Error loading events:", error);
        toast.error("Failed to load events");
        // Set empty arrays on error to prevent blank display
        setAllEvents([]);
        setFilteredEvents([]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Filter events based on selected type
  useEffect(() => {
    if (eventTypeFilter === "all") {
      setFilteredEvents(allEvents);
    } else {
      setFilteredEvents(
        allEvents.filter((event) => event.type === eventTypeFilter)
      );
    }
  }, [eventTypeFilter, allEvents]);

  // Helper function to generate time options
  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hour = i < 10 ? `0${i}` : `${i}`;
        const minute = j === 0 ? "00" : `${j}`;
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  };

  // Helper function to handle event creation
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    // Get user email from user object or localStorage
    const userEmail = user?.email || localStorage.getItem('currentUserEmail') || "";

    if (!userEmail) {
      toast.error("Unable to identify user. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      const createdEvent = await apiService.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay,
        attendees: newEvent.attendees,
        createdByEmail: userEmail,
      });

      setAllEvents([...allEvents, createdEvent]);
      setIsAddEventDialogOpen(false);
      toast.success("Event created successfully");

      // Reset form
      setNewEvent({
        title: "",
        description: "",
        type: "meeting",
        start: new Date().toISOString(),
        end: addDays(new Date(), 1).toISOString(),
        allDay: false,
        attendees: [],
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to delete event
  const handleDeleteEvent = async (id) => {
    setIsLoading(true);
    try {
      await apiService.deleteEvent(id);
      setAllEvents(allEvents.filter((event) => event.id !== id));
      setIsViewEventDialogOpen(false);
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(error.message || "Failed to delete event");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if a day has events (removed as it was unused)

  // Helper function to safely format dates
  const safeFormatDate = (dateString, formatString) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, formatString);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };

  // Get event color based on type
  const getEventColor = (type) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "training":
        return "bg-green-100 text-green-800 border-green-300";
      case "holiday":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "review":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Get events for the current month view
  const getMonthViewEvents = () => {
    return filteredEvents.filter((event) => {
      if (!event || !event.start) return false;
      try {
        const eventStart = parseISO(event.start);
        if (isNaN(eventStart.getTime())) return false;

        const firstDayOfMonth = new Date(
          month.getFullYear(),
          month.getMonth(),
          1
        );
        const lastDayOfMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        return eventStart >= firstDayOfMonth && eventStart <= lastDayOfMonth;
      } catch (error) {
        console.error("Error parsing event start date:", error, event);
        return false;
      }
    });
  };

  // Get events for the current day
  const getDayEvents = (day) => {
    if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
      return [];
    }

    return filteredEvents.filter((event) => {
      if (!event || !event.start) return false;
      try {
        const eventStart = parseISO(event.start);
        if (isNaN(eventStart.getTime())) return false;

        return (
          eventStart.getDate() === day.getDate() &&
          eventStart.getMonth() === day.getMonth() &&
          eventStart.getFullYear() === day.getFullYear()
        );
      } catch (error) {
        console.error("Error parsing event start date:", error, event);
        return false;
      }
    });
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and company events
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage your schedule and company events
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={viewType} onValueChange={(value) => setViewType(value)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select
            value={eventTypeFilter}
            onValueChange={(value) => setEventTypeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="holiday">Holidays</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
            </SelectContent>
          </Select>
          <Dialog
            open={isAddEventDialogOpen}
            onOpenChange={setIsAddEventDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Create a new event on your calendar
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="title" className="text-right pt-2">
                    Title
                  </Label>
                  <Input
                    id="title"
                    className="col-span-3"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Event Type
                  </Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, type: value })
                    }>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Start Date</Label>
                  <div className="col-span-3 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={format(
                          parseISO(newEvent.start || new Date().toISOString()),
                          "yyyy-MM-dd"
                        )}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = format(
                            parseISO(
                              newEvent.start || new Date().toISOString()
                            ),
                            "HH:mm:ss"
                          );
                          const newDate = new Date(`${date}T${time}`);
                          setNewEvent({
                            ...newEvent,
                            start: newDate.toISOString(),
                          });
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        value={format(
                          parseISO(newEvent.start || new Date().toISOString()),
                          "HH:mm"
                        )}
                        onValueChange={(value) => {
                          const date = format(
                            parseISO(
                              newEvent.start || new Date().toISOString()
                            ),
                            "yyyy-MM-dd"
                          );
                          const newDate = new Date(`${date}T${value}:00`);
                          setNewEvent({
                            ...newEvent,
                            start: newDate.toISOString(),
                          });
                        }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions().map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">End Date</Label>
                  <div className="col-span-3 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={format(
                          parseISO(newEvent.end || new Date().toISOString()),
                          "yyyy-MM-dd"
                        )}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = format(
                            parseISO(newEvent.end || new Date().toISOString()),
                            "HH:mm:ss"
                          );
                          const newDate = new Date(`${date}T${time}`);
                          setNewEvent({
                            ...newEvent,
                            end: newDate.toISOString(),
                          });
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        value={format(
                          parseISO(newEvent.end || new Date().toISOString()),
                          "HH:mm"
                        )}
                        onValueChange={(value) => {
                          const date = format(
                            parseISO(newEvent.end || new Date().toISOString()),
                            "yyyy-MM-dd"
                          );
                          const newDate = new Date(`${date}T${value}:00`);
                          setNewEvent({
                            ...newEvent,
                            end: newDate.toISOString(),
                          });
                        }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions().map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddEventDialogOpen(false)}
                  disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={isLoading || !newEvent.title.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Save Event"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-0">
        {viewType === "month" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMonth(subMonths(month, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="whitespace-nowrap text-lg font-medium">
                  {format(month, "MMMM yyyy")}
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMonth(addMonths(month, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setMonth(new Date());
                }}>
                Today
              </Button>
            </CardHeader>
            <CardContent className="pt-0 px-4 sm:px-6 pb-6">
              <div className="mt-4 w-full">
                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-lg">
                  <CalendarComponent
                    mode="single"
                    month={month}
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    className="w-full"
                    modifiersClassNames={{
                      selected:
                        "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-semibold shadow-md",
                      today:
                        "bg-accent/30 font-semibold ring-2 ring-primary/20",
                    }}
                    modifiersStyles={{
                      selected: { fontWeight: "bold" },
                    }}
                    styles={{
                      day: {
                        height: "110px",
                        width: "100%",
                      },
                      cell: {
                        height: "110px",
                        width: "100%",
                      },
                    }}
                    classNames={{
                      table: "w-full border-collapse",
                      head_row: "border-b-2 border-border bg-muted/30",
                      head_cell:
                        "text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-4 px-1 border-r border-border last:border-r-0",
                      row: "border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors",
                      cell: "h-[110px] p-0 relative border-r border-border/50 last:border-r-0 align-top w-[14.28%] bg-background hover:bg-muted/10 transition-colors",
                      day: "h-full w-full",
                    }}
                    components={{
                      Row: ({ children, ...props }) => {
                        return (
                          <tr
                            {...props}
                            className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors">
                            {children}
                          </tr>
                        );
                      },
                      Cell: ({ children, ...props }) => {
                        return (
                          <td
                            {...props}
                            className="h-[110px] p-0 relative border-r border-border/50 last:border-r-0 align-top w-[14.28%] bg-background hover:bg-muted/10 transition-colors">
                            {children}
                          </td>
                        );
                      },
                      Day: ({ date, ...props }) => {
                        if (
                          !date ||
                          !(date instanceof Date) ||
                          isNaN(date.getTime())
                        ) {
                          return (
                            <button
                              {...props}
                              className="relative h-full w-full p-2.5 flex items-start justify-start hover:bg-muted/30 transition-all duration-200 rounded-md"
                            />
                          );
                        }
                        const dayEvents = getDayEvents(date);
                        const isToday =
                          format(date, "yyyy-MM-dd") ===
                          format(new Date(), "yyyy-MM-dd");
                        return (
                          <button
                            {...props}
                            className={`relative h-full w-full p-2.5 text-left flex flex-col items-start justify-start transition-all duration-200 rounded-md ${
                              isToday
                                ? "bg-accent/30 ring-2 ring-primary/20"
                                : "hover:bg-muted/30"
                            }`}>
                            <div
                              className={`text-sm font-bold mb-2 w-full flex items-center justify-between ${
                                isToday ? "text-primary" : "text-foreground"
                              }`}>
                              <span>{format(date, "d")}</span>
                              {dayEvents.length > 0 && (
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                  {dayEvents.length}
                                </span>
                              )}
                            </div>
                            <div className="w-full flex-1 overflow-y-auto max-h-[65px] space-y-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                              {dayEvents.slice(0, 3).map((event, i) => (
                                <div
                                  key={i}
                                  className={`text-[10px] font-medium truncate py-1.5 px-2 rounded-md cursor-pointer w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${getEventColor(
                                    event.type
                                  )}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    setIsViewEventDialogOpen(true);
                                  }}>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></div>
                                    <span className="truncate">
                                      {event.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-[10px] text-muted-foreground font-semibold pt-1 text-center">
                                  +{dayEvents.length - 3} more
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      },
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {viewType === "list" && (
          <>
            <CardHeader className="pb-2 px-6">
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>All scheduled events</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-4">
              <div className="space-y-4">
                {getMonthViewEvents().length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px]">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-muted-foreground mt-1">
                      Create a new event to get started
                    </p>
                  </div>
                ) : (
                  getMonthViewEvents()
                    .filter((event) => event && event.start)
                    .sort((a, b) => {
                      try {
                        const aTime = new Date(a.start).getTime();
                        const bTime = new Date(b.start).getTime();
                        if (isNaN(aTime) || isNaN(bTime)) return 0;
                        return aTime - bTime;
                      } catch {
                        return 0;
                      }
                    })
                    .map((event) => (
                      <Card
                        key={event.id}
                        className="overflow-hidden cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsViewEventDialogOpen(true);
                        }}>
                        <CardHeader
                          className={`py-3 ${getEventColor(event.type)}`}>
                          <CardTitle className="text-base">
                            {event.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {safeFormatDate(event.start, "MMM dd, yyyy")}
                              </span>
                              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                              <span>
                                {safeFormatDate(event.start, "hh:mm a")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{event.type}</span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </>
        )}

        {viewType === "day" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDate(addDays(date, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="whitespace-nowrap text-lg font-medium">
                  {format(date, "EEEE, MMMM dd, yyyy")}
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDate(addDays(date, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setDate(new Date());
                }}>
                Today
              </Button>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-4">
              <div className="mt-4 space-y-1">
                {getDayEvents(date).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px]">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No events for today</p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsAddEventDialogOpen(true)}>
                      Create an event
                    </Button>
                  </div>
                ) : (
                  getDayEvents(date)
                    .filter((event) => event && event.start)
                    .sort((a, b) => {
                      try {
                        const aTime = new Date(a.start).getTime();
                        const bTime = new Date(b.start).getTime();
                        if (isNaN(aTime) || isNaN(bTime)) return 0;
                        return aTime - bTime;
                      } catch {
                        return 0;
                      }
                    })
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-md mb-2 cursor-pointer ${getEventColor(
                          event.type
                        )}`}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsViewEventDialogOpen(true);
                        }}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="capitalize">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {safeFormatDate(event.start, "hh:mm a")} -{" "}
                            {safeFormatDate(event.end, "hh:mm a")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm mt-2">{event.description}</p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </>
        )}

        {viewType === "week" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDate(addDays(date, -7))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="whitespace-nowrap text-lg font-medium">
                  Week of {format(date, "MMMM dd, yyyy")}
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDate(addDays(date, 7))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setDate(new Date());
                }}>
                This Week
              </Button>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-4">
              <div className="mt-4">
                <div className="grid grid-cols-7 gap-2 text-center border-b pb-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="font-medium text-sm">
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {/* Calculate the correct days for the week */}
                  {Array.from({ length: 7 }).map((_, i) => {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    const day = addDays(weekStart, i);
                    const dayEvents = getDayEvents(day);
                    return (
                      <div
                        key={i}
                        className={`border rounded-md p-2 min-h-[120px] flex flex-col ${
                          format(day, "yyyy-MM-dd") ===
                          format(new Date(), "yyyy-MM-dd")
                            ? "bg-muted/50 border-primary"
                            : ""
                        }`}>
                        <div className="text-right text-sm font-medium mb-2">
                          {format(day, "d")}
                        </div>
                        <div className="flex-1 space-y-1 overflow-y-auto">
                          {dayEvents.map((event, j) => (
                            <div
                              key={j}
                              className={`text-xs truncate p-1.5 rounded cursor-pointer w-full ${getEventColor(
                                event.type
                              )}`}
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsViewEventDialogOpen(true);
                              }}>
                              <div className="font-medium">
                                {safeFormatDate(event.start, "h:mm a")}
                              </div>
                              <div className="truncate">{event.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* View Event Dialog */}
      <Dialog
        open={isViewEventDialogOpen}
        onOpenChange={setIsViewEventDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                  <Badge className="capitalize">{selectedEvent.type}</Badge>
                </div>
                <DialogDescription>Event details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {safeFormatDate(
                        selectedEvent.start,
                        "EEEE, MMMM dd, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {safeFormatDate(selectedEvent.start, "h:mm a")} -{" "}
                      {safeFormatDate(selectedEvent.end, "h:mm a")}
                    </span>
                  </div>
                  {selectedEvent.description && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                  {selectedEvent.attendees &&
                    selectedEvent.attendees.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Attendees</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.attendees.map((attendeeId, index) => (
                            <Badge
                              key={attendeeId || index}
                              variant="secondary"
                              className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {attendeeId || "Unknown"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" /> Delete
                    </>
                  )}
                </Button>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 mr-2"
                    onClick={() => {
                      // Edit functionality can be implemented later
                      setIsViewEventDialogOpen(false);
                    }}>
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsViewEventDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
