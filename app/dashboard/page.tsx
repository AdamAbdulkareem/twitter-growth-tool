// "use client";

// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import Dashboard from "./Dashboard";

// const DashboardPage = () => {
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [topTweets, setTopTweets] = useState([]);
//   const [tweetsLoading, setTweetsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const controller = new AbortController();

//     const fetchData = async () => {
//       try {
//         const response = await axios.get("http://localhost:5001/api/analytics-data", {
//           withCredentials: true,
//           signal: controller.signal, // Abort fetch on unmount
//         });
//         setAnalyticsData(response.data);
//       } catch (error) {
//         if (axios.isCancel(error)) return; // Ignore if request was canceled
//         console.error("Error fetching analytics data:", error);
//         setError("Failed to load analytics data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();

//     return () => controller.abort(); // Cleanup on unmount
//   }, []);


//   // Fetch top tweets when analyticsData is available
//   useEffect(() => {
//     if (analyticsData?.user?.data?.id) {
//       setTweetsLoading(true);

//       axios.get(`http://localhost:5001/api/top-tweets?userId=${analyticsData.user.data.id}&metric=likes&count=5`, {
//         withCredentials: true
//       })
//         .then(response => {
//           setTopTweets(response.data.tweets);
//         })
//         .catch(error => {
//           console.error('Error fetching top tweets:', error);
//           // Note: Not setting main error state as we don't want to block the whole dashboard
//         })
//         .finally(() => {
//           setTweetsLoading(false);
//         });
//     }
//   }, [analyticsData]);


//   if (loading) {
//     return <div>Loading analytics data...</div>;
//   }

//   if (error) {
//     return (
//       <div>
//         <p>{error}</p>
//         <button onClick={() => window.location.reload()}>Retry</button>
//       </div>
//     );
//   }

//   return <Dashboard analyticsData={analyticsData}
//     topTweets={topTweets}
//     tweetsLoading={tweetsLoading}
//   />;
// };

// export default DashboardPage;


import React from "react";
import Dashboard from "../dashboard/Dashboard";

const mockAnalyticsData = {
  user: {
    data: {
      id: "12345",
      name: "John Doe",
      username: "johndoe",
      public_metrics: {
        followers_count: 100,
        following_count: 50,
        tweet_count: 200,
      },
    },
  },
};

const mockTopTweets = [
  {
    id: "1",
    text: "This is a top tweet!",
    public_metrics: { like_count: 10, retweet_count: 5 },
  },
  {
    id: "2",
    text: "Another great tweet!",
    public_metrics: { like_count: 8, retweet_count: 3 },
  },
];

export default function DashboardTestPage() {
  return (
    <Dashboard
      analyticsData={mockAnalyticsData}
      topTweets={mockTopTweets}
      tweetsLoading={false}
    />
  );
}