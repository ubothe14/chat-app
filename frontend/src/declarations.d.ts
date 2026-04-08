declare module '@stream-io/video-react-sdk' {
  export const StreamVideo: any;
  export const StreamVideoClient: any;
  export const StreamTheme: any;
  export const VideoCallsList: any;
  export const Call: any;
  export const CallControls: any;
  export const ParticipantView: any;
  export const StreamCall: any;
  export const SpeakerLayout: any;
  export const CallingState: any;
  export const useStreamVideoClient: any;
  export const useCall: any;
  export const useCallStateHooks: any;
  export interface User {
    id: string;
    name?: string;
    image?: string;
    role?: string;
    custom?: Record<string, any>;
  }
}
