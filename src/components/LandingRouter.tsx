import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import App from '../App';
import LivingPage from '../pages/LivingPage';
import SpecialPage from '../pages/SpecialPage';

export default function LandingRouter() {
  const path = window.location.pathname.toLowerCase();
  const segments = path.split('/').filter(Boolean);
  
  // Parse segments
  // /living/bestone -> template: /living, subdomain: bestone
  // /special/bestone -> template: /special, subdomain: bestone
  // /living -> template: /living, subdomain: null
  // /bestone -> template: null, subdomain: bestone
  
  const isLivingPath = path.startsWith('/living');
  const isSpecialPath = path.startsWith('/special');
  
  const subdomainFromPath = (isLivingPath || isSpecialPath)
    ? (segments.length >= 2 ? segments[1] : null) 
    : (segments.length >= 1 ? segments[0] : null);

  // Queries
  const channelBySubdomain = useQuery(api.channels.getBySubdomain, 
    subdomainFromPath ? { subdomain: subdomainFromPath } : "skip"
  );
  
  const channel = channelBySubdomain;

  // Loading state
  const isSearchingChannel = subdomainFromPath && channelBySubdomain === undefined;


  if (isSearchingChannel) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F2F4F6]">
        <div className="w-8 h-8 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Routing
  // 1. If it's a living path, show LivingPage
  if (isLivingPath) {
    return <LivingPage channelSubdomain={channel?.subdomain} />;
  }

  // 2. If it's a special path, show SpecialPage
  if (isSpecialPath) {
    return <SpecialPage channelSubdomain={channel?.subdomain} />;
  }

  // 3. If it's a channel subdomain, check its primary landing
  if (channel) {
    const assignedPaths = channel.landingPages || (channel.landingPage ? [channel.landingPage] : []);
    const primaryPath = assignedPaths[0] || '/';
    
    if (primaryPath === '/living') {
      return <LivingPage channelSubdomain={channel.subdomain} />;
    }
    if (primaryPath === '/special') {
      return <SpecialPage channelSubdomain={channel.subdomain} />;
    }
  }

  // 4. Default to main App
  return <App />;
}


