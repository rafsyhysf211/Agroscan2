export interface PlantTask {
  id: string;
  title: string;
  date: string;
  type: 'watering' | 'fertilizing' | 'harvesting' | 'general';
  isCompleted: boolean;
}

export interface SavedDetection {
  id: string;
  timestamp: number;
  imageUrl: string;
  result: {
    isHealthy: boolean;
    percentage: number;
    diseaseName?: string;
    explanation: string;
    actionSteps: string[];
  };
}
