"use client";

import { JobRecommendations } from '@/components/dashboard/JobRecommendations';

export default function JobsPage() {
  return (
    <div className="py-10">
      <div className="mb-12">
        <h1 className="text-2xl font-black mb-1 text-foreground tracking-tight">Job Matches</h1>
        <p className="text-muted-foreground font-medium text-sm">Discover opportunities that perfectly align with your verified skills.</p>
      </div>
      <JobRecommendations />
    </div>
  );
}
