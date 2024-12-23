import AvailabilityForm from '@/components/AvailabilityForm';
import redis from '@/lib/redis';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


export const getServerSideProps = async (context) => {
  const { user_id } = context.params;
  const data = await redis.get(`availability:${user_id}`);
  const initialData = data ? JSON.parse(data) : daysOfWeek.map((day) => ({ day, slots: [] }));

  return { props: { userId: user_id, initialData } };
};

const UserAvailability = ({ userId, initialData }) => {
  return <AvailabilityForm userId={userId} initialData={initialData} />;
};

export default UserAvailability;
