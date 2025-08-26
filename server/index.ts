import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import dayjs from "dayjs";

dotenv.config();

// Check if required env variables are present
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
  console.error(
    "ERROR: Twitter client ID or secret is missing in environment variables!"
  );
  console.error(
    "Please make sure TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET are defined in your .env file."
  );
  process.exit(1);
}

// Initialize the Twitter client with proper error handling
const client = new TwitterApi({
  clientId: TWITTER_CLIENT_ID,
  clientSecret: TWITTER_CLIENT_SECRET,
});

console.log(
  "Twitter API client initialized successfully with client ID:",
  TWITTER_CLIENT_ID.substring(0, 5) + "..."
);

const app = express();
const port = process.env.PORT || 5001;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());

// Step 1: Start OAuth flow
app.get("/auth/twitter", async (req: Request, res: Response) => {
  try {
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.TWITTER_CALLBACK_URL!,
      {
        scope: [
          "tweet.read",
          "users.read",
          "tweet.write",
          "offline.access",
          "tweet.moderate.write",
        ],
      }
    );

    // Save state and codeVerifier in cookies (for security)
    res.cookie("oauth_state", state, { httpOnly: true });
    res.cookie("code_verifier", codeVerifier, { httpOnly: true });
    res.redirect(url);
  } catch (error) {
    res.status(500).send(`${error} starting OAuth flow`);
  }
});

// Function to fetch user data and analytics
async function fetchUserDataAndAnalytics(loggedClient: TwitterApi) {
  const user = await loggedClient.v2.me({
    // Request additional fields
    "user.fields": [
      "created_at",
      "description",
      "location",
      "profile_image_url",
      "public_metrics",
      "verified",
      "protected",
      "url",
      "entities",
      "pinned_tweet_id",
    ],
  });

  return {
    user,
  };
}

// Define the Tweet interface for proper typing
interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
    impression_count?: number;
  };
  edit_history_tweet_ids?: string[];
}

// Define a TwitterApiError interface for proper error handling
type TwitterApiError = {
  code?: number;
  message?: string;
  data?: unknown;
};

