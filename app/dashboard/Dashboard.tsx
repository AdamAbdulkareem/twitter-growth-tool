import "./Dashboard.css";
import { useState, useEffect } from "react";
import CreateTweetModal from "../components/CreateTweetModal";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { FaCalendarAlt } from "react-icons/fa";
import { PiPlusCircleBold } from "react-icons/pi";
import { FaInbox } from "react-icons/fa";
import { SiGoogleanalytics } from "react-icons/si";
import { RiAdvertisementLine } from "react-icons/ri";
import { FcIdea } from "react-icons/fc";
import { FiMoreHorizontal } from "react-icons/fi";
import { IoNotifications } from "react-icons/io5";
import { FaQuestion } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import { IoInformationCircleOutline } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import { FaRetweet } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";

import Image from "next/image";
import createFromScratch from "assets/create-from-scratch.png";
import postAboutTrend from "assets/post-about-trends.png";
import { EngagementMetrics } from "../../types/engagement";

// Define types for the component props
interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count?: number;
    quote_count?: number;
  };
}

interface AnalyticsData {
  user: {
    data: {
      id: string;
      name: string;
      username: string;
      public_metrics: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
      };
    };
  };
}

interface DashboardProps {
  analyticsData: AnalyticsData | null;
  topTweets: Tweet[];
  tweetsLoading: boolean;
}

const dashboardCardHeight = "90";
const dashboardCardWidth = "100";

const Dashboard = ({
  analyticsData,
  topTweets,
  tweetsLoading,
}: DashboardProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [historicalData, setHistoricalData] = useState<EngagementMetrics[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!analyticsData?.user?.data?.id) return;

      try {
        const response = await axios.get<{ engagement: EngagementMetrics[] }>(
          `http://localhost:5001/api/historical-engagement?userId=${analyticsData.user.data.id}`,
          { withCredentials: true }
        );
        setHistoricalData(response.data.engagement);
      } catch (err) {
        setHistoricalError("Failed to load historical engagement data");
        console.error("Error fetching historical engagement:", err);
      } finally {
        setHistoricalLoading(false);
      }
    };

    fetchHistoricalData();
  }, [analyticsData?.user?.data?.id]);

  console.log("Dashboard component");
  if (!analyticsData) {
    return <div>Loading...</div>;
  }

  // Function to truncate text to a certain length
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Format date to readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Calculate Social Performance Score based on impressions
  const calculatePerformanceScore = () => {
    if (!historicalData.length) return 0;
    const recentImpressions =
      historicalData[historicalData.length - 1].impressions;
    const maxImpressions = Math.max(
      ...historicalData.map((d) => d.impressions)
    );
    if (maxImpressions === 0) return 0;
    return Math.round((recentImpressions / maxImpressions) * 100);
  };
  const socialPerformanceScore = calculatePerformanceScore();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Welcome, {analyticsData.user?.data?.name}!</h2>
        <div>
          <h2>Create a post</h2>
        </div>
      </header>
      <aside className="dashboard-aside">
        <div className="dashboard-sidebar">
          {/* <div className="logo">
            <Image src="../assets/logo.svg" alt="Logo"/>
          </div> */}

          <div className="icon-text-block">
            <div>
              <FaCalendarAlt size={25} />
            </div>
            <span>Plan</span>
          </div>
          <div className="icon-text-block">
            <div>
              <PiPlusCircleBold size={25} />
            </div>
            <span>Create</span>
          </div>
          <div className="icon-text-block">
            <div>
              <FaInbox size={24} />
            </div>

            <span>Inbox</span>
          </div>
          <div className="icon-text-block">
            <div>
              <SiGoogleanalytics size={24} />
            </div>

            <span>Analytics</span>
          </div>
          <div className="icon-text-block">
            <div>
              <RiAdvertisementLine size={24} />
            </div>

            <span>Ads</span>
          </div>
          <div className="icon-text-block">
            <div>
              {" "}
              <FcIdea size={24} />
            </div>

            <span>Listening</span>
          </div>
          <div className="icon-text-block">
            <div>
              {" "}
              <FiMoreHorizontal size={24} />
            </div>

            <span>More</span>
          </div>
        </div>
        <div className="dashboard-footer">
          <div className="icon-text-block">
            <div>
              <IoNotifications size={24} />
            </div>

            <span>Notifications</span>
          </div>
          <div className="icon-text-block">
            <div>
              {" "}
              <FaQuestion size={24} />
            </div>

            <span>FAQ</span>
          </div>
          <div className="icon-text-block">
            <div>
              <CgProfile size={24} />
            </div>

            <span>Profile</span>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <div
          className="dashboard-main-card"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <span>Create from Scratch</span>
          <div>
            {" "}
            <Image
              src={createFromScratch}
              alt="create from scratch"
              width={dashboardCardWidth}
              height={dashboardCardHeight}
            />
          </div>
        </div>
        <div className="dashboard-main-card">
          <span>Post about trends</span>
          <div>
            {" "}
            <Image
              src={postAboutTrend}
              alt="create from scratch"
              width={dashboardCardWidth}
              height={dashboardCardHeight}
            />
          </div>
        </div>
        <div className="dashboard-main-card">
          <span>Start writing with AI</span>
          <div>
            {" "}
            <Image
              src={createFromScratch}
              alt="create from scratch"
              width={dashboardCardWidth}
              height={dashboardCardHeight}
            />
          </div>
        </div>
      </section>
      <div className="dashboard-metrics">
        <div className="dashboard-metrics_card">
          <div className="flex justify-between items-center mb-4">
            <h3>Social Performance & Engagement</h3>
            <span>
              <IoInformationCircleOutline size={18} />
            </span>
          </div>
          <div className="flex flex-col gap-6">
            {/* Social Performance Score Section */}
            <div className="w-full p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-medium mb-2">
                Social Performance Score
              </h4>
              {/* Add your social performance score content here */}
              <div className="text-3xl font-bold text-blue-600">
                {socialPerformanceScore}/100
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Based on your recent engagement metrics
              </p>
            </div>

            {/* Historical Engagement Section */}
            <div className="w-full">
              <h4 className="text-lg font-medium mb-2">
                Historical Engagement
              </h4>
              <div className="w-full h-[400px]">
                {historicalLoading ? (
                  <div>Loading historical engagement data...</div>
                ) : historicalError ? (
                  <div className="text-red-500">{historicalError}</div>
                ) : !historicalData.length ? (
                  <div>No historical data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historicalData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                          const [year, month] = date.split("-");
                          return `${month}/${year.slice(2)}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString(),
                          "",
                        ]}
                        labelFormatter={(date) => {
                          const [year, month] = date.split("-");
                          return `${month}/${year}`;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="likes"
                        stroke="#8884d8"
                        name="Likes"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="retweets"
                        stroke="#82ca9d"
                        name="Retweets"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="replies"
                        stroke="#ffc658"
                        name="Replies"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="quotes"
                        stroke="#ff8042"
                        name="Quotes"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-metrics_card">
          <div className="flex justify-between items-center mb-4">
            <h3>Most Engaging Posts From the Past Year</h3>
            <span>
              <IoInformationCircleOutline size={18} />
            </span>
          </div>
          <div className="engaging-posts-container">
            {tweetsLoading ? (
              <p>Loading top tweets...</p>
            ) : topTweets && topTweets.length > 0 ? (
              <>
                <div className="tweet-list">
                  {topTweets.slice(0, 20).map((tweet) => (
                    <div key={tweet.id} className="tweet-card">
                      <p className="tweet-text">{truncateText(tweet.text)}</p>
                      <div className="tweet-metrics">
                        <span className="metric">
                          <FaHeart size={14} />{" "}
                          {tweet.public_metrics.like_count}
                        </span>
                        <span className="metric">
                          <FaRetweet size={14} />{" "}
                          {tweet.public_metrics.retweet_count}
                        </span>
                        {tweet.created_at && (
                          <span className="tweet-date">
                            {formatDate(tweet.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {topTweets.length > 2 && (
                  <FaChevronDown className="scroll-indicator" />
                )}
              </>
            ) : (
              <p>No engaging posts found</p>
            )}
          </div>
        </div>
      </div>

      <CreateTweetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh tweets or show success message
          console.log("Tweet posted successfully");
        }}
      />
    </div>
  );
};

export default Dashboard;
