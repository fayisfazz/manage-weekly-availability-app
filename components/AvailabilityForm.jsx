import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Minus, Save } from 'lucide-react';
import redis from '@/lib/redis';
import { TimeInput } from './TimeInput';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Default empty schedule
const DEFAULT_SCHEDULE = DAYS_OF_WEEK.reduce((acc, day) => ({
  ...acc,
  [day]: {
    enabled: ['Saturday', 'Sunday'].includes(day) ? false : true,
    timeSlots: [{ start: '', end: '' }],
  },
}), {});

export async function getServerSideProps({ params }) {
  const { userId } = params;
  
  try {
    // Try to get saved availability from Redis
    const savedAvailability = await redis.get(`availability:${userId}`);
    
    return {
      props: {
        initialData: savedAvailability ? JSON.parse(savedAvailability) : DEFAULT_SCHEDULE,
        userId,
      },
    };
  } catch (error) {
    console.error('Redis error:', error);
    return {
      props: {
        initialData: DEFAULT_SCHEDULE,
        userId,
      },
    };
  }
}

export default function AvailabilityPage({ initialData, userId }) {
  const router = useRouter();
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: initialData,
  });

  const validateTimeFormat = (time) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(?:AM|PM|am|pm)$/;
    if (!timeRegex.test(time)) {
      return 'Invalid time format (HH:MM AM/PM)';
    }
    return true;
  };

  const validateTimeSlots = (timeSlots) => {
    if (!timeSlots || timeSlots.length === 0) return true;

    // Sort time slots by start time
    const sortedSlots = [...timeSlots].sort((a, b) => {
      const aStart = new Date(`2000/01/01 ${a.start}`);
      const bStart = new Date(`2000/01/01 ${b.start}`);
      return aStart - bStart;
    });

    // Check for overlaps and valid times
    for (let i = 0; i < sortedSlots.length; i++) {
      const current = sortedSlots[i];
      
      if (!validateTimeFormat(current.start) || !validateTimeFormat(current.end)) {
        return false;
      }

      const start = new Date(`2000/01/01 ${current.start}`);
      const end = new Date(`2000/01/01 ${current.end}`);

      if (start >= end) {
        return false;
      }

      if (i < sortedSlots.length - 1) {
        const nextStart = new Date(`2000/01/01 ${sortedSlots[i + 1].start}`);
        if (end > nextStart) {
          return false;
        }
      }
    }

    return true;
  };

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`/api/availability/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save availability');
      }

      router.reload();
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    }
  };

  const availabilityState = watch('availability');


  return (
    <div className="max-w-4xl mx-auto p-6">
  
  <div className="flex justify-center space-x-2 mb-6">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer ${
              availabilityState[index]?.slots?.length > 0
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="border-b pb-4">
            <div className="flex items-center mb-2">
              <Controller
                name={`${day}.enabled`}
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (!e.target.checked) {
                        setValue(`${day}.timeSlots`, []);
                      } else {
                        setValue(`${day}.timeSlots`, [{ start: '', end: '' }]);
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-500"
                  />
                )}
              />
              <span className="text-gray-600 w-32">{day}</span>
            </div>

            {watch(`${day}.enabled`) && (
              <Controller
                name={`${day}.timeSlots`}
                control={control}
                rules={{
                  validate: validateTimeSlots
                }}
                render={({ field }) => (
                  <div className="ml-6 space-y-2">
                    {field.value.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <TimeInput
                          name={`${day}.timeSlots.${index}.start`}
                          value={slot.start}
                          onChange={(value) => {
                            const newSlots = [...field.value];
                            newSlots[index] = { ...slot, start: value };
                            field.onChange(newSlots);
                          }}
                          placeholder="9:00 AM"
                          error={errors[day]?.timeSlots?.[index]?.start?.message}
                        />
                        <span className="text-gray-500">to</span>
                        <TimeInput
                          name={`${day}.timeSlots.${index}.end`}
                          value={slot.end}
                          onChange={(value) => {
                            const newSlots = [...field.value];
                            newSlots[index] = { ...slot, end: value };
                            field.onChange(newSlots);
                          }}
                          placeholder="5:00 PM"
                          error={errors[day]?.timeSlots?.[index]?.end?.message}
                        />
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newSlots = [...field.value, { start: '', end: '' }];
                            field.onChange(newSlots);
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        
                        {field.value.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSlots = field.value.filter((_, i) => i !== index);
                              field.onChange(newSlots);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {errors[day]?.timeSlots && (
                      <span className="text-red-500 text-sm">
                        Invalid time slots configuration
                      </span>
                    )}
                  </div>
                )}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Availability</span>
        </button>
      </form>
    </div>
  );
}