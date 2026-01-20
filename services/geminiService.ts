
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyInfo, BusinessPlanData } from "../types";

/**
 * 사업계획서 생성 함수
 */
export async function generateBusinessPlan(info: CompanyInfo, userKey?: string): Promise<BusinessPlanData> {
  const apiKey = userKey || process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error("API 키가 설정되지 않았습니다. 상단 설정 버튼을 통해 키를 입력해 주세요.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const systemInstruction = `
    당신은 대한민국 중소벤처기업부 산하 '초기창업패키지'의 수석 컨설턴트입니다. 
    사용자의 짧은 입력값으로부터 최소 20페이지 분량의 가치를 지닌 전문 사업계획서를 추출해야 합니다.

    [작성 대원칙]
    1. 분량 대폭 확대: 모든 서술형 답변은 기존 AI 응답의 3배 이상으로 작성하십시오. 
    2. 전문성: 경영학적 용어, 산업 통계, 기술적 메커니즘을 상세히 서술하십시오.
    3. 논리 구조:
       - 문제인식 2.1: '창업자의 내적 동기(철학, 경험)'와 '시장/사회적 외적 동기(환경 변화, 페인포인트)'를 각각 500자 이상 전문적으로 서술할 것.
       - 문제인식 2.2: 제품의 존재 이유와 국가적/사회적 필요성을 500자 내외로 서술할 것.
       - 실현가능성 3.1: 현재의 구체적 개발 공정율과 기술적 난제 해결 과정을 매우 상세히 적고, 미래의 확장된 서비스 모습을 구체적으로 묘사할 것.
       - 로드맵: 단기/중기/장기로 나누어 순차적으로 작성하며, 각 단계별 KPI와 마일스톤을 3배 이상 상세히 서술할 것.
    4. 톤앤매너: 공신력 있는 보고서 형태의 개조식과 서술식을 혼용하십시오.
  `;

  const userPrompt = `
    다음 정보를 바탕으로 정부지원사업용 초대형 사업계획서를 작성하십시오.
    기업명: ${info.companyName}
    아이템: ${info.businessItem}
    개발현황: ${info.devStatus}
    타겟: ${info.targetAudience}
    팀역량: ${info.teamInfo}
    비고: ${info.additionalInfo}
  `;

  const attachmentParts = (info.attachments || []).map(att => ({
    inlineData: {
      data: att.data,
      mimeType: att.mimeType
    }
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: userPrompt }, ...attachmentParts] },
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 32768,
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                introduction: { type: Type.STRING },
                differentiation: { type: Type.STRING },
                targetMarket: { type: Type.STRING },
                goals: { type: Type.STRING },
              },
              required: ["introduction", "differentiation", "targetMarket", "goals"]
            },
            problem: {
              type: Type.OBJECT,
              properties: {
                internalMotivation: { type: Type.STRING, description: "창업자의 내적 동기 및 철학 (500자 이상)" },
                externalMotivation: { type: Type.STRING, description: "시장 및 환경적 외적 동기 (500자 이상)" },
                purpose: { type: Type.STRING, description: "목적 및 필요성 (500자 내외)" },
              },
              required: ["internalMotivation", "externalMotivation", "purpose"]
            },
            solution: {
              type: Type.OBJECT,
              properties: {
                devStatusDetailed: { type: Type.STRING, description: "상세 개발 현황 및 목표" },
                futureGoals: { type: Type.STRING, description: "비전 및 미래상" },
                stepwisePlan: { type: Type.STRING, description: "3배 이상 확장된 순차적 로드맵" },
                budgetTable: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING },
                      period: { type: Type.STRING },
                      content: { type: Type.STRING },
                    }
                  }
                },
                customerResponse: { type: Type.STRING },
                competitorAnalysis: { type: Type.STRING },
              },
              required: ["devStatusDetailed", "futureGoals", "stepwisePlan", "budgetTable", "customerResponse", "competitorAnalysis"]
            },
            scaleUp: {
              type: Type.OBJECT,
              properties: {
                fundingPlan: { type: Type.STRING },
                salesPlan: { type: Type.STRING },
                policyFundPlan: { type: Type.STRING },
                detailedBudget: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      basis: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                    }
                  }
                },
                marketResearchDomestic: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } }
                  }
                },
                marketApproachDomestic: { type: Type.STRING },
                marketResearchGlobal: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } }
                  }
                },
                marketApproachGlobal: { type: Type.STRING },
              },
              required: ["fundingPlan", "detailedBudget", "marketResearchDomestic", "marketApproachDomestic", "marketResearchGlobal", "marketApproachGlobal"]
            },
            team: {
              type: Type.OBJECT,
              properties: {
                capability: { type: Type.STRING },
                hiringStatus: { type: Type.STRING },
                socialValue: { type: Type.STRING },
              },
              required: ["capability", "hiringStatus", "socialValue"]
            }
          },
          required: ["summary", "problem", "solution", "scaleUp", "team"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 응답을 생성하지 못했습니다.");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

/**
 * 이미지 생성 함수
 */
export async function generateImages(info: CompanyInfo, userKey?: string): Promise<string[]> {
  const apiKey = userKey || process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return [];

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const images: string[] = [];
  
  // 1. 기본 구상도 (Concept) 2컷
  // 2. 활용의 예 (Usage) 2컷
  // 3. 미래 비전 (Future Vision) 1컷
  const prompts = [
    `Product design blueprint for ${info.businessItem}, minimalist aesthetic, technical drawing style, white background, high resolution.`,
    `Isometric 3D model of ${info.businessItem} main feature, clean studio lighting, soft shadows, futuristic look.`,
    `A high-quality lifestyle photo showing people using ${info.businessItem} in a real-world ${info.targetAudience} environment.`,
    `Professional close-up of ${info.businessItem} interface or physical hardware in action, cinematic focus.`,
    `Panoramic future city view or advanced ecosystem integrated with ${info.businessItem}, massive scale, utopian vision, golden hour lighting.`
  ];

  for (const p of prompts) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: p }] },
        config: {
          imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            images.push(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
      }
    } catch (e) {
      console.error("Image generation failed:", e);
    }
  }
  return images;
}
