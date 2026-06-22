import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Send, Paperclip, Smile, MoreVertical, Phone, Video,
  Search, Bell, BellOff, Users, Hash
} from 'lucide-react'

interface Message {
  id: string
  sender: string
  senderType: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  avatar?: string
}

interface Room {
  id: string
  name: string
  type: 'direct' | 'project' | 'team'
  unread: number
  lastMessage: string
  online?: boolean
}

export default function Chat() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'
  const [activeRoom, setActiveRoom] = useState('room1')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const rooms: Room[] = [
    { id: 'room1', name: 'General', type: 'team', unread: 0, lastMessage: 'Welcome to Yasmin!' },
    { id: 'room2', name: 'Project Alpha', type: 'project', unread: 3, lastMessage: 'Deployment successful' },
    { id: 'room3', name: 'Frontend Team', type: 'team', unread: 0, lastMessage: 'New component ready' },
    { id: 'room4', name: 'DevOps', type: 'team', unread: 1, lastMessage: 'Server updated' },
  ]

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'System', senderType: 'system', content: 'Welcome to Yasmin Chat! You can communicate with your AI agents here.', timestamp: '10:00 AM' },
    { id: '2', sender: 'Frontend Builder', senderType: 'agent', content: 'I have completed the new dashboard component. Ready for review!', timestamp: '10:05 AM' },
    { id: '3', sender: 'You', senderType: 'user', content: 'Great work! Can you also add the dark mode toggle?', timestamp: '10:06 AM' },
    { id: '4', sender: 'Frontend Builder', senderType: 'agent', content: 'Sure! I will add the dark mode toggle with system preference detection.', timestamp: '10:07 AM' },
    { id: '5', sender: 'DevOps Agent', senderType: 'agent', content: 'Deployment pipeline is ready. All tests passed.', timestamp: '10:10 AM' },
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!messageInput.trim()) return
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'You',
      senderType: 'user',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, newMsg])
    setMessageInput('')

    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'Frontend Builder',
        senderType: 'agent',
        content: 'Received! I will process your request and update you shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, response])
    }, 1500)
  }

  const activeRoomData = rooms.find(r => r.id === activeRoom)

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                activeRoom === room.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500' : ''
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {room.name.charAt(0)}
                </div>
                {room.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{room.name}</span>
                  {room.unread > 0 && (
                    <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {room.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{room.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {activeRoomData?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{activeRoomData?.name}</h3>
              <p className="text-xs text-gray-500">4 members, 2 online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.senderType === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                msg.senderType === 'user' ? 'bg-indigo-600' :
                msg.senderType === 'agent' ? 'bg-purple-500' : 'bg-gray-500'
              }`}>
                {msg.sender.charAt(0)}
              </div>
              <div className={`max-w-[70%] ${msg.senderType === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{msg.sender}</span>
                  <span className="text-xs text-gray-400">{msg.timestamp}</span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  msg.senderType === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : msg.senderType === 'agent'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 rounded-tl-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!messageInput.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
