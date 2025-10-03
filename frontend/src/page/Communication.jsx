import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Send,
  Phone,
  Video,
  Info,
  MessageSquare,
  Users,
  Mail,
  Bell,
  CalendarDays,
  Clock,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  MoreVertical,
  ChevronRight,
  Flag,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { users } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";

/**
 * @typedef {Object} Message
 * @property {string} id - Message ID
 * @property {string} senderId - Sender ID
 * @property {string|null} recipientId - Recipient ID
 * @property {string|null} channelId - Channel ID
 * @property {string} content - Message content
 * @property {string} timestamp - Message timestamp
 * @property {boolean} read - Whether message is read
 * @property {Array} [attachments] - Message attachments
 */

/**
 * @typedef {Object} Channel
 * @property {string} id - Channel ID
 * @property {string} name - Channel name
 * @property {string} description - Channel description
 * @property {string[]} members - Channel members
 * @property {boolean} isPrivate - Whether channel is private
 * @property {string} createdAt - Creation date
 */

// Sample direct messages data
const directMessages = [
  {
    id: "dm1",
    senderId: "u2",
    recipientId: "u1",
    channelId: null,
    content:
      "Hi there! Just checking if you've reviewed the latest marketing materials?",
    timestamp: "2023-08-03T10:30:00Z",
    read: true,
  },
  {
    id: "dm2",
    senderId: "u1",
    recipientId: "u2",
    channelId: null,
    content:
      "Yes, I've looked through them. They look great! Just a few minor adjustments needed.",
    timestamp: "2023-08-03T10:35:00Z",
    read: true,
  },
  {
    id: "dm3",
    senderId: "u2",
    recipientId: "u1",
    channelId: null,
    content: "Perfect! Could you send me your notes by the end of the day?",
    timestamp: "2023-08-03T10:40:00Z",
    read: true,
  },
  {
    id: "dm4",
    senderId: "u1",
    recipientId: "u2",
    channelId: null,
    content: "Sure thing, I'll email them to you.",
    timestamp: "2023-08-03T10:45:00Z",
    read: true,
  },
  {
    id: "dm5",
    senderId: "u3",
    recipientId: "u1",
    channelId: null,
    content:
      "Hello! Are we still meeting at 2pm to discuss the new training program?",
    timestamp: "2023-08-03T09:15:00Z",
    read: false,
  },
  {
    id: "dm6",
    senderId: "u4",
    recipientId: "u1",
    channelId: null,
    content:
      "I've updated the employee handbook with the new policies. Can you review it when you get a chance?",
    timestamp: "2023-08-02T16:20:00Z",
    read: false,
  },
  {
    id: "dm7",
    senderId: "u5",
    recipientId: "u1",
    channelId: null,
    content:
      "The team building event is confirmed for next Friday. Please let me know if that works for your department.",
    timestamp: "2023-08-01T11:45:00Z",
    read: true,
  },
];

// Sample channels data
const channels = [
  {
    id: "c1",
    name: "general",
    description: "General discussions for all employees",
    members: ["u1", "u2", "u3", "u4", "u5"],
    isPrivate: false,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "hr-announcements",
    description: "Important HR announcements and updates",
    members: ["u1", "u2", "u3"],
    isPrivate: false,
    createdAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "c3",
    name: "tech-team",
    description: "Tech team discussions and updates",
    members: ["u1", "u4", "u5"],
    isPrivate: true,
    createdAt: "2023-01-03T00:00:00Z",
  },
];

