"use client";

import {
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Send,
  X,
} from "lucide-react";
import type { TurnCredentials } from "@/lib/types";

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

interface LiveClassroomProps {
  credentials: TurnCredentials;
  userName: string;
  userId: number;
  isTutor: boolean;
  initialAudio: boolean;
  initialVideo: boolean;
  onLeave: () => void;
  attendeeCount: number;
}

export function LiveClassroom({
  credentials,
  userName,
  isTutor,
  initialAudio,
  initialVideo,
  onLeave,
  attendeeCount,
}: LiveClassroomProps) {
  const [audioEnabled, setAudioEnabled] = useState(initialAudio);
  const [videoEnabled, setVideoEnabled] = useState(initialVideo);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteStreams = remoteStreamsRef.current;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize local media
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.getVideoTracks().forEach((t) => (t.enabled = initialVideo));
        stream.getAudioTracks().forEach((t) => (t.enabled = initialAudio));
        setLocalStream(stream);
      })
      .catch(() => {
        // Fallback: try audio only
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            if (cancelled) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }
            stream.getAudioTracks().forEach((t) => (t.enabled = initialAudio));
            setLocalStream(stream);
          })
          .catch(() => {/* no media available */});
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Toggle audio
  useEffect(() => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
  }, [audioEnabled, localStream]);

  // Toggle video
  useEffect(() => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
  }, [videoEnabled, localStream]);

  // Cleanup on unmount
  useEffect(() => {
    const pcs = peerConnections.current;
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      pcs.forEach((pc) => pc.close());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen share — re-enable camera
      localStream?.getVideoTracks().forEach((t) => t.stop());
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        newStream.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
        newStream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
        setLocalStream(newStream);
      } catch {/* ignore */}
      setScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      // Replace video track
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => setScreenSharing(false);
      setScreenSharing(true);

      if (localStream) {
        const newStream = new MediaStream([
          ...localStream.getAudioTracks(),
          screenTrack,
        ]);
        setLocalStream(newStream);
      }
    } catch {
      /* user cancelled */
    }
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: userName, text, timestamp: Date.now() },
    ]);
    setChatInput("");
  };

  const handleLeave = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    peerConnections.current.forEach((pc) => pc.close());
    onLeave();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-800 border-b border-neutral-700">
        <div>
          <h3 className="text-base font-bold text-white">
            {credentials.title}
          </h3>
          <div className="text-sm text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
            {attendeeCount} students · Live
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col">
          {/* Main video */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {isTutor && localStream && videoEnabled ? (
              <video
                ref={mainVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-neutral-400">
                <div className="text-4xl mb-4">
                  <Monitor className="w-16 h-16 mx-auto" />
                </div>
                <div className="text-sm">
                  {isTutor ? "Your camera is off" : "Tutor is presenting..."}
                </div>
              </div>
            )}

            {/* Participant thumbnails */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <div className="bg-neutral-900 border border-neutral-700 rounded-[10px] w-[120px] h-[72px] flex items-center justify-center overflow-hidden">
                {localStream && videoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-xs text-neutral-400">
                    You
                  </div>
                )}
              </div>
              {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                <div
                  key={peerId}
                  className="bg-neutral-900 border border-neutral-700 rounded-[10px] w-[120px] h-[72px] flex items-center justify-center overflow-hidden"
                >
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el) el.srcObject = stream;
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Controls footer */}
          <div className="flex items-center justify-between px-6 py-3 bg-neutral-800 border-t border-neutral-700">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  audioEnabled
                    ? "bg-neutral-700 text-white hover:bg-neutral-600"
                    : "bg-neutral-700 text-red-400 hover:bg-neutral-600"
                }`}
                title={audioEnabled ? "Mute" : "Unmute"}
              >
                {audioEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  videoEnabled
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                }`}
                title={videoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {videoEnabled ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleScreenShare}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  screenSharing
                    ? "bg-primary text-white"
                    : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                }`}
                title="Screen share"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 items-center">
              {!isTutor && (
                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    handRaised
                      ? "bg-amber-500 text-white"
                      : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                  }`}
                  title="Raise hand"
                >
                  <Hand className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleLeave}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Leave"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="w-[300px] flex flex-col border-l border-neutral-700 bg-neutral-800">
          <div className="px-4 py-3 border-b border-neutral-700">
            <div className="text-sm font-bold text-neutral-300">Live Chat</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-xs text-neutral-500 text-center mt-8">
                No messages yet. Say hello!
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i}>
                <div className="text-xs font-bold text-primary mb-0.5">
                  {msg.sender}
                </div>
                <div className="text-sm text-neutral-300">{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 p-3 border-t border-neutral-700">
            <input
              className="flex-1 bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-primary"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatInput.trim()) sendChat();
              }}
            />
            <button
              onClick={sendChat}
              className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
