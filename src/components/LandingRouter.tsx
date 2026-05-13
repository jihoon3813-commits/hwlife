import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import App from '../App';
import LivingPage from '../pages/LivingPage';
import LivingPage2 from '../pages/LivingPage2';
import SpecialPage from '../pages/SpecialPage';
import SpecialPage2 from '../pages/SpecialPage2';
import ConsentPage from '../pages/ConsentPage';

export default function LandingRouter() {
  const path = window.location.pathname.toLowerCase();
  const segments = path.split('/').filter(Boolean);
  
  // /consent 경로 → 동의서 서명 페이지
  const isConsentPath = path.startsWith('/consent');
  
  // Parse segments
  // /living/bestone -> template: /living, subdomain: bestone
  // /special/bestone -> template: /special, subdomain: bestone
  // /living -> template: /living, subdomain: null
  // /bestone -> template: null, subdomain: bestone
  
  const isLiving2Path = path.startsWith('/living2');
  const isLivingPath = !isLiving2Path && path.startsWith('/living');
  const isSpecial2Path = path.startsWith('/special2');
  const isSpecialPath = !isSpecial2Path && path.startsWith('/special');
  const searchParams = new URLSearchParams(window.location.search);
  const queryChannel = Array.from(searchParams.keys())[0] || searchParams.get('channel');
  
  const subdomainFromPath = (isLivingPath || isLiving2Path || isSpecialPath || isSpecial2Path)
    ? (segments.length >= 2 ? segments[1] : (queryChannel || null)) 
    : (segments.length >= 1 && !isConsentPath ? segments[0] : (queryChannel || null));

  // Consent page - 동의서 서명 (채널 조회 불필요)
  if (isConsentPath) {
    return <ConsentPage />;
  }

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
  if (isLiving2Path) {
    return <LivingPage2 channelSubdomain={channel?.subdomain} />;
  }
  if (isLivingPath) {
    return <LivingPage channelSubdomain={channel?.subdomain} />;
  }

  if (isSpecial2Path) {
    return <SpecialPage2 channelSubdomain={channel?.subdomain} />;
  }
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
    if (primaryPath === '/living2') {
      return <LivingPage2 channelSubdomain={channel.subdomain} />;
    }
    if (primaryPath === '/special') {
      return <SpecialPage channelSubdomain={channel.subdomain} />;
    }
    if (primaryPath === '/special2') {
      return <SpecialPage2 channelSubdomain={channel.subdomain} />;
    }
  }

  // 4. Default to main App
  return <App />;
}