// Sample channel messages
const channelMessages = [
  {
    id: "cm1",
    senderId: "u2",
    recipientId: null,
    channelId: "c1",
    content:
      "Good morning everyone! Don't forget about the company-wide meeting at 11am today.",
    timestamp: "2023-08-03T08:00:00Z",
    read: true,
  },
  {
    id: "cm2",
    senderId: "u3",
    recipientId: null,
    channelId: "c1",
    content: "Thanks for the reminder! Will it be in the main conference room?",
    timestamp: "2023-08-03T08:05:00Z",
    read: true,
  },
  {
    id: "cm3",
    senderId: "u2",
    recipientId: null,
    channelId: "c1",
    content:
      "Yes, it will be in the main conference room. The agenda has been emailed to everyone.",
    timestamp: "2023-08-03T08:10:00Z",
    read: true,
  },
  {
    id: "cm4",
    senderId: "u1",
    recipientId: null,
    channelId: "c1",
    content:
      "I'll prepare the projector and make sure everything is set up for the presentations.",
    timestamp: "2023-08-03T08:15:00Z",
    read: true,
  },
  {
    id: "cm5",
    senderId: "u4",
    recipientId: null,
    channelId: "c1",
    content:
      "Great! I've also invited the new team members so they can get up to speed.",
    timestamp: "2023-08-03T08:20:00Z",
    read: true,
  },
  {
    id: "cm6",
    senderId: "u2",
    recipientId: null,
    channelId: "c2",
    content:
      "Important announcement: We've updated the leave policy. Please review the changes in the handbook.",
    timestamp: "2023-08-02T14:30:00Z",
    read: true,
    attachments: [
      {
        id: "a1",
        type: "document",
        url: "#",
        name: "Updated_Leave_Policy_2023.pdf",
      },
    ],
  },
];

