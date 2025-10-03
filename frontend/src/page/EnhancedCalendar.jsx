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
  Sparkles,
  Zap,
  Star,
  Target,
  Award,
  TrendingUp,
} from "lucide-react";
import { format, addMonths, subMonths, parseISO, addDays } from "date-fns";
import { events, users } from "@/lib/data";
// TypeScript types removed - using JSDoc for type hints
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedParticleBackground } from "@/components/ui/enhanced-particle-background";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";

export default function EnhancedCalendar() {
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
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

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

  // Trigger animation when view changes
  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [viewType, month]);

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

  // Get event color based on type with enhanced styling
  const getEventColor = (type) => {
    switch (type) {
      case "meeting":
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 shadow-blue-100";
      case "training":
        return "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300 shadow-green-100";
      case "holiday":
        return "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border-amber-300 shadow-amber-100";
      case "review":
        return "bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border-purple-300 shadow-purple-100";
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border-gray-300 shadow-gray-100";
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

  // Get event type icon
  const getEventTypeIcon = (type) => {
    switch (type) {
      case "meeting":
        return <Users className="h-3 w-3" />;
      case "training":
        return <Target className="h-3 w-3" />;
      case "holiday":
        return <Star className="h-3 w-3" />;
      case "review":
        return <Award className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const eventVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="relative flex flex-col gap-6 min-h-screen">
      {/* Enhanced Background */}
      <AnimatedGradientBackground
        intensity="subtle"
        speed="slow"
        className="fixed inset-0 z-0"
      />

      <div className="absolute inset-0 z-10">
        <EnhancedParticleBackground
          particleCount={40}
          particleSize={3}
          particleColors={[
            "rgba(59, 130, 246, 0.4)",
            "rgba(99, 102, 241, 0.4)",
            "rgba(139, 92, 246, 0.4)",
          ]}
          connectParticles={true}
          interactive={true}
          intensity="medium"
        />
      </div>

      <motion.div
        className="relative z-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="h-8 w-8 text-blue-500" />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Interactive Calendar
            </h1>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              <Zap className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage your schedule with style and elegance ✨
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between gap-4">
          <Tabs value={viewType} onValueChange={(value) => setViewType(value)}>
            <TabsList className="backdrop-blur-md bg-white/80 shadow-lg">
              <TabsTrigger
                value="month"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
                Month
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
                Week
              </TabsTrigger>
              <TabsTrigger
                value="day"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
                Day
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Select
                value={eventTypeFilter}
                onValueChange={(value) => setEventTypeFilter(value)}>
                <SelectTrigger className="w-[180px] backdrop-blur-md bg-white/80 shadow-lg border-white/20">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌟 All Events</SelectItem>
                  <SelectItem value="meeting">👥 Meetings</SelectItem>
                  <SelectItem value="training">🎯 Training</SelectItem>
                  <SelectItem value="holiday">⭐ Holidays</SelectItem>
                  <SelectItem value="review">🏆 Reviews</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <Dialog
              open={isAddEventDialogOpen}
              onOpenChange={setIsAddEventDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] backdrop-blur-md bg-white/95">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    Add New Event
                  </DialogTitle>
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
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
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
                        <SelectItem value="meeting">👥 Meeting</SelectItem>
                        <SelectItem value="training">🎯 Training</SelectItem>
                        <SelectItem value="holiday">⭐ Holiday</SelectItem>
                        <SelectItem value="review">🏆 Review</SelectItem>
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
                            parseISO(
                              newEvent.start || new Date().toISOString()
                            ),
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
                            parseISO(
                              newEvent.start || new Date().toISOString()
                            ),
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
                              parseISO(
                                newEvent.end || new Date().toISOString()
                              ),
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
                              parseISO(
                                newEvent.end || new Date().toISOString()
                              ),
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
                  <Button
                    onClick={handleCreateEvent}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Save Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Main Calendar Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewType}-${animationKey}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.5 }}>
            <Card className="backdrop-blur-md bg-white/80 shadow-2xl border-white/20 p-0 overflow-hidden">
              {viewType === "month" && (
                <>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMonth(subMonths(month, 1))}
                          className="backdrop-blur-md bg-white/80">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </motion.div>
                      <motion.h3
                        className="whitespace-nowrap text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.5 }}>
                        {format(month, "MMMM yyyy")}
                      </motion.h3>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMonth(addMonths(month, 1))}
                          className="backdrop-blur-md bg-white/80">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        onClick={() => setMonth(new Date())}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                        Today
                      </Button>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mt-4">
                      <CalendarComponent
                        mode="single"
                        month={month}
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        className="rounded-md border-0"
                        modifiersClassNames={{
                          selected:
                            "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700",
                        }}
                        modifiersStyles={{
                          selected: { fontWeight: "bold" },
                        }}
                        styles={{
                          day: {
                            height: "120px",
                          },
                        }}
                        components={{
                          Day: ({ date, ...props }) => {
                            const dayEvents = getDayEvents(date);
                            const isToday =
                              format(date, "yyyy-MM-dd") ===
                              format(new Date(), "yyyy-MM-dd");
                            return (
                              <motion.div
                                {...props}
                                className={`relative h-full p-2 rounded-lg transition-all duration-300 ${
                                  isToday
                                    ? "bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg"
                                    : "hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50"
                                }`}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}>
                                <div
                                  className={`text-sm font-medium ${
                                    isToday ? "text-blue-700" : ""
                                  }`}>
                                  {format(date, "d")}
                                </div>
                                <div className="mt-1 overflow-y-auto max-h-[80px] space-y-1">
                                  <AnimatePresence>
                                    {dayEvents.slice(0, 3).map((event) => (
                                      <motion.div
                                        key={event.id}
                                        variants={eventVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        whileHover="hover"
                                        className={`text-[10px] truncate py-1 px-2 rounded-full cursor-pointer shadow-sm ${getEventColor(
                                          event.type
                                        )} flex items-center gap-1`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedEvent(event);
                                          setIsViewEventDialogOpen(true);
                                        }}
                                        onMouseEnter={() =>
                                          setHoveredEvent(event.id)
                                        }
                                        onMouseLeave={() =>
                                          setHoveredEvent(null)
                                        }>
                                        {getEventTypeIcon(event.type)}
                                        <span className="flex-1">
                                          {event.title}
                                        </span>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                  {dayEvents.length > 3 && (
                                    <motion.div
                                      className="text-[10px] text-gray-500 font-medium"
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                      }}>
                                      +{dayEvents.length - 3} more ✨
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
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
                  <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>
                      All scheduled events with interactive previews
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {getMonthViewEvents().length === 0 ? (
                        <motion.div
                          className="flex flex-col items-center justify-center h-[300px]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}>
                            <CalendarIcon className="h-16 w-16 text-blue-400 mb-4" />
                          </motion.div>
                          <p className="text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            No events found
                          </p>
                          <p className="text-muted-foreground mt-2">
                            Create your first event to get started ✨
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <Button
                              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                              onClick={() => setIsAddEventDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Event
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <AnimatePresence>
                          {getMonthViewEvents()
                            .sort(
                              (a, b) =>
                                new Date(a.start).getTime() -
                                new Date(b.start).getTime()
                            )
                            .map((event, index) => (
                              <motion.div
                                key={event.id}
                                variants={eventVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                whileHover="hover"
                                transition={{ delay: index * 0.1 }}>
                                <Card
                                  className={`overflow-hidden cursor-pointer backdrop-blur-md bg-white/90 shadow-lg border-white/20 transition-all duration-300 ${
                                    hoveredEvent === event.id
                                      ? "shadow-2xl"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setIsViewEventDialogOpen(true);
                                  }}
                                  onMouseEnter={() => setHoveredEvent(event.id)}
                                  onMouseLeave={() => setHoveredEvent(null)}>
                                  <CardHeader
                                    className={`py-4 ${getEventColor(
                                      event.type
                                    )} border-l-4 border-l-current`}>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      {getEventTypeIcon(event.type)}
                                      {event.title}
                                      <motion.div
                                        animate={{
                                          rotate:
                                            hoveredEvent === event.id ? 360 : 0,
                                        }}
                                        transition={{ duration: 0.5 }}>
                                        <Sparkles className="h-4 w-4 ml-auto" />
                                      </motion.div>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4">
                                    <div className="grid gap-3">
                                      <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">
                                            {format(
                                              parseISO(event.start),
                                              "MMM dd, yyyy"
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span>
                                            {format(
                                              parseISO(event.start),
                                              "hh:mm a"
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <Badge
                                          variant="secondary"
                                          className="capitalize">
                                          {event.type}
                                        </Badge>
                                      </div>
                                      {event.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                          {event.description}
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </CardContent>
                </>
              )}

              {/* Day and Week views with similar enhancements... */}
              {(viewType === "day" || viewType === "week") && (
                <>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setDate(addDays(date, viewType === "day" ? -1 : -7))
                          }
                          className="backdrop-blur-md bg-white/80">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </motion.div>
                      <motion.h3
                        className="whitespace-nowrap text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.5 }}>
                        {viewType === "day"
                          ? format(date, "EEEE, MMMM dd, yyyy")
                          : `Week of ${format(date, "MMMM dd, yyyy")}`}
                      </motion.h3>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setDate(addDays(date, viewType === "day" ? 1 : 7))
                          }
                          className="backdrop-blur-md bg-white/80">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        onClick={() => setDate(new Date())}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                        {viewType === "day" ? "Today" : "This Week"}
                      </Button>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mt-4 space-y-2">
                      {getDayEvents(date).length === 0 ? (
                        <motion.div
                          className="flex flex-col items-center justify-center h-[300px]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}>
                            <CalendarIcon className="h-16 w-16 text-blue-400 mb-4" />
                          </motion.div>
                          <p className="text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            No events for{" "}
                            {viewType === "day" ? "today" : "this week"}
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <Button
                              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                              onClick={() => setIsAddEventDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create an event
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <AnimatePresence>
                          {getDayEvents(date)
                            .sort(
                              (a, b) =>
                                new Date(a.start).getTime() -
                                new Date(b.start).getTime()
                            )
                            .map((event, index) => (
                              <motion.div
                                key={event.id}
                                variants={eventVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                whileHover="hover"
                                transition={{ delay: index * 0.1 }}
                                className={`p-4 rounded-xl cursor-pointer shadow-lg ${getEventColor(
                                  event.type
                                )} border-l-4 border-l-current`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsViewEventDialogOpen(true);
                                }}
                                onMouseEnter={() => setHoveredEvent(event.id)}
                                onMouseLeave={() => setHoveredEvent(null)}>
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-lg flex items-center gap-2">
                                    {getEventTypeIcon(event.type)}
                                    {event.title}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="capitalize font-medium">
                                    {event.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm mt-3">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">
                                    {format(parseISO(event.start), "hh:mm a")} -{" "}
                                    {format(parseISO(event.end), "hh:mm a")}
                                  </span>
                                </div>
                                {event.description && (
                                  <p className="text-sm mt-3 opacity-90">
                                    {event.description}
                                  </p>
                                )}
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* View Event Dialog with enhanced styling */}
        <Dialog
          open={isViewEventDialogOpen}
          onOpenChange={setIsViewEventDialogOpen}>
          <DialogContent className="sm:max-w-[550px] backdrop-blur-md bg-white/95">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <DialogTitle className="flex items-center gap-2">
                      {getEventTypeIcon(selectedEvent.type)}
                      {selectedEvent.title}
                    </DialogTitle>
                    <Badge
                      className={`capitalize ${getEventColor(
                        selectedEvent.type
                      )}`}>
                      {selectedEvent.type}
                    </Badge>
                  </div>
                  <DialogDescription>
                    Event details and information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">
                        {format(
                          parseISO(selectedEvent.start),
                          "EEEE, MMMM dd, yyyy"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                      <Clock className="h-5 w-5 text-green-500" />
                      <span className="font-medium">
                        {format(parseISO(selectedEvent.start), "h:mm a")} -{" "}
                        {format(parseISO(selectedEvent.end), "h:mm a")}
                      </span>
                    </div>
                    {selectedEvent.description && (
                      <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Description
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}
                    {selectedEvent.attendees &&
                      selectedEvent.attendees.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Attendees
                          </h4>
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
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </motion.div>
                  <div className="flex gap-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsViewEventDialogOpen(false)}>
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        onClick={() => setIsViewEventDialogOpen(false)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        Close
                      </Button>
                    </motion.div>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