async function getTopTweets(
  loggedClient: TwitterApi,
  userId: string,
  metric = "likes",
  count = 10
) {
  try {
    // Array to collect all tweets
    let allTweets: Tweet[] = [];
    let paginationToken: string | undefined = undefined;

    // Reduce the number of pages from 5 to 1 to avoid rate limits
    const maxPages = 1;
    let currentPage = 0;

    // Get the date 1 year ago for filtering
    const oneYearAgo = dayjs().subtract(365, "day");

    // Use pagination to fetch tweets (limited to avoid rate limits)
    while (currentPage < maxPages) {
      try {
        const tweets = await loggedClient.v2.userTimeline(userId, {
          max_results: 100,
          pagination_token: paginationToken,
          "tweet.fields": ["public_metrics", "created_at"],
          exclude: ["retweets", "replies"],
        });

        // Check if we have tweets in this page
        if (
          !tweets.data ||
          !tweets.data.data ||
          tweets.data.data.length === 0
        ) {
          break;
        }

        // Get tweet array from the paginated result
        const tweetArray = Array.isArray(tweets.data)
          ? tweets.data
          : tweets.data.data;

        // Sample log for debugging
        if (currentPage === 0 && tweetArray.length > 0) {
          console.log(
            "Sample tweet structure:",
            JSON.stringify(tweetArray[0], null, 2)
          );
        }

        // Add tweets to our collection
        allTweets = [...allTweets, ...(tweetArray as Tweet[])];

        // Check if we have more pages
        paginationToken = tweets.data.meta?.next_token;
        if (!paginationToken) {
          break; // No more pages
        }

        currentPage++;

        // Add a delay between pagination requests to avoid rate limits (3 seconds)
        if (currentPage < maxPages && paginationToken) {
          console.log("Waiting 3 seconds before fetching next page...");
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error: unknown) {
        // Check if it's a rate limit error
        const apiError = error as TwitterApiError;
        if (apiError && apiError.code === 429) {
          console.log(
            "Rate limit reached. Working with tweets already fetched."
          );
          break; // Stop trying to fetch more pages
        } else {
          // For other errors, propagate them
          throw error;
        }
      }
    }

    console.log(`Total tweets fetched: ${allTweets.length}`);

    // Define metric mapping with simple string keys
    const metricMap: Record<string, string> = {
      likes: "like_count",
      retweets: "retweet_count",
      replies: "reply_count",
      quotes: "quote_count",
      impressions: "impression_count",
    };

    const sortField = metric in metricMap ? metricMap[metric] : "like_count";
    console.log(`Sorting tweets by ${sortField}`);

    // Filter tweets created in the last year
    const recentTweets = allTweets.filter((tweet) =>
      dayjs(tweet.created_at).isAfter(oneYearAgo)
    );

    console.log(`Found ${recentTweets.length} tweets in the last year`);

    // Sort the tweets - use type assertion to handle the string indexing
    const sortedTweets = [...recentTweets].sort((a, b) => {
      // Use optional chaining and nullish coalescing to safely access nested properties
      const valueA =
        a.public_metrics?.[sortField as keyof typeof a.public_metrics] || 0;
      const valueB =
        b.public_metrics?.[sortField as keyof typeof b.public_metrics] || 0;
      return (valueB as number) - (valueA as number);
    });

    return sortedTweets.slice(0, count);
  } catch (error) {
    console.error("Error fetching top tweets:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}

// Step 2: Handle Twitter callback and fetch analytics data
app.get("/auth/twitter/callback", async (req: Request, res: Response) => {
  const codeVerifier = req.cookies.code_verifier;
  const { code } = req.query;

  try {
    // Fetch user data from Twitter
    const {
      // client: loggedClient, // Removed unused variable
      accessToken,
      // refreshToken,        // Removed unused variable
    } = await client.loginWithOAuth2({
      code: code as string,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL!,
    });

    // Save access token in cookies (for further API requests)
    res.cookie("access_token", accessToken, { httpOnly: true });

    // Redirect to dashboard with analytics data
    console.log("Redirecting to dashboard");
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
});

app.get(
  "/api/analytics-data",
  async (req: Request, res: Response): Promise<void> => {
    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const loggedClient = new TwitterApi(accessToken);

      // Fetch user data and analytics
      const analyticsData = await fetchUserDataAndAnalytics(loggedClient);

      console.log("Fetched user data and analytics:", analyticsData);

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ error: "Error fetching analytics data" });
    }
  }
);

app.get(
  "/api/top-tweets",
  async (req: Request, res: Response): Promise<void> => {
    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const { userId, metric = "likes", count = 10 } = req.query;

      if (!userId) {
        res.status(400).json({ error: "Missing required parameter: userId" });
        return;
      }

      const loggedClient = new TwitterApi(accessToken);

      // Get top tweets
      const topTweets = await getTopTweets(
        loggedClient,
        userId as string,
        metric as string,
        typeof count === "string" ? parseInt(count) : 10
      );

      res.json({ tweets: topTweets });
    } catch (error) {
      console.error("Error fetching top tweets:", error);
      res.status(500).json({ error: "Error fetching top tweets" });
    }
  }
);

// Update the tweet endpoint
app.post("/api/tweet", async (req: Request, res: Response): Promise<void> => {
  console.log("Received tweet request:", req.body);
  
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    console.log("No access token found in cookies");
    res.status(401).json({ error: "Unauthorized - No access token found" });
    return;
  }

  const { text } = req.body;

  if (!text || typeof text !== "string") {
    console.log("Invalid tweet text:", text);
    res.status(400).json({ error: "Invalid tweet text" });
    return;
  }

  try {
    console.log("Creating Twitter client with access token");
    const loggedClient = new TwitterApi(accessToken);
    
    console.log("Attempting to post tweet with text:", text);
    
    const tweet = await loggedClient.v2.tweet(text);
    
    console.log("Tweet posted successfully:", tweet.data);
    
    res.json({ 
      success: true, 
      tweet: tweet.data 
    });
  } catch (error: any) {
    console.error("Detailed error posting tweet:", {
      message: error.message,
      code: error.code,
      data: error.data,
      stack: error.stack
    });

    if (error.code === 401) {
      res.status(401).json({ 
        error: "Authentication failed. Please log in again.",
        details: error.message
      });
    } else if (error.code === 403) {
      res.status(403).json({ 
        error: "Permission denied. Check your Twitter API permissions.",
        details: error.message
      });
    } else if (error.code === 429) {
      res.status(429).json({ 
        error: "Rate limit exceeded. Please try again later.",
        details: error.message
      });
    } else {
      res.status(500).json({ 
        error: "Error posting tweet",
        details: error.message || "Unknown error occurred"
      });
    }
  }
});

