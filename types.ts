
export interface Attachment {
  data: string;
  mimeType: string;
}

export interface CompanyInfo {
  companyName: string;
  businessItem: string;
  devStatus: string;
  targetAudience: string;
  teamInfo: string;
  additionalInfo: string;
  attachments?: Attachment[];
}

export interface MarketData {
  name: string;
  value: number;
}

export interface BusinessPlanData {
  summary: {
    introduction: string;
    differentiation: string;
    targetMarket: string;
    goals: string;
  };
  problem: {
    internalMotivation: string; // 내적 동기 (500자 이상)
    externalMotivation: string; // 외적 동기 (500자 이상)
    purpose: string;            // 목적 및 필요성 (500자 내외)
  };
  solution: {
    devStatusDetailed: string;  // 제품 서비스 상세 개발 현황
    futureGoals: string;        // 향후 목표 및 미래상
    stepwisePlan: string;       // 3배 이상 늘어난 순차적 로드맵
    budgetTable: Array<{ item: string; period: string; content: string }>;
    customerResponse: string;
    competitorAnalysis: string;
  };
  scaleUp: {
    fundingPlan: string;
    salesPlan: string;
    policyFundPlan: string;
    detailedBudget: Array<{ category: string; basis: string; amount: number }>;
    marketResearchDomestic: MarketData[];
    marketApproachDomestic: string;
    marketResearchGlobal: MarketData[];
    marketApproachGlobal: string;
  };
  team: {
    capability: string;
    hiringStatus: string;
    socialValue: string;
  };
}
