import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Note from '../models/Note.js';
import Post from '../models/Post.js';
import { connectDB, disconnectDB } from '../config/database.js';

dotenv.config();

const seedDatabase = async () => {
  let memoryServer = null;
  try {
    console.log('[Seed] Connecting to database...');
    try {
      await connectDB();
    } catch (connErr) {
      console.log(`[Seed Warning] Could not connect to ${process.env.MONGODB_URI || 'default URI'}.`);
      console.log('[Seed] Please ensure MongoDB is running or configure MONGODB_URI in .env with your MongoDB Atlas connection string.');
      process.exit(1);
    }

    console.log('[Seed] Syncing indexes...');
    await Promise.all([User.init(), Note.init(), Post.init()]);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    console.log(`[Seed] Checking admin account (${adminEmail})...`);
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        interests: ['security', 'architecture', 'devops']
      });
      console.log(`[Seed] Admin created: ${admin.email}`);
    } else {
      console.log(`[Seed] Admin already exists: ${admin.email}`);
    }

    // Sample users matching assignment scenario
    const sampleUsersData = [
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

    const usersMap = {};

    for (const userData of sampleUsersData) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`[Seed] Created user: ${user.name} (${user.email})`);
      } else {
        console.log(`[Seed] User exists: ${user.name} (${user.email})`);
      }
      usersMap[user.name] = user;
    }

    // Seed notes for users if not already populated
    const sampleNotes = [
      {
        user: usersMap['Naeem'],
        title: 'MongoDB Aggregation Deep Dive',
        content: 'Studying single-pipeline aggregations using $unwind, $group, and $lookup for the CareGuide interview.'
      },
      {
        user: usersMap['Naeem'],
        title: 'JWT Token Security Checklist',
        content: 'Always sign with strong secret, enforce short expiry, and verify role claims in backend middleware.'
      },
      {
        user: usersMap['Rahim'],
        title: 'Chess Openings Strategy',
        content: 'Analyze Sicilian Defense and Queen Gambit variations for weekend tournament.'
      },
      {
        user: usersMap['Karim'],
        title: 'Book Recommendations 2026',
        content: 'Designing Data-Intensive Applications, Clean Code, and Domain-Driven Design.'
      },
      {
        user: admin,
        title: 'System Maintenance Procedures',
        content: 'Weekly backup of MongoDB Atlas clusters and automated verification of compound indexes.'
      }
    ];

    for (const noteData of sampleNotes) {
      if (noteData.user) {
        const existingNote = await Note.findOne({
          userId: noteData.user._id,
          title: noteData.title
        });
        if (!existingNote) {
          await Note.create({
            userId: noteData.user._id,
            title: noteData.title,
            content: noteData.content
          });
          console.log(`[Seed] Created note: "${noteData.title}" for ${noteData.user.name}`);
        }
      }
    }

    // Seed posts for users (used in Scenario 2 $lookup)
    const samplePosts = [
      {
        user: usersMap['Naeem'],
        title: 'Laravel Tutorial',
        content: 'Comprehensive guide to building enterprise REST APIs with Laravel and Eloquent ORM.'
      },
      {
        user: usersMap['Naeem'],
        title: 'Mastering MongoDB Compound Indexes',
        content: 'How ESR (Equality, Sort, Range) rule guarantees optimal index execution in high-throughput applications.'
      },
      {
        user: usersMap['Rahim'],
        title: 'Chess Tactics for Beginners',
        content: 'Forks, pins, and skewers explained with practical board puzzles.'
      },
      {
        user: usersMap['Karim'],
        title: 'The Future of Software Architecture',
        content: 'Microservices vs Modular Monoliths: practical trade-offs for 2026 startups.'
      }
    ];

    for (const postData of samplePosts) {
      if (postData.user) {
        const existingPost = await Post.findOne({
          userId: postData.user._id,
          title: postData.title
        });
        if (!existingPost) {
          await Post.create({
            userId: postData.user._id,
            title: postData.title,
            content: postData.content
          });
          console.log(`[Seed] Created post: "${postData.title}" for ${postData.user.name}`);
        }
      }
    }

    console.log('----------------------------------------------------');
    console.log('[Seed] Database seeding completed successfully!');
    console.log('[Seed] Admin login:');
    console.log(`       Email: ${adminEmail}`);
    console.log(`       Password: ${adminPassword}`);
    console.log('[Seed] Sample User logins:');
    console.log('       naeem@example.com / Password@123');
    console.log('       rahim@example.com / Password@123');
    console.log('       karim@example.com / Password@123');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error(`[Seed Error] Failed to seed database: ${error.message}`);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
  }
};

seedDatabase();