export default function Communication() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("direct");
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  // Initialize conversations
  useEffect(() => {
    if (activeTab === "direct") {
      // Group messages by conversation partner
      const conversationMap = new Map();

      directMessages.forEach((msg) => {
        let partnerId;
        if (msg.senderId === user?.id) {
          partnerId = msg.recipientId;
        } else if (msg.recipientId === user?.id) {
          partnerId = msg.senderId;
        }

        if (!partnerId) return;

        const partner = users.find((u) => u.id === partnerId);
        if (!partner) return;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: partnerId,
            name: partner.name,
            lastMessage: msg.content,
            timestamp: msg.timestamp,
            unread: msg.senderId !== user?.id && !msg.read ? 1 : 0,
            online: Math.random() > 0.5, // Random online status for demo
            avatar: partner.avatar,
          });
        } else {
          const existing = conversationMap.get(partnerId);
          if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
            existing.lastMessage = msg.content;
            existing.timestamp = msg.timestamp;
            if (msg.senderId !== user?.id && !msg.read) {
              existing.unread += 1;
            }
          }
        }
      });

      setConversations(
        Array.from(conversationMap.values()).sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    } else {
      // Set up channels
      setConversations(
        channels
          .filter((channel) => channel.members.includes(user?.id || ""))
          .map((channel) => {
            const lastChannelMsg = channelMessages
              .filter((msg) => msg.channelId === channel.id)
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )[0];

            return {
              id: channel.id,
              name: channel.name,
              lastMessage: lastChannelMsg?.content || "No messages yet",
              timestamp: lastChannelMsg?.timestamp || channel.createdAt,
              unread: channelMessages.filter(
                (msg) =>
                  msg.channelId === channel.id &&
                  !msg.read &&
                  msg.senderId !== user?.id
              ).length,
              online: true, // Channels are always "online"
            };
          })
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
      );
    }
  }, [activeTab, user?.id]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!activeConversation) return;

    if (activeConversation.type === "direct") {
      setMessages(
        directMessages
          .filter(
            (msg) =>
              (msg.senderId === user?.id &&
                msg.recipientId === activeConversation.id) ||
              (msg.recipientId === user?.id &&
                msg.senderId === activeConversation.id)
          )
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
      );
    } else {
      setMessages(
        channelMessages
          .filter((msg) => msg.channelId === activeConversation.id)
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
      );
    }

    // Mark messages as read
    if (activeTab === "direct") {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === activeConversation.id ? { ...conv, unread: 0 } : conv
        )
      );
    }

    // Scroll to bottom of messages
    scrollToBottom();
  }, [activeConversation, user?.id, activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || "u1",
      recipientId:
        activeConversation.type === "direct" ? activeConversation.id : null,
      channelId:
        activeConversation.type === "channel" ? activeConversation.id : null,
      content: message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  // Format date for messages
  const formatMessageDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  // Get sender info
  const getSenderInfo = (senderId) => {
    return (
      users.find((u) => u.id === senderId) || {
        name: "Unknown User",
        avatar: "",
      }
    );
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter((conv) =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Communication</h1>
        <p className="text-muted-foreground">
          Chat with your team members and departments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader className="px-4 space-y-3">
            <div className="flex justify-between items-center">
              <CardTitle>Messages</CardTitle>
              <Button variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs
              defaultValue="direct"
              onValueChange={(value) => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Direct</span>
                </TabsTrigger>
                <TabsTrigger
                  value="channels"
                  className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Channels</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="px-3 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No conversations</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No results found"
                      : "Start a new conversation"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${
                      activeConversation?.id === conversation.id
                        ? "bg-primary/10"
                        : "hover:bg-accent"
                    }`}
                    onClick={() =>
                      setActiveConversation({
                        id: conversation.id,
                        type: activeTab,
                        name: conversation.name,
                      })
                    }>
                    <div className="relative">
                      {activeTab === "direct" ? (
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>
                            {conversation.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                          <span className="text-sm font-medium">
                            #{conversation.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {conversation.online && activeTab === "direct" && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-medium truncate">
                          {activeTab === "direct"
                            ? conversation.name
                            : `#${conversation.name}`}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(conversation.timestamp), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          {activeConversation ? (
            <>
              <CardHeader className="px-6 py-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  {activeConversation.type === "direct" ? (
                    <>
                      <Avatar>
                        <AvatarImage
                          src={
                            users.find((u) => u.id === activeConversation.id)
                              ?.avatar
                          }
                        />
                        <AvatarFallback>
                          {activeConversation.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {activeConversation.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {conversations.find(
                            (c) => c.id === activeConversation.id
                          )?.online
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                        <span className="text-sm font-medium">
                          #{activeConversation.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          #{activeConversation.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {
                            channels.find((c) => c.id === activeConversation.id)
                              ?.description
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  {activeConversation.type === "direct" && (
                    <>
                      <Button variant="ghost" size="icon" title="Call">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Video call">
                        <Video className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" title="Info">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isCurrentUser = msg.senderId === user?.id;
                    const sender = getSenderInfo(msg.senderId);

                    // Check for date change
                    const showDateDivider =
                      index === 0 ||
                      format(
                        parseISO(messages[index - 1].timestamp),
                        "yyyy-MM-dd"
                      ) !== format(parseISO(msg.timestamp), "yyyy-MM-dd");

                    return (
                      <div key={msg.id} className="space-y-4">
                        {showDateDivider && (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="bg-background">
                              {format(parseISO(msg.timestamp), "MMMM d, yyyy")}
                            </Badge>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}>
                          <div
                            className={`flex gap-2 max-w-[80%] ${
                              isCurrentUser ? "flex-row-reverse" : ""
                            }`}>
                            {!isCurrentUser &&
                              activeConversation.type === "channel" && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sender.avatar} />
                                  <AvatarFallback>
                                    {sender.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            <div
                              className={`space-y-1 ${
                                isCurrentUser ? "items-end" : "items-start"
                              }`}>
                              {!isCurrentUser &&
                                activeConversation.type === "channel" && (
                                  <p className="text-xs font-medium">
                                    {sender.name}
                                  </p>
                                )}
                              <div
                                className={`rounded-lg px-4 py-2 inline-block ${
                                  isCurrentUser
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}>
                                <p className="text-sm">{msg.content}</p>
                              </div>
                              {msg.attachments &&
                                msg.attachments.length > 0 && (
                                  <div className="flex gap-2 mt-1">
                                    {msg.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className={`rounded-md p-2 flex items-center gap-2 text-xs ${
                                          isCurrentUser
                                            ? "bg-primary/80 text-primary-foreground"
                                            : "bg-muted/80"
                                        }`}>
                                        <FileText className="h-4 w-4" />
                                        <span className="truncate max-w-[150px]">
                                          {attachment.name}
                                        </span>
                                        <ChevronRight className="h-3 w-3" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              <p
                                className={`text-xs text-muted-foreground ${
                                  isCurrentUser ? "text-right" : "text-left"
                                }`}>
                                {formatMessageDate(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="flex items-center gap-2 w-full">
                  <Button variant="outline" size="icon" title="Attach file">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder={`Message ${
                      activeConversation.type === "direct"
                        ? activeConversation.name
                        : "#" + activeConversation.name
                    }`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    disabled={!message.trim()}
                    onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold">No conversation selected</h2>
              <p className="text-muted-foreground max-w-md mt-2">
                Select a conversation from the sidebar to start chatting or
                create a new one.
              </p>
              <Button className="mt-6" onClick={() => {}}>
                <Plus className="h-4 w-4 mr-2" /> New Conversation
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
