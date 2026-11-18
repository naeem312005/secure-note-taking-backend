import User from '../models/User.js';
import Note from '../models/Note.js';
import Post from '../models/Post.js';

export const autoSeed = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // Check if admin already exists
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      interests: ['security', 'architecture', 'devops']
    });
    console.log(`[AutoSeed] Default Admin ready: ${admin.email} (Password: ${adminPassword})`);
  }

  // Seed sample users
  const sampleUsers = [
    {
      name: 'Naeem',
      email: 'naeem@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['coding', 'reading']
    },
    {
      name: 'Rahim',
      email: 'rahim@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['coding', 'chess']
    },
    {
      name: 'Karim',
      email: 'karim@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['reading', 'music']
    },
    {
      name: 'Sarah',
      email: 'sarah@example.com',
      password: 'Password@123',
      role: 'user',
      interests: ['chess', 'photography']
    }
  ];

  const userMap = {};
  for (const u of sampleUsers) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
      console.log(`[AutoSeed] Sample User ready: ${user.name} (${user.email})`);
    }
    userMap[user.name] = user;
  }

  // Seed notes
  const notesCount = await Note.countDocuments();
  if (notesCount === 0 && userMap['Naeem']) {
    await Note.create([
      {
        userId: userMap['Naeem']._id,
        title: 'MongoDB Aggregation Deep Dive',
        content: 'Studying single-pipeline aggregations using $unwind, $group, and $lookup for the CareGuide interview.'
      },
      {
        userId: userMap['Naeem']._id,
        title: 'JWT Token Security Checklist',
        content: 'Always sign with strong secret, enforce short expiry, and verify role claims in backend middleware.'
      },
      {
        userId: userMap['Rahim']._id,
        title: 'Chess Openings Strategy',
        content: 'Analyze Sicilian Defense and Queen Gambit variations for weekend tournament.'
      },
      {
        userId: userMap['Karim']._id,
        title: 'Book Recommendations 2026',
        content: 'Designing Data-Intensive Applications, Clean Code, and Domain-Driven Design.'
      },
      {
        userId: admin._id,
        title: 'System Maintenance Procedures',
        content: 'Weekly backup of MongoDB Atlas clusters and automated verification of compound indexes.'
      }
    ]);
    console.log('[AutoSeed] Sample private notes created.');
  }

  // Seed posts
  const postsCount = await Post.countDocuments();
  if (postsCount === 0 && userMap['Naeem']) {
    await Post.create([
      {
        userId: userMap['Naeem']._id,
        title: 'Laravel Tutorial',
        content: 'Comprehensive guide to building enterprise REST APIs with Laravel and Eloquent ORM.'
      },
      {
        userId: userMap['Naeem']._id,
        title: 'Mastering MongoDB Compound Indexes',
        content: 'How ESR (Equality, Sort, Range) rule guarantees optimal index execution in high-throughput applications.'
      },
      {
        userId: userMap['Rahim']._id,
        title: 'Chess Tactics for Beginners',
        content: 'Forks, pins, and skewers explained with practical board puzzles.'
      },
      {
        userId: userMap['Karim']._id,
        title: 'The Future of Software Architecture',
        content: 'Microservices vs Modular Monoliths: practical trade-offs for 2026 startups.'
      }
    ]);
    console.log('[AutoSeed] Sample public posts created.');
  }
};
