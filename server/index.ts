import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

// Initialize the Twitter client
const client = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(cookieParser());

// Step 1: Start OAuth flow
app.get('/auth/twitter', async (req: Request, res: Response) => {
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(process.env.TWITTER_CALLBACK_URL!, {
    scope: ['tweet.read', 'users.read'],
  });

  // Save state and codeVerifier in cookies (for security)
  res.cookie('oauth_state', state, { httpOnly: true });
  res.cookie('code_verifier', codeVerifier, { httpOnly: true });
  res.redirect(url);
});

// Step 2: Handle Twitter callback
app.get('/auth/twitter/callback', async (req: Request, res: Response) => {
  const codeVerifier = req.cookies.code_verifier;
  const { code } = req.query;

  try {
    // Fetch user data from Twitter
    await client.loginWithOAuth2({
      code: code as string,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL!,
    });


    // res.redirect(`${process.env.FRONTEND_URL}/dashboard?user=${user.username}`);
    res.redirect(`${process.env.FRONTEND_URL}`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
});

// Start server
app.listen(port, () => console.log(`Backend running on port ${port}`));