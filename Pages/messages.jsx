import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { Message } from "@/entities/Message";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  Loader2, 
  User as UserIcon, 
  MessageCircle,
  SendHorizonal,
  Info
} from "lucide-react";
import { format } from "date-fns";

export default function MessagesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userMap, setUserMap] = useState(new Map());
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user
        const userData = await User.me();
        setUser(userData);
        
        // Get all users to build a map for showing names
        const allUsers = await User.list();
        const userMapTemp = new Map();
        allUsers.forEach(u => userMapTemp.set(u.id, u));
        setUserMap(userMapTemp);
        
        // Load conversations (both sent and received)
        await loadConversations(userData.id);
      } catch (error) {
        console.error("Error loading data:", error);
        navigate(createPageUrl("Login"));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Load conversations on a timer
  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      loadConversations(user.id);
      
      if (activeConversation) {
        loadMessages(activeConversation.threadId);
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [user, activeConversation]);
  
  const loadConversations = async (userId) => {
    try {
      // Get all messages where user is sender or receiver
      const sentMessages = await Message.filter({ sender_id: userId });
      const receivedMessages = await Message.filter({ receiver_id: userId });
      
      // Combine and deduplicate by thread_id
      const allMessages = [...sentMessages, ...receivedMessages];
      const threadMap = new Map();
      
      allMessages.forEach(message => {
        if (!threadMap.has(message.thread_id) || 
            message.created_date > threadMap.get(message.thread_id).created_date) {
          threadMap.set(message.thread_id, message);
        }
      });
      
      // Convert to array of conversation objects
      const conversationsArray = Array.from(threadMap.values()).map(latestMessage => {
        const otherUserId = latestMessage.sender_id === userId 
          ? latestMessage.receiver_id 
          : latestMessage.sender_id;
        
        return {
          threadId: latestMessage.thread_id,
          otherUserId,
          otherUser: userMap.get(otherUserId),
          latestMessage,
          unread: latestMessage.receiver_id === userId && !latestMessage.read
        };
      });
      
      // Sort by latest message date
      conversationsArray.sort((a, b) => 
        new Date(b.latestMessage.created_date) - new Date(a.latestMessage.created_date)
      );
      
      setConversations(conversationsArray);
      
      // If there's an active conversation, update its unread status
      if (activeConversation) {
        const updated = conversationsArray.find(c => c.threadId === activeConversation.threadId);
        if (updated) {
          setActiveConversation(updated);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };
  
  const loadMessages = async (threadId) => {
    setLoadingMessages(true);
    try {
      // Get all messages in this thread
      const threadMessages = await Message.filter({ thread_id: threadId });
      
      // Sort by date
      threadMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      setMessages(threadMessages);
      
      // Mark unread messages as read
      const unreadMessages = threadMessages.filter(
        m => m.receiver_id === user.id && !m.read
      );
      
      for (const msg of unreadMessages) {
        await Message.update(msg.id, { read: true });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const handleOpenConversation = (conversation) => {
    setActiveConversation(conversation);
    loadMessages(conversation.threadId);
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    
    setSendingMessage(true);
    try {
      // Create message
      const sentMessage = await Message.create({
        sender_id: user.id,
        receiver_id: activeConversation.otherUserId,
        content: newMessage,
        thread_id: activeConversation.threadId
      });
      
      // Update UI
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage("");
      
      // Refresh conversations list
      loadConversations(user.id);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      // Today, show time
      return format(date, "h:mm a");
    } else if (date.getFullYear() === now.getFullYear()) {
      // This year, show month and day
      return format(date, "MMM d");
    } else {
      // Different year, show month, day and year
      return format(date, "MMM d, yyyy");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 py-8">
      <div className="mb-6 px-4">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with parents and babysitters</p>
      </div>
      
      <div className="bg-white md:rounded-lg md:shadow-sm border md:border overflow-hidden">
        <div className="flex h-[calc(100vh-250px)] min-h-[400px]">
          {/* Conversations Sidebar */}
          <div className={`w-full md:w-1/3 lg:w-1/4 border-r ${activeConversation ? "hidden md:block" : "block"}`}>
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Conversations
              </h2>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-57px)]">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No conversations yet</p>
                  {user.user_type === "parent" ? (
                    <Button 
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                      onClick={() => navigate(createPageUrl("FindBabysitter"))}
                    >
                      Find Babysitters
                    </Button>
                  ) : (
                    <p className="text-sm mt-2">
                      Parents will appear here when they contact you
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {conversations.map(conversation => (
                    <button
                      key={conversation.threadId}
                      className={`w-full p-4 border-b flex items-start gap-3 text-left hover:bg-gray-50 ${
                        activeConversation?.threadId === conversation.threadId 
                          ? "bg-purple-50 border-l-4 border-l-purple-600" 
                          : ""
                      }`}
                      onClick={() => handleOpenConversation(conversation)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {conversation.otherUser?.profile_image_url ? (
                          <img 
                            src={conversation.otherUser.profile_image_url} 
                            alt={conversation.otherUser.full_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate">
                            {conversation.otherUser?.full_name || "Unknown User"}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-1">
                            {formatMessageTime(conversation.latestMessage.created_date)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${conversation.unread ? "font-medium text-gray-900" : "text-gray-500"}`}>
                          {conversation.latestMessage.sender_id === user.id && "You: "}
                          {conversation.latestMessage.content}
                        </p>
                        {conversation.unread && (
                          <span className="inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Message Thread */}
          <div className={`w-full md:w-2/3 lg:w-3/4 flex flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}>
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
                <div>
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
 