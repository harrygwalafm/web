
import { Profile } from './types';

export const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    name: 'Sarah',
    age: 26,
    bio: 'Adventure seeker and amateur chef. I love hiking on weekends and trying out new pasta recipes. Looking for someone who can keep up with my energy!',
    interests: ['Hiking', 'Cooking', 'Travel', 'Photography'],
    imageUrl: 'https://picsum.photos/seed/sarah/600/800',
    location: 'San Francisco, CA',
    occupation: 'Graphic Designer'
  },
  {
    id: '2',
    name: 'Marcus',
    age: 29,
    bio: 'Tech enthusiast by day, jazz pianist by night. I appreciate good coffee, vinyl records, and deep conversations about the future of AI.',
    interests: ['Music', 'AI', 'Coffee', 'Piano'],
    imageUrl: 'https://picsum.photos/seed/marcus/600/800',
    location: 'Austin, TX',
    occupation: 'Software Engineer'
  },
  {
    id: '3',
    name: 'Elena',
    age: 24,
    bio: 'Yoga instructor and plant parent. 🌿 I believe in mindfulness and kindness. Let\'s explore the local farmers market together.',
    interests: ['Yoga', 'Gardening', 'Health', 'Meditation'],
    imageUrl: 'https://picsum.photos/seed/elena/600/800',
    location: 'Portland, OR',
    occupation: 'Yoga Teacher'
  },
  {
    id: '4',
    name: 'David',
    age: 31,
    bio: 'I run marathons and read historical fiction. Always looking for the next big challenge. I make a mean sourdough bread.',
    interests: ['Running', 'Reading', 'Baking', 'History'],
    imageUrl: 'https://picsum.photos/seed/david/600/800',
    location: 'Chicago, IL',
    occupation: 'Architect'
  },
  {
    id: '5',
    name: 'Chloe',
    age: 27,
    bio: 'Astrophysics student and sci-fi nerd. I can probably beat you at any board game. Ask me about the James Webb telescope!',
    interests: ['Science', 'Board Games', 'Sci-Fi', 'Astronomy'],
    imageUrl: 'https://picsum.photos/seed/chloe/600/800',
    location: 'Boston, MA',
    occupation: 'Research Assistant'
  }
];

export const CURRENT_USER: Profile = {
  id: 'me',
  name: 'Alex',
  age: 28,
  bio: 'Just a regular human trying to find another regular human to do human things with. I like pizza and long walks on the beach (unironically).',
  interests: ['Pizza', 'Walking', 'Tech', 'Movies'],
  imageUrl: 'https://picsum.photos/seed/alex/600/800',
  location: 'New York, NY',
  occupation: 'Product Manager'
};