// Add this interface after the Tweet interface
interface EngagementMetrics {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
}

// Add this helper function before the app.get endpoints
async function getHistoricalEngagement(
  loggedClient: TwitterApi,
  userId: string,
  startDate: Date,
  endDate: Date = new Date()
) {
  try {
    let allTweets: Tweet[] = [];
    let paginationToken: string | undefined = undefined;
    const maxPages = 5; // Increased from 1 to get more historical data
    let currentPage = 0;

    while (currentPage < maxPages) {
      try {
        const tweets = await loggedClient.v2.userTimeline(userId, {
          max_results: 100,
          pagination_token: paginationToken,
          "tweet.fields": ["public_metrics", "created_at"],
          exclude: ["retweets", "replies"],
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        });

        if (!tweets.data?.data || tweets.data.data.length === 0) {
          break;
        }

        const tweetArray = Array.isArray(tweets.data) ? tweets.data : tweets.data.data;
        allTweets = [...allTweets, ...(tweetArray as Tweet[])];

        paginationToken = tweets.data.meta?.next_token;
        if (!paginationToken) break;

        currentPage++;
        if (currentPage < maxPages && paginationToken) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error: unknown) {
        const apiError = error as TwitterApiError;
        if (apiError?.code === 429) {
          console.log("Rate limit reached. Working with tweets already fetched.");
          break;
        }
        throw error;
      }
    }

    // Group tweets by month and aggregate metrics
    const monthlyMetrics: Record<string, EngagementMetrics> = {};
    
    allTweets.forEach((tweet) => {
      const date = new Date(tweet.created_at);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      if (!monthlyMetrics[monthKey]) {
        monthlyMetrics[monthKey] = {
          date: monthKey,
          likes: 0,
          retweets: 0,
          replies: 0,
          quotes: 0,
          impressions: 0,
        };
      }

      const metrics = tweet.public_metrics || {};
      monthlyMetrics[monthKey].likes += metrics.like_count || 0;
      monthlyMetrics[monthKey].retweets += metrics.retweet_count || 0;
      monthlyMetrics[monthKey].replies += metrics.reply_count || 0;
      monthlyMetrics[monthKey].quotes += metrics.quote_count || 0;
      monthlyMetrics[monthKey].impressions += metrics.impression_count || 0;
    });

    // Convert to array and sort by date
    return Object.values(monthlyMetrics).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching historical engagement:", error);
    return [];
  }
}

// Add this new endpoint after the existing endpoints
app.get(
  "/api/historical-engagement",
  async (req: Request, res: Response): Promise<void> => {
    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const { userId, startDate } = req.query;

      if (!userId) {
        res.status(400).json({ error: "Missing required parameter: userId" });
        return;
      }

      const loggedClient = new TwitterApi(accessToken);
      const start = startDate ? new Date(startDate as string) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));

      const historicalData = await getHistoricalEngagement(
        loggedClient,
        userId as string,
        start
      );

      res.json({ engagement: historicalData });
    } catch (error) {
      console.error("Error fetching historical engagement:", error);
      res.status(500).json({ error: "Error fetching historical engagement data" });
    }
  }
);

// Start server
app.listen(port, () => console.log(`Backend running on port ${port}`));