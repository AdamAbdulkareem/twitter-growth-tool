import "./Dashboard.css";

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

import Image from "next/image";
import createFromScratch from "assets/create-from-scratch.png";
import postAboutTrend from "assets/post-about-trends.png"


const dashboardCardHeight = "100"
const dashboardCardWidth = "110"

const Dashboard = ({ analyticsData, topTweets, tweetsLoading }) => {
    console.log("Dashboard component");
    if (!analyticsData) {
        return <div>Loading...</div>;
    }

    return (
        // <div>
        //     <h1>Twitter Analytics Dashboard</h1>
        //     <h2>User Info</h2>
        //     <p>User ID: {analyticsData.user?.data?.id}</p>
        //     <p>Name: {analyticsData.user?.data?.name}</p>
        //     <p>Username: {analyticsData.user?.data?.username}</p>
        //     <p>Followers: {analyticsData.user?.data?.public_metrics?.followers_count}</p>
        //     <p>Following: {analyticsData.user?.data?.public_metrics?.following_count}</p>
        //     <p>Tweets: {analyticsData.user?.data?.public_metrics?.tweet_count}</p>

        //     <h2>Top Tweets</h2>
        //     {tweetsLoading ? (
        //         <p>Loading top tweets...</p>
        //     ) : topTweets.length > 0 ? (
        //         <ul>
        //             {topTweets.map(tweet => (
        //                 <li key={tweet.id}>
        //                     <p>{tweet.text}</p>
        //                     <p>Likes: {tweet.public_metrics.like_count}</p>
        //                     <p>Retweets: {tweet.public_metrics.retweet_count}</p>
        //                 </li>
        //             ))}
        //         </ul>
        //     ) : (
        //         <p>No tweets found</p>
        //     )}
        // </div>
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
                        <div><FaCalendarAlt size={25} /></div>
                        <span>Plan</span>
                    </div>
                    <div className="icon-text-block">
                        <div><PiPlusCircleBold size={25} /></div>
                        <span>Create</span>
                    </div>
                    <div className="icon-text-block">
                        <div><FaInbox size={24} /></div>

                        <span>Inbox</span>
                    </div>
                    <div className="icon-text-block">
                        <div><SiGoogleanalytics size={24} /></div>

                        <span>Analytics</span>
                    </div>
                    <div className="icon-text-block">
                        <div><RiAdvertisementLine size={24} /></div>

                        <span>Ads</span>
                    </div>
                    <div className="icon-text-block">
                        <div>    <FcIdea size={24} /></div>

                        <span>Listening</span>
                    </div>
                    <div className="icon-text-block">
                        <div> <FiMoreHorizontal size={24} /></div>

                        <span>More</span>
                    </div>
                </div>
                <div className="dashboard-footer">
                    <div className="icon-text-block">
                        <div><IoNotifications size={24} /></div>

                        <span>Notifications</span>
                    </div>
                    <div className="icon-text-block">
                        <div>  <FaQuestion size={24} /></div>

                        <span>FAQ</span>
                    </div>
                    <div className="icon-text-block">
                        <div><CgProfile size={24} /></div>

                        <span>Profile</span>
                    </div>
                </div>
            </aside>
            <section className="dashboard-main">
                <div className="dashboard-main-card">
                    <span>Create from Scratch</span>
                    <div> <Image src={createFromScratch} alt="create from scratch" width={dashboardCardWidth} height={dashboardCardHeight}/></div>
                </div>
                <div className="dashboard-main-card">
                    <span>Post about trends</span>
                    <div>  <Image src={postAboutTrend} alt="create from scratch" width={dashboardCardWidth} height={dashboardCardHeight}/></div>
                </div>
                <div className="dashboard-main-card">
                    <span>Start writing with AI</span>
                    <div> <Image src={createFromScratch} alt="create from scratch" width={dashboardCardWidth} height={dashboardCardHeight} /></div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
