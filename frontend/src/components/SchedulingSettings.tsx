import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Clock, Calendar, Save } from 'lucide-react';

interface SchedulingConfig {
  postsPerDay: number;
  postTimes: string[];
  timezone: string;
  activeDays: string[];
}

interface SchedulingSettingsProps {
  config?: SchedulingConfig;
  onSave: (config: SchedulingConfig) => Promise<void>;
}

const DEFAULT_CONFIG: SchedulingConfig = {
  postsPerDay: 2,
  postTimes: ['09:00', '15:00'],
  timezone: 'America/New_York',
  activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
};

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
];

export const SchedulingSettings: React.FC<SchedulingSettingsProps> = ({ 
  config = DEFAULT_CONFIG, 
  onSave 
}) => {
  const [settings, setSettings] = useState<SchedulingConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to generate default times based on posts per day
  const generateDefaultTimes = (postsPerDay: number): string[] => {
    const defaultTimes = ['09:00', '13:00', '17:00', '10:00', '15:00', '19:00', '08:00', '12:00', '16:00', '20:00'];
    return defaultTimes.slice(0, postsPerDay);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostsPerDayChange = (newPostsPerDay: number) => {
    setSettings(prev => {
      const currentTimes = prev.postTimes || [];
      let newTimes: string[];
      
      if (newPostsPerDay > currentTimes.length) {
        // Add more times
        const additionalTimes = generateDefaultTimes(newPostsPerDay).slice(currentTimes.length);
        newTimes = [...currentTimes, ...additionalTimes];
      } else {
        // Remove excess times
        newTimes = currentTimes.slice(0, newPostsPerDay);
      }
      
      return {
        ...prev,
        postsPerDay: newPostsPerDay,
        postTimes: newTimes
      };
    });
  };

  const handleTimeChange = (index: number, newTime: string) => {
    setSettings(prev => ({
      ...prev,
      postTimes: prev.postTimes.map((time, i) => i === index ? newTime : time)
    }));
  };

  const handleDayToggle = (dayId: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      activeDays: checked 
        ? [...prev.activeDays, dayId]
        : prev.activeDays.filter(day => day !== dayId)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Posting Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Posting Frequency
            </CardTitle>
            <CardDescription>
              Configure how often content should be posted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postsPerDay">Posts per day</Label>
              <Input
                id="postsPerDay"
                type="number"
                min="1"
                max="10"
                value={settings.postsPerDay}
                onChange={(e) => {
                  const newValue = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                  handlePostsPerDayChange(newValue);
                }}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 1-3 posts per day for optimal engagement
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Timing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Posting Times
            </CardTitle>
            <CardDescription>
              Set specific times for each daily post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual Post Times */}
            <div className="space-y-3">
              {Array.from({ length: settings.postsPerDay }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`postTime-${index}`}>
                    {settings.postsPerDay === 1 ? 'Post time' : `Post ${index + 1} time`}
                  </Label>
                  <Select
                    value={settings.postTimes[index] || '09:00'}
                    onValueChange={(value) => handleTimeChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  timezone: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Days */}
      <Card>
        <CardHeader>
          <CardTitle>Active Posting Days</CardTitle>
          <CardDescription>
            Select which days of the week posts should be scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.id} className="flex items-center space-x-2">
                <Checkbox
                  id={day.id}
                  checked={settings.activeDays.includes(day.id)}
                  onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
                />
                <Label
                  htmlFor={day.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Posts will only be scheduled on selected days
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || settings.activeDays.length === 0}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};