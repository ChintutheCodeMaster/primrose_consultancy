import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===========================================================================
// useRoseVoiceChat (Noga)
// ---------------------------------------------------------------------------
// Mirror of TPR's useRealtimeInterview hook, rebranded for Rose and pointed
// at Noga's own edge function (noga-rose-realtime-session).
// ===========================================================================

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConversationTurn {
  role: 'rose' | 'student';
  text: string;
}

export interface UseRoseVoiceChatReturn {
  connect: (programName: string, university: string) => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (text: string) => void;
  connectionState: ConnectionState;
  isConnected: boolean;
  isRoseSpeaking: boolean;
  isStudentSpeaking: boolean;
  roseTranscript: string;
  lastRoseUtterance: string;
  studentTranscript: string;
  conversationHistory: ConversationTurn[];
  error: string | null;
}

export const useRoseVoiceChat = (): UseRoseVoiceChatReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [isRoseSpeaking, setIsRoseSpeaking] = useState(false);
  const [isStudentSpeaking, setIsStudentSpeaking] = useState(false);
  const [roseTranscript, setRoseTranscript] = useState('');
  const [lastRoseUtterance, setLastRoseUtterance] = useState('');
  const [studentTranscript, setStudentTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanupResources = useCallback(() => {
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.parentNode?.removeChild(audioElRef.current);
      audioElRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupResources(), [cleanupResources]);

  const disconnect = useCallback(() => {
    cleanupResources();
    setConnectionState('disconnected');
    setIsRoseSpeaking(false);
    setIsStudentSpeaking(false);
  }, [cleanupResources]);

  const handleEvent = useCallback((raw: string) => {
    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    switch (event.type) {
      case 'response.output_audio_transcript.delta':
        setRoseTranscript((p) => p + (event.delta || ''));
        setIsRoseSpeaking(true);
        break;
      case 'response.output_audio_transcript.done':
        if (event.transcript) {
          setLastRoseUtterance(event.transcript);
          setRoseTranscript('');
          setConversationHistory((prev) => [...prev, { role: 'rose', text: event.transcript }]);
        }
        break;
      case 'input_audio_buffer.speech_started':
        setIsStudentSpeaking(true);
        setStudentTranscript('');
        break;
      case 'input_audio_buffer.speech_stopped':
        setIsStudentSpeaking(false);
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          setStudentTranscript(event.transcript);
          setConversationHistory((prev) => [...prev, { role: 'student', text: event.transcript }]);
        }
        break;
      case 'response.done':
        setIsRoseSpeaking(false);
        break;
      case 'error':
        console.error('OpenAI realtime error:', event);
        toast.error('Voice session error', {
          description: event.error?.message ?? 'An error occurred during the voice chat',
        });
        break;
      default:
        break;
    }
  }, []);

  const connect = useCallback(
    async (programName: string, university: string) => {
      try {
        setConnectionState('connecting');
        setError(null);
        setRoseTranscript('');
        setLastRoseUtterance('');
        setStudentTranscript('');
        setConversationHistory([]);

        // 1. Get ephemeral token from our edge function
        const { data: sessionData, error: fnError } = await supabase.functions.invoke(
          'noga-rose-realtime-session',
          { body: { programName, university } },
        );
        if (fnError) throw new Error(fnError.message || 'Failed to get session token');

        const ephemeralKey = sessionData?.client_secret?.value || sessionData?.value;
        if (!ephemeralKey) throw new Error('No ephemeral key returned from session endpoint');

        // 2. Microphone access
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = localStream;

        // 3. Peer connection
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // 4. Audio output element
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) audioEl.srcObject = event.streams[0];
        };

        // 5. Add mic track
        localStream.getAudioTracks().forEach((track) => pc.addTrack(track, localStream));

        // 6. Data channel
        const dc = pc.createDataChannel('oai-events');
        dcRef.current = dc;

        dc.onopen = () => {
          setConnectionState('connected');
          setTimeout(() => {
            if (dc.readyState === 'open') dc.send(JSON.stringify({ type: 'response.create' }));
          }, 500);
        };
        dc.onmessage = (event) => handleEvent(event.data);
        dc.onerror = (err) => {
          console.error('Data channel error:', err);
          setError('Connection error — data channel failed');
          setConnectionState('error');
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            setConnectionState('error');
            setError('WebRTC connection lost');
          }
        };

        // 7. SDP offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 8. SDP exchange with OpenAI
        const sdpResponse = await fetch(
          'https://api.openai.com/v1/realtime/calls?model=gpt-realtime-2',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${ephemeralKey}`,
              'Content-Type': 'application/sdp',
            },
            body: offer.sdp,
          },
        );
        if (!sdpResponse.ok) {
          const errText = await sdpResponse.text();
          throw new Error(`OpenAI SDP exchange failed (${sdpResponse.status}): ${errText}`);
        }

        // 9. Apply answer
        const answerSdp = await sdpResponse.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch (err) {
        console.error('Rose connect() failed:', err);
        const message = err instanceof Error ? err.message : 'Failed to start the voice session';
        setError(message);
        setConnectionState('error');
        toast.error('Could not start voice session', { description: message });
        cleanupResources();
      }
    },
    [cleanupResources, handleEvent],
  );

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return;
    dcRef.current.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
      }),
    );
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  return {
    connect,
    disconnect,
    sendTextMessage,
    connectionState,
    isConnected: connectionState === 'connected',
    isRoseSpeaking,
    isStudentSpeaking,
    roseTranscript,
    lastRoseUtterance,
    studentTranscript,
    conversationHistory,
    error,
  };
};
