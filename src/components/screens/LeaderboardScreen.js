import React from 'react';

const LeaderboardCard = ({ item, rank }) => (
    <div className="leaderboardCard">
        <span className="leaderboardRank">#{rank}</span>
        <div className="leaderboardInfo">
            <p className="leaderboardName">{item.name}</p>
            <p className="leaderboardResolved">{item.resolved} issues resolved</p>
        </div>
        <span className="leaderboardScore">{item.score.toFixed(1)} ★</span>
    </div>
);

const LeaderboardScreen = ({ data }) => (
    <div className="container">
        <div className="header">
            <h1 className="headerTitle">Performance Leaderboard</h1>
        </div>
        <div className="listScrollView">
            <h2 className="leaderboardSectionTitle">Top Performing NGOs</h2>
            {data?.ngos
                ?.sort((a, b) => b.score - a.score)
                .map((item, index) => <LeaderboardCard key={`ngo-${item.id}`} item={item} rank={index + 1} />)}
            <h2 className="leaderboardSectionTitle">Municipal Corporations</h2>
            {data?.municipalities
                ?.sort((a, b) => b.score - a.score)
                .map((item, index) => <LeaderboardCard key={`mun-${item.id}`} item={item} rank={index + 1} />)}
        </div>
    </div>
);

export default LeaderboardScreen;
