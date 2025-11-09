import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Gemini API configuration
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Calling Gemini API...');
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      console.error('Gemini API error response:', JSON.stringify(data));
      throw new Error(data.error?.message || 'Failed to generate AI content');
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response structure:', JSON.stringify(data));
      throw new Error('Invalid response from Gemini API');
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log('Gemini API response text length:', text?.length);
    return text;
  } catch (error: any) {
    console.error('Error calling Gemini API:', error.message);
    throw error;
  }
}

// Helper function to generate a simple token
function generateToken(userId: string): string {
  return btoa(`${userId}:${Date.now()}`);
}

// Helper function to hash password (simple for demo - in production use proper hashing)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Helper function to verify token
function verifyToken(token: string): string | null {
  try {
    const decoded = atob(token);
    const [userId] = decoded.split(':');
    return userId;
  } catch {
    return null;
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint (public, no auth required)
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Handle OPTIONS requests for CORS
app.options("*", (c) => {
  return c.text("", 200);
});

// Sign up endpoint
app.post("/signup", async (c) => {
  try {
    console.log('=== SIGNUP REQUEST RECEIVED ===');
    const body = await c.req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { email, password, name } = body;
    
    if (!email || !password || !name) {
      console.log('Missing fields - email:', !!email, 'password:', !!password, 'name:', !!name);
      return c.json({ error: "Missing required fields: email, password, name" }, 400);
    }

    console.log('Checking for existing user:', email);
    // Check if user already exists
    const existingUser = await kv.get(`user:${email}`);
    if (existingUser) {
      console.log('User already exists:', email);
      return c.json({ error: "User with this email already exists" }, 400);
    }

    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    console.log('Storing user data in KV...');
    // Initialize user data in KV store
    await kv.set(`user:${email}`, {
      email,
      name,
      createdAt: new Date().toISOString(),
      isOnboarded: false,
      password: hashedPassword
    });
    console.log('User data stored successfully');

    const token = generateToken(email);
    console.log('Token generated, sending response');

    return c.json({ 
      success: true, 
      userId: email,
      accessToken: token,
      message: "Account created successfully" 
    });

  } catch (error: any) {
    console.error('=== SIGNUP ERROR ===');
    console.error('Error type:', error?.constructor?.name || 'Unknown');
    console.error('Error message:', error?.message || String(error));
    console.error('Error stack:', error?.stack || 'No stack trace');
    return c.json({ error: `Server error during sign up: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Login endpoint - uses client auth
app.post("/login", async (c) => {
  try {
    console.log('=== LOGIN REQUEST RECEIVED ===');
    const body = await c.req.json();
    console.log('Request body:', JSON.stringify({ email: body.email, password: '***' }));
    
    const { email, password } = body;
    
    if (!email || !password) {
      console.log('Missing fields - email:', !!email, 'password:', !!password);
      return c.json({ error: "Missing required fields: email, password" }, 400);
    }

    console.log('Fetching user data for:', email);
    const userData = await kv.get(`user:${email}`);

    if (!userData) {
      console.log('User not found:', email);
      return c.json({ error: "User not found" }, 401);
    }

    console.log('User found, verifying password...');
    const hashedPassword = await hashPassword(password);

    if (userData.password !== hashedPassword) {
      console.log('Password mismatch for user:', email);
      return c.json({ error: "Incorrect password" }, 401);
    }

    console.log('Password verified, generating token...');
    const token = generateToken(email);
    console.log('Login successful for:', email);

    return c.json({ 
      success: true,
      accessToken: token,
      userId: email,
      userData: userData || {}
    });

  } catch (error: any) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error type:', error?.constructor?.name || 'Unknown');
    console.error('Error message:', error?.message || String(error));
    console.error('Error stack:', error?.stack || 'No stack trace');
    return c.json({ error: `Server error during login: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get user profile endpoint (requires auth)
app.get("/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);

    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${userId}`);

    return c.json({ 
      success: true,
      userId: userId,
      email: userId,
      userData: userData || {}
    });

  } catch (error: any) {
    console.error('Profile fetch error:', error?.message || String(error));
    return c.json({ error: `Server error fetching profile: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Update user data endpoint (requires auth)
app.post("/update-profile", async (c) => {
  try {
    console.log('=== UPDATE PROFILE REQUEST RECEIVED ===');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('No authorization token provided');
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);

    if (!userId) {
      console.log('Invalid or expired token');
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    console.log('Updating profile for user:', userId);
    const updates = await c.req.json();
    console.log('Update data received:', JSON.stringify(updates, null, 2));
    
    // Get existing user data
    const existingData = await kv.get(`user:${userId}`) || {};
    console.log('Existing user data:', JSON.stringify(existingData, null, 2));
    
    // Merge updates with existing data
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Merged data to save:', JSON.stringify(updatedData, null, 2));

    // Save to KV store
    await kv.set(`user:${userId}`, updatedData);
    console.log('Data saved successfully to KV store');
    
    // Verify the save by reading it back
    const verifyData = await kv.get(`user:${userId}`);
    console.log('Verification - data read back from KV:', JSON.stringify(verifyData, null, 2));
    console.log('Verification - isOnboarded flag:', verifyData?.isOnboarded);

    return c.json({ 
      success: true,
      message: "Profile updated successfully",
      userData: updatedData
    });

  } catch (error: any) {
    console.error('=== UPDATE PROFILE ERROR ===');
    console.error('Error type:', error?.constructor?.name || 'Unknown');
    console.error('Error message:', error?.message || String(error));
    console.error('Error stack:', error?.stack || 'No stack trace');
    return c.json({ error: `Server error updating profile: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get missions for a user (requires auth)
app.get("/missions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    // Get missions data from KV store
    const missionsData = await kv.get(`missions:${userId}`) || { missions: [], completedToday: 0, lastReset: new Date().toISOString() };

    return c.json({ 
      success: true,
      data: missionsData
    });

  } catch (error: any) {
    console.error('Error fetching missions:', error?.message || String(error));
    return c.json({ error: `Server error fetching missions: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Save missions for a user (requires auth)
app.post("/missions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const { missions } = await c.req.json();
    
    // Save missions to KV store
    await kv.set(`missions:${userId}`, {
      missions: missions || [],
      completedToday: 0,
      lastReset: new Date().toISOString()
    });

    return c.json({ 
      success: true,
      message: "Missions saved successfully"
    });

  } catch (error: any) {
    console.error('Error saving missions:', error?.message || String(error));
    return c.json({ error: `Server error saving missions: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Complete a mission (requires auth)
app.post("/missions/complete", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const { missionId, xpEarned } = await c.req.json();
    
    // Get existing missions data
    const missionsData = await kv.get(`missions:${userId}`) || { missions: [], completedToday: 0, lastReset: new Date().toISOString() };
    
    // Update mission completion
    const updatedMissions = missionsData.missions || [];
    const missionIndex = updatedMissions.findIndex((m: any) => m.id === missionId);
    
    if (missionIndex >= 0) {
      updatedMissions[missionIndex].completed = true;
    } else {
      updatedMissions.push({ id: missionId, completed: true, completedAt: new Date().toISOString() });
    }
    
    const updatedMissionsData = {
      ...missionsData,
      missions: updatedMissions,
      completedToday: (missionsData.completedToday || 0) + 1,
    };
    
    await kv.set(`missions:${userId}`, updatedMissionsData);
    
    // Update user XP
    const userData = await kv.get(`user:${userId}`) || {};
    const currentXP = userData.xpLevel || 0;
    const currentStreak = userData.streak || 0;
    
    const updatedUserData = {
      ...userData,
      xpLevel: currentXP + xpEarned,
      lastMissionDate: new Date().toISOString(),
      // Update streak logic can be added here
    };
    
    await kv.set(`user:${userId}`, updatedUserData);

    return c.json({ 
      success: true,
      message: "Mission completed successfully",
      xpEarned,
      newXP: currentXP + xpEarned
    });

  } catch (error: any) {
    console.error('Error completing mission:', error?.message || String(error));
    return c.json({ error: `Server error completing mission: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Save financial data (dashboard metrics)
app.post("/financial-data", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const financialData = await c.req.json();
    
    // Save to KV store
    await kv.set(`financial:${userId}`, {
      ...financialData,
      updatedAt: new Date().toISOString()
    });

    return c.json({ 
      success: true,
      message: "Financial data saved successfully"
    });

  } catch (error: any) {
    console.error('Error saving financial data:', error?.message || String(error));
    return c.json({ error: `Server error saving financial data: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get financial data
app.get("/financial-data", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const financialData = await kv.get(`financial:${userId}`) || null;

    return c.json({ 
      success: true,
      data: financialData
    });

  } catch (error: any) {
    console.error('Error fetching financial data:', error?.message || String(error));
    return c.json({ error: `Server error fetching financial data: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get community posts
app.get("/community/posts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    // Get all posts with prefix
    const allPosts = await kv.getByPrefix('post:') || [];
    
    // Sort by timestamp (most recent first), handle missing createdAt
    const sortedPosts = allPosts
      .filter((post: any) => post && typeof post === 'object')
      .sort((a: any, b: any) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    return c.json({ 
      success: true,
      posts: sortedPosts
    });

  } catch (error: any) {
    console.error('Error fetching community posts:', error?.message || String(error));
    return c.json({ error: `Server error fetching posts: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Create community post
app.post("/community/posts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const { content, type } = await c.req.json();
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return c.json({ error: "Content is required" }, 400);
    }
    
    const userData = await kv.get(`user:${userId}`) || {};
    
    const postId = `post_${Date.now()}_${userId}`;
    const post = {
      id: postId,
      userId,
      userName: userData?.name || 'Agent',
      content: content.trim(),
      type: type || 'achievement',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`post:${postId}`, post);

    return c.json({ 
      success: true,
      message: "Post created successfully",
      post
    });

  } catch (error: any) {
    console.error('Error creating post:', error?.message || String(error));
    return c.json({ error: `Server error creating post: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get leaderboard
app.get("/leaderboard", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    // Get all users
    const allUsers = await kv.getByPrefix('user:') || [];
    
    // Sort by XP level, filter and validate data
    const sortedUsers = allUsers
      .filter((user: any) => user && typeof user === 'object' && user.isOnboarded && user.email)
      .sort((a: any, b: any) => (b.xpLevel || 0) - (a.xpLevel || 0))
      .slice(0, 50) // Top 50
      .map((user: any, index: number) => ({
        name: user.name || 'Unknown',
        email: user.email || '',
        xp: user.xpLevel || 0,
        level: Math.floor((user.xpLevel || 0) / 100),
        streak: user.streak || 0,
        rank: index + 1,
        isCurrentUser: user.email === userId
      }));

    return c.json({ 
      success: true,
      leaderboard: sortedUsers
    });

  } catch (error: any) {
    console.error('Error fetching leaderboard:', error?.message || String(error));
    return c.json({ error: `Server error fetching leaderboard: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Generate AI-powered missions using Gemini
app.post("/missions/generate", async (c) => {
  try {
    console.log('=== MISSION GENERATION REQUEST ===');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('No access token provided');
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      console.log('Invalid token');
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    console.log('User ID:', userId);

    // Get user data for personalization
    const userData = await kv.get(`user:${userId}`) || {};
    console.log('User data:', JSON.stringify(userData));
    
    // Default fallback missions - always available
    const getDefaultMissions = () => {
      const monthlyIncome = userData?.monthlyIncome || 50000;
      const goal = userData?.interests?.[0] || 'wealth freedom';
      
      return [
        {
          id: `mission_1_${Date.now()}`,
          title: 'Execute savings protocol',
          description: `Allocate ₹${Math.max(200, Math.floor(monthlyIncome * 0.05))} to emergency buffer`,
          icon: '💰',
          xp: 20,
          category: 'SAVE',
          timeEstimate: '2_MIN',
          priority: 'HIGH',
          classification: 'ALPHA',
          whyItMatters: 'Emergency fund protocols create financial stability barriers against unexpected system failures. Critical for wealth preservation.',
          tips: ['Implement automatic transfer protocols', 'Round-up transaction algorithms', 'Deploy micro-savings accumulation systems']
        },
        {
          id: `mission_2_${Date.now()}`,
          title: 'Knowledge acquisition module',
          description: goal === 'business' ? 'Research 2 startup ideas' : 'Complete investment strategy learning protocol',
          icon: '📘',
          xp: 15,
          category: 'LEARN',
          timeEstimate: '5_MIN',
          priority: 'HIGH',
          classification: 'BETA',
          whyItMatters: 'Financial intelligence upgrades optimize decision-making algorithms and prevent costly system errors.',
          tips: ['Active note-taking during data acquisition', 'Apply learned algorithms to portfolio systems', 'Share intelligence with network nodes']
        },
        {
          id: `mission_3_${Date.now()}`,
          title: 'Revenue stream expansion',
          description: goal === 'business' ? 'Create business plan outline' : 'Submit 2 freelance proposals',
          icon: '💼',
          xp: 30,
          category: 'EARN',
          timeEstimate: '30_MIN',
          priority: 'HIGH',
          classification: 'ALPHA',
          whyItMatters: 'Multiple revenue streams accelerate wealth accumulation velocity and provide system redundancy.',
          tips: ['Customize each proposal for target client systems', 'Highlight relevant skill matrices', 'Deploy competitive pricing algorithms']
        },
        {
          id: `mission_4_${Date.now()}`,
          title: 'Network expansion protocol',
          description: 'Establish 2 professional node connections',
          icon: '🤝',
          xp: 25,
          category: 'NETWORK',
          timeEstimate: '15_MIN',
          priority: 'MEDIUM',
          classification: 'GAMMA',
          whyItMatters: 'Network node expansion increases opportunity discovery rates and collaborative wealth generation potential.',
          tips: ['Deploy personalized connection requests', 'Reference mutual network nodes', 'Share valuable data insights']
        },
        {
          id: `mission_5_${Date.now()}`,
          title: 'Investment analysis protocol',
          description: 'Research 3 investment opportunity matrices',
          icon: '📊',
          xp: 25,
          category: 'LEARN',
          timeEstimate: '20_MIN',
          priority: 'HIGH',
          classification: 'BETA',
          whyItMatters: 'Investment analysis protocols optimize return algorithms and minimize risk exposure vectors.',
          tips: ['Analyze expense ratio metrics', 'Review fund management intelligence', 'Compare benchmark performance data']
        }
      ];
    };

    // Try Gemini API first if key is available
    let missions = getDefaultMissions();
    
    if (GEMINI_API_KEY) {
      console.log('Gemini API key found, attempting AI generation...');
      try {
        const prompt = `You are an AI financial advisor for a wealth-building app targeting young Indians (18-30). Generate 5 personalized daily missions for this user:

User Profile:
- Goal: ${userData?.interests?.[0] || 'wealth freedom'}
- Target Age: ${userData?.targetAge || 35}
- Monthly Income: ₹${userData?.monthlyIncome || 50000}
- Current Level: ${Math.floor((userData?.xpLevel || 0) / 100)}

Generate 5 missions in this EXACT JSON format (must be valid JSON, no markdown, no code blocks):
[
  {
    "id": "mission_1",
    "title": "Mission title",
    "description": "Short description",
    "icon": "emoji",
    "xp": 20,
    "category": "SAVE",
    "timeEstimate": "5_MIN",
    "priority": "HIGH",
    "classification": "ALPHA",
    "whyItMatters": "Explanation",
    "tips": ["tip1", "tip2", "tip3"]
  }
]

Return ONLY the JSON array, nothing else. Make missions specific, actionable, and relevant to Indian context. Use tactical/gaming language like "Execute protocol", "Deploy strategy", etc.`;

        const aiResponse = await callGeminiAPI(prompt);
        console.log('Gemini API response received, length:', aiResponse?.length);
        
        // Try to extract JSON from response
        try {
          // Remove markdown code blocks if present
          let cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          // Try to find JSON array
          const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedMissions = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsedMissions) && parsedMissions.length > 0) {
              // Ensure all missions have required fields
              missions = parsedMissions.map((m: any, index: number) => ({
                id: m.id || `mission_${index + 1}_${Date.now()}`,
                title: m.title || 'Mission',
                description: m.description || '',
                icon: m.icon || '🎯',
                xp: m.xp || 20,
                category: m.category || 'LEARN',
                timeEstimate: m.timeEstimate || '10_MIN',
                priority: m.priority || 'MEDIUM',
                classification: m.classification || 'BETA',
                whyItMatters: m.whyItMatters || 'This mission helps you progress towards your financial goals.',
                tips: Array.isArray(m.tips) ? m.tips : ['Complete this mission to earn XP']
              }));
              console.log('Successfully parsed AI missions:', missions.length);
            }
          }
        } catch (parseError: any) {
          console.error('Failed to parse AI response, using defaults:', parseError.message);
          console.error('AI Response:', aiResponse?.substring(0, 500));
          missions = getDefaultMissions();
        }
      } catch (geminiError: any) {
        console.error('Gemini API error, using defaults:', geminiError.message);
        missions = getDefaultMissions();
      }
    } else {
      console.log('No Gemini API key, using default missions');
      missions = getDefaultMissions();
    }

    // Ensure missions array is valid
    if (!Array.isArray(missions) || missions.length === 0) {
      console.log('Missions array invalid, using defaults');
      missions = getDefaultMissions();
    }

    // Save missions to KV store
    const missionsToSave = missions.map((m: any) => ({ ...m, completed: false }));
    console.log('Saving missions to KV store:', missionsToSave.length);
    
    await kv.set(`missions:${userId}`, {
      missions: missionsToSave,
      completedToday: 0,
      lastReset: new Date().toISOString()
    });

    console.log('Missions saved successfully');

    return c.json({ 
      success: true,
      missions: missionsToSave
    });

  } catch (error: any) {
    console.error('=== MISSION GENERATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Even on error, return default missions
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const userId = verifyToken(accessToken || '');
      if (userId) {
        const userData = await kv.get(`user:${userId}`) || {};
        const defaultMissions = [
          {
            id: `mission_1_${Date.now()}`,
            title: 'Execute savings protocol',
            description: 'Allocate ₹200 to emergency buffer',
            icon: '💰',
            xp: 20,
            category: 'SAVE',
            timeEstimate: '2_MIN',
            priority: 'HIGH',
            classification: 'ALPHA',
            whyItMatters: 'Emergency fund protocols create financial stability.',
            tips: ['Implement automatic transfers']
          },
          {
            id: `mission_2_${Date.now()}`,
            title: 'Knowledge acquisition',
            description: 'Complete financial literacy module',
            icon: '📘',
            xp: 15,
            category: 'LEARN',
            timeEstimate: '5_MIN',
            priority: 'HIGH',
            classification: 'BETA',
            whyItMatters: 'Financial intelligence optimizes decisions.',
            tips: ['Take notes', 'Apply learnings']
          }
        ];
        
        await kv.set(`missions:${userId}`, {
          missions: defaultMissions.map((m: any) => ({ ...m, completed: false })),
          completedToday: 0,
          lastReset: new Date().toISOString()
        });

        return c.json({ 
          success: true,
          missions: defaultMissions
        });
      }
    } catch (fallbackError: any) {
      console.error('Fallback mission generation also failed:', fallbackError?.message || String(fallbackError));
    }
    
    return c.json({ error: `Server error generating missions: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Add friend
app.post("/friends/add", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const { friendEmail } = await c.req.json();
    
    // Check if friend exists
    const friendData = await kv.get(`user:${friendEmail}`);
    if (!friendData) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get current user's friends list
    const userData = await kv.get(`user:${userId}`) || {};
    const friends = userData.friends || [];
    
    // Check if already friends
    if (friends.includes(friendEmail)) {
      return c.json({ error: "Already friends with this user" }, 400);
    }

    // Add friend
    friends.push(friendEmail);
    await kv.set(`user:${userId}`, {
      ...userData,
      friends
    });

    // Add reverse friendship
    const friendUserData = await kv.get(`user:${friendEmail}`) || {};
    const friendFriends = friendUserData.friends || [];
    if (!friendFriends.includes(userId)) {
      friendFriends.push(userId);
      await kv.set(`user:${friendEmail}`, {
        ...friendUserData,
        friends: friendFriends
      });
    }

    return c.json({ 
      success: true,
      message: "Friend added successfully",
      friend: {
        name: friendData.name,
        email: friendEmail,
        xp: friendData.xpLevel || 0,
        level: Math.floor((friendData.xpLevel || 0) / 100)
      }
    });

  } catch (error: any) {
    console.error('Error adding friend:', error?.message || String(error));
    return c.json({ error: `Server error adding friend: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get friends list
app.get("/friends", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const userData = await kv.get(`user:${userId}`) || {};
    const friendEmails = userData.friends || [];
    
    // Get friend details
    const friends = [];
    for (const email of friendEmails) {
      const friendData = await kv.get(`user:${email}`);
      if (friendData) {
        friends.push({
          name: friendData.name,
          email: email,
          xp: friendData.xpLevel || 0,
          level: Math.floor((friendData.xpLevel || 0) / 100),
          streak: friendData.streak || 0
        });
      }
    }

    return c.json({ 
      success: true,
      friends
    });

  } catch (error: any) {
    console.error('Error fetching friends:', error?.message || String(error));
    return c.json({ error: `Server error fetching friends: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Search users
app.get("/users/search", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const query = c.req.query('q') || '';
    
    if (!query || query.length < 2) {
      return c.json({ success: true, users: [] });
    }

    // Get all users
    const allUsers = await kv.getByPrefix('user:') || [];
    
    // Filter by name or email, validate data
    const filteredUsers = allUsers
      .filter((user: any) => 
        user && 
        typeof user === 'object' &&
        user.isOnboarded && 
        user.email && 
        user.email !== userId &&
        (user.name?.toLowerCase().includes(query.toLowerCase()) || 
         user.email.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 20) // Limit to 20 results
      .map((user: any) => ({
        name: user.name || 'Unknown',
        email: user.email || '',
        xp: user.xpLevel || 0,
        level: Math.floor((user.xpLevel || 0) / 100)
      }));

    return c.json({ 
      success: true,
      users: filteredUsers
    });

  } catch (error: any) {
    console.error('Error searching users:', error?.message || String(error));
    return c.json({ error: `Server error searching users: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Add transaction
app.post("/transactions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const transaction = await c.req.json();
    
    // Validate required fields
    if (!transaction.type || !['income', 'expense', 'saving', 'investment'].includes(transaction.type)) {
      return c.json({ error: "Invalid transaction type. Must be: income, expense, saving, or investment" }, 400);
    }
    
    if (!transaction.amount || typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      return c.json({ error: "Invalid amount. Must be a positive number" }, 400);
    }
    
    // Get existing transactions
    const existingTransactions = await kv.get(`transactions:${userId}`) || [];
    const transactions = Array.isArray(existingTransactions) ? existingTransactions : [];
    
    // Add new transaction
    const newTransaction = {
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description || '',
      category: transaction.category || '',
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    await kv.set(`transactions:${userId}`, transactions);

    // Update user's current savings and net worth
    const userData = await kv.get(`user:${userId}`) || {};
    const currentSavings = Number(userData.currentSavings) || 0;
    const currentNetWorth = Number(userData.currentNetWorth) || 0;
    
    const amount = Number(transaction.amount);
    const type = transaction.type;
    
    let newSavings = currentSavings;
    let newNetWorth = currentNetWorth;
    
    if (type === 'saving') {
      newSavings += amount;
      newNetWorth += amount;
    } else if (type === 'investment') {
      newNetWorth += amount;
    } else if (type === 'income') {
      newNetWorth += amount;
    } else if (type === 'expense') {
      newNetWorth -= amount;
    }
    
    await kv.set(`user:${userId}`, {
      ...userData,
      currentSavings: Math.max(0, newSavings),
      currentNetWorth: Math.max(0, newNetWorth)
    });

    return c.json({ 
      success: true,
      transaction: newTransaction,
      newSavings: Math.max(0, newSavings),
      newNetWorth: Math.max(0, newNetWorth)
    });

  } catch (error: any) {
    console.error('Error adding transaction:', error?.message || String(error));
    return c.json({ error: `Server error adding transaction: ${error?.message || 'Unknown error'}` }, 500);
  }
});

// Get transactions
app.get("/transactions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const userId = verifyToken(accessToken);
    if (!userId) {
      return c.json({ error: "Unauthorized - invalid or expired token" }, 401);
    }

    const transactionsData = await kv.get(`transactions:${userId}`);
    const transactions = Array.isArray(transactionsData) ? transactionsData : [];

    return c.json({ 
      success: true,
      transactions
    });

  } catch (error: any) {
    console.error('Error fetching transactions:', error?.message || String(error));
    return c.json({ error: `Server error fetching transactions: ${error?.message || 'Unknown error'}` }, 500);
  }
});

Deno.serve(app.fetch);