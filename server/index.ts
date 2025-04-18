import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import dayjs from "dayjs";

dotenv.config();

// Initialize the Twitter client
const client = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

const app = express();
const port = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());

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

async function getTopTweets(
  loggedClient: TwitterApi,
  userId: string,
  metric = "likes",
  count = 10
) {
  try {
    const tweets = await loggedClient.v2.userTimeline(userId, {
      max_results: 100,
      "tweet.fields": ["public_metrics", "created_at"], // Ensure created_at is included
      exclude: ["retweets", "replies"],
    });

    // Check if we have tweets
    if (!tweets.data || !tweets.data.data || tweets.data.data.length === 0) {
      return [];
    }

    // Get tweet array from the paginated result
    const tweetArray = Array.isArray(tweets.data)
      ? tweets.data
      : tweets.data.data;

    if (tweetArray.length > 0) {
      console.log(
        "Sample tweet structure:",
        JSON.stringify(tweetArray[0], null, 2)
      );
    }

    // Define metric mapping with proper typing
    const metricMap: Record<string, string> = {
      likes: "like_count",
      retweets: "retweet_count",
      replies: "reply_count",
      quotes: "quote_count",
      impressions: "impression_count",
    };

    const sortField = metric in metricMap ? metricMap[metric] : "like_count";

    // Calculate the date 30 days ago
    const thirtyDaysAgo = dayjs().subtract(30, "day");

    // Filter tweets created in the last 30 days
    const recentTweets = tweetArray.filter((tweet) =>
      dayjs(tweet.created_at).isAfter(thirtyDaysAgo)
    );

    console.log(`Found ${recentTweets.length} tweets in the last 30 days`);

    // Sort the tweets
    const sortedTweets = [...recentTweets].sort((a, b) => {
      return (
        (b.public_metrics?.[sortField] || 0) -
        (a.public_metrics?.[sortField] || 0)
      );
    });

    return sortedTweets.slice(0, count);
  } catch (error) {
    console.error("Error fetching top tweets:", error);
    throw error;
  }
}

// Step 2: Handle Twitter callback and fetch analytics data
app.get("/auth/twitter/callback", async (req: Request, res: Response) => {
  const codeVerifier = req.cookies.code_verifier;
  const { code } = req.query;

  try {
    console.log("Received code:", code);
    console.log("Received codeVerifier:", codeVerifier);

    // Fetch user data from Twitter
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
    } = await client.loginWithOAuth2({
      code: code as string,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL!,
    });

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

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

// Start server
app.listen(port, () => console.log(`Backend running on port ${port}`));