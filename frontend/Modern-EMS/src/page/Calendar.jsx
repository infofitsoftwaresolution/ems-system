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
} from "lucide-react";
import { format, addMonths, subMonths, parseISO, addDays } from "date-fns";
import { events, users } from "@/lib/data";
// Type imports removed - types are now JSDoc comments in types/index.js
import { Badge } from "@/components/ui/badge";

export default function Calendar() {
  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [viewType, setViewType] = useState("month");
  const [allEvents, setAllEvents] = useState(events);
  const [filteredEvents, setFilteredEvents] = useState(events);
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
  const handleCreateEvent = () => {
    const newEventWithId = {
      id: `e${allEvents.length + 1}`,
      ...newEvent,
    };
    setAllEvents([...allEvents, newEventWithId]);
    setIsAddEventDialogOpen(false);
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
  };

  // Helper function to delete event
  const handleDeleteEvent = (id) => {
    setAllEvents(allEvents.filter((event) => event.id !== id));
    setIsViewEventDialogOpen(false);
  };

  // Function to check if a day has events (removed as it was unused)

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
      const eventStart = parseISO(event.start);
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
    });
  };

  // Get events for the current day
  const getDayEvents = (day) => {
    return filteredEvents.filter((event) => {
      const eventStart = parseISO(event.start);
      return (
        eventStart.getDate() === day.getDate() &&
        eventStart.getMonth() === day.getMonth() &&
        eventStart.getFullYear() === day.getFullYear()
      );
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage your schedule and company events
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Tabs value={viewType} onValueChange={(value) => setViewType(value)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select
            value={eventTypeFilter}
            onValueChange={(value) => setEventTypeFilter(value)}>
            <SelectTrigger className="w-[180px]">
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
              <Button>
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Start Date</Label>
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">End Date</Label>
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
                  onClick={() => setIsAddEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>Save Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-0">
        {viewType === "month" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <CardContent className="pt-0">
              <div className="mt-4">
                <CalendarComponent
                  mode="single"
                  month={month}
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  className="rounded-md border"
                  modifiersClassNames={{
                    selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  }}
                  modifiersStyles={{
                    selected: { fontWeight: "bold" },
                  }}
                  styles={{
                    day: {
                      height: "100px",
                    },
                  }}
                  components={{
                    Day: ({ date, ...props }) => {
                      const dayEvents = getDayEvents(date);
                      return (
                        <div {...props} className="relative h-full p-1">
                          <div>{format(date, "d")}</div>
                          <div className="mt-1 overflow-y-auto max-h-[60px]">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className={`text-[10px] truncate py-1 px-1.5 rounded my-0.5 cursor-pointer ${getEventColor(
                                  event.type
                                )}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setIsViewEventDialogOpen(true);
                                }}>
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] text-gray-500">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  }}
                />
              </div>
            </CardContent>
          </>
        )}

        {viewType === "list" && (
          <>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>All scheduled events</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
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
                    .sort(
                      (a, b) =>
                        new Date(a.start).getTime() -
                        new Date(b.start).getTime()
                    )
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
                                {format(parseISO(event.start), "MMM dd, yyyy")}
                              </span>
                              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                              <span>
                                {format(parseISO(event.start), "hh:mm a")}
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <CardContent className="pt-0">
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
                    .sort(
                      (a, b) =>
                        new Date(a.start).getTime() -
                        new Date(b.start).getTime()
                    )
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
                            {format(parseISO(event.start), "hh:mm a")} -{" "}
                            {format(parseISO(event.end), "hh:mm a")}
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <CardContent className="pt-0">
              <div className="mt-4">
                <div className="grid grid-cols-7 gap-1 text-center border-b pb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="font-medium text-sm">
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {/* This is a simplified week view - in a real app, you would calculate the correct days for the week */}
                  {Array.from({ length: 7 }).map((_, i) => {
                    const day = addDays(
                      new Date(date.setDate(date.getDate() - date.getDay())),
                      i
                    );
                    const dayEvents = getDayEvents(day);
                    return (
                      <div
                        key={i}
                        className={`border rounded-md p-2 min-h-[100px] ${
                          format(day, "yyyy-MM-dd") ===
                          format(new Date(), "yyyy-MM-dd")
                            ? "bg-muted/50"
                            : ""
                        }`}>
                        <div className="text-right text-sm font-medium mb-1">
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event, j) => (
                            <div
                              key={j}
                              className={`text-xs truncate p-1 rounded cursor-pointer ${getEventColor(
                                event.type
                              )}`}
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsViewEventDialogOpen(true);
                              }}>
                              {format(parseISO(event.start), "h:mm a")} -{" "}
                              {event.title}
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
                      {format(
                        parseISO(selectedEvent.start),
                        "EEEE, MMMM dd, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(parseISO(selectedEvent.start), "h:mm a")} -{" "}
                      {format(parseISO(selectedEvent.end), "h:mm a")}
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
                          {selectedEvent.attendees.map((attendeeId) => {
                            const attendee = users.find(
                              (u) => u.id === attendeeId
                            );
                            return (
                              <Badge
                                key={attendeeId}
                                variant="secondary"
                                className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {attendee ? attendee.name : "Unknown"}
                              </Badge>
                            );
                          })}
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
                  onClick={() => handleDeleteEvent(selectedEvent.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 mr-2"
                    onClick={() => {
                      // In a real app, you would implement edit functionality
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
