import Redis from "ioredis";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;
  const availability = req.body;

  try {
    // Store availability data in Redis
    await Redis.set(`availability:${userId}`, JSON.stringify(availability));
    
    res.status(200).json({ message: 'Availability saved successfully' });
  } catch (error) {
    console.error('Error saving to Redis:', error);
    res.status(500).json({ message: 'Failed to save availability' });
  }
}