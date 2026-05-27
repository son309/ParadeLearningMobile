// Media & AI Scoring Types

export interface AIAnnotation {
  timestamp: number;
  x: number;
  y: number;
  label: string;
  score: number;
  cameraAngle?: 'front' | 'back';
}

export interface VideoUploadResult {
  video: string;
  thumb: string;
  annotations?: AIAnnotation[];
  aiScore?: number;
  aiFeedback?: string;
}

export interface VideoSlot {
  uri: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  angle: 'front' | 'back';
}

export interface CommentAnnotationPayload {
  videoUrl: string;
  thumbUrl: string;
  annotations: AIAnnotation[];
  aiScore?: number;
  aiFeedback?: string;
}
