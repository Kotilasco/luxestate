"""
LangChain + Gemini 2.5 Flash Service for Natural Language Reporting and Marketing Analysis
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough


class LangChainService:
    """Service for AI-powered natural language reporting and marketing analysis using Gemini 2.5 Flash."""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            # Fallback to mock mode for development
            self.llm = None
            self.mock_mode = True
        else:
            # Initialize Gemini 2.5 Flash
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash-preview-05-20",
                temperature=0.3,
                max_output_tokens=2048,
                google_api_key=self.api_key,
            )
            self.mock_mode = False

    async def generate_natural_language_report(
        self,
        report_type: str,
        data: Dict[str, Any],
        audience: str = "technical",
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Generate a natural language report from structured data.

        Args:
            report_type: Type of report (carbon_impact, project_performance, market_analysis)
            data: Structured data to include in the report
            audience: Target audience (technical, executive, community, regulatory)
            language: Output language (en, sn, nd)

        Returns:
            Dictionary containing the generated report
        """
        if self.mock_mode:
            return self._mock_generate_report(report_type, data, audience, language)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert carbon market analyst and technical writer.
Generate a comprehensive natural language report based on the provided data.
Adapt the tone and complexity for the specified audience.
Use clear headings, bullet points, and executive summaries where appropriate."""),
            ("human", """Report Type: {report_type}
Audience: {audience}
Language: {language}

Data:
{data}

Generate a natural language report with:
1. Executive Summary
2. Key Findings
3. Detailed Analysis
4. Recommendations
5. Appendix (data tables)"""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "report_type": report_type,
            "audience": audience,
            "language": language,
            "data": json.dumps(data, indent=2),
        })

        return {
            "report": result,
            "report_type": report_type,
            "audience": audience,
            "generated_at": datetime.utcnow().isoformat(),
            "word_count": len(result.split()),
        }

    async def generate_marketing_analysis(
        self,
        project_data: Dict[str, Any],
        target_market: str,
        competitor_analysis: bool = True,
    ) -> Dict[str, Any]:
        """
        Generate marketing analysis and positioning for carbon projects.

        Args:
            project_data: Project details and performance metrics
            target_market: Target buyer segment (corporate, aviation, sovereign)
            competitor_analysis: Whether to include competitor comparison

        Returns:
            Marketing analysis with positioning and messaging
        """
        if self.mock_mode:
            return self._mock_marketing_analysis(project_data, target_market)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a carbon market marketing strategist.
Create compelling marketing analysis and positioning for carbon credit projects.
Focus on unique value propositions, storytelling, and buyer motivations."""),
            ("human", """Project Data:
{project_data}

Target Market: {target_market}
Include Competitor Analysis: {competitor_analysis}

Generate a marketing analysis including:
1. Value Proposition
2. Target Buyer Personas
3. Key Messaging Framework
4. Positioning Statement
5. Sales Enablement Points
6. Storytelling Narrative
{f"7. Competitive Comparison" if competitor_analysis else ""}"""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "project_data": json.dumps(project_data, indent=2),
            "target_market": target_market,
            "competitor_analysis": competitor_analysis,
        })

        return {
            "analysis": result,
            "project_id": project_data.get("project_id"),
            "target_market": target_market,
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def analyze_buyer_sentiment(
        self,
        market_data: Dict[str, Any],
        buyer_feedback: List[str],
    ) -> Dict[str, Any]:
        """
        Analyze buyer sentiment and market trends from feedback and data.

        Args:
            market_data: Current market metrics and trends
            buyer_feedback: List of buyer comments/feedback

        Returns:
            Sentiment analysis with actionable insights
        """
        if self.mock_mode:
            return self._mock_sentiment_analysis(market_data, buyer_feedback)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a market research analyst specializing in carbon markets.
Analyze buyer sentiment, identify trends, and provide actionable recommendations.
Be specific about buyer motivations and concerns."""),
            ("human", """Market Data:
{market_data}

Buyer Feedback:
{feedback}

Analyze and provide:
1. Overall Sentiment Score (-1 to +1)
2. Key Themes and Topics
3. Buyer Pain Points
4. Motivating Factors
5. Market Trends
6. Recommendations for Sellers
7. Risk Alerts"""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "market_data": json.dumps(market_data, indent=2),
            "feedback": "\n".join([f"- {f}" for f in buyer_feedback]),
        })

        return {
            "sentiment_analysis": result,
            "feedback_count": len(buyer_feedback),
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def generate_project_story(
        self,
        project_data: Dict[str, Any],
        story_type: str = "impact",
        format: str = "narrative",
    ) -> Dict[str, Any]:
        """
        Generate compelling project stories for marketing and reporting.

        Args:
            project_data: Project details, impacts, and community data
            story_type: Type of story (impact, community, conservation, innovation)
            format: Output format (narrative, social_media, press_release, video_script)

        Returns:
            Generated story content
        """
        if self.mock_mode:
            return self._mock_project_story(project_data, story_type, format)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a storytelling expert for sustainability and climate action.
Create compelling narratives that connect carbon projects to human impact.
Use vivid descriptions, quotes, and emotional resonance."""),
            ("human", """Project Data:
{project_data}

Story Type: {story_type}
Format: {format}

Generate a {format} story that includes:
1. Hook/Opening
2. Context/Setting
3. Human Element
4. Environmental Impact
5. Call to Action
6. Key Quotes (if applicable)"""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "project_data": json.dumps(project_data, indent=2),
            "story_type": story_type,
            "format": format,
        })

        return {
            "story": result,
            "project_id": project_data.get("project_id"),
            "story_type": story_type,
            "format": format,
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def answer_natural_language_query(
        self,
        query: str,
        context: Dict[str, Any],
        user_role: str = "general",
    ) -> Dict[str, Any]:
        """
        Answer natural language queries about carbon projects and markets.

        Args:
            query: Natural language question
            context: Relevant data context
            user_role: Role of the user (developer, buyer, regulator, community)

        Returns:
            Natural language answer with supporting data
        """
        if self.mock_mode:
            return self._mock_nl_query(query, context, user_role)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant for the Zimbabwe Carbon Trading System.
Answer questions clearly and accurately based on the provided context.
Tailor your response to the user's role and expertise level."""),
            ("human", """User Role: {user_role}

Context Data:
{context}

User Query: {query}

Provide a clear, helpful answer. If the data doesn't fully answer the question, acknowledge limitations."""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "user_role": user_role,
            "context": json.dumps(context, indent=2),
            "query": query,
        })

        return {
            "answer": result,
            "query": query,
            "user_role": user_role,
            "generated_at": datetime.utcnow().isoformat(),
        }

    # Mock implementations for development without API keys
    def _mock_generate_report(
        self, report_type: str, data: Dict, audience: str, language: str
    ) -> Dict[str, Any]:
        """Mock implementation for report generation."""
        return {
            "report": f"""# {report_type.replace('_', ' ').title()} Report

## Executive Summary
This is a {audience}-level report generated for demonstration purposes. 
In production, this would contain AI-generated analysis of the provided data.

## Key Findings
- Finding 1: Based on the data provided
- Finding 2: Additional insight from analysis
- Finding 3: Strategic recommendation

## Data Summary
{json.dumps(data, indent=2)}

*Note: This is a mock report. Set GOOGLE_API_KEY environment variable for real AI-generated reports.*
""",
            "report_type": report_type,
            "audience": audience,
            "generated_at": datetime.utcnow().isoformat(),
            "word_count": 85,
            "mock": True,
        }

    def _mock_marketing_analysis(
        self, project_data: Dict, target_market: str
    ) -> Dict[str, Any]:
        """Mock implementation for marketing analysis."""
        return {
            "analysis": f"""# Marketing Analysis for {project_data.get('project_name', 'Project')}

## Value Proposition
High-quality carbon credits with verified co-benefits from Zimbabwe's premier conservation project.

## Target Buyer Personas
- Corporate Sustainability Officers seeking premium credits
- Airlines needing CORSIA-compliant offsets
- Governments meeting NDC targets

## Key Messaging
1. **Environmental Integrity**: Satellite-verified conservation outcomes
2. **Community Impact**: Direct benefits to 2,450 rural households
3. **Premium Quality**: Exceeds international verification standards

*Set GOOGLE_API_KEY for AI-powered marketing analysis.*
""",
            "project_id": project_data.get("project_id"),
            "target_market": target_market,
            "generated_at": datetime.utcnow().isoformat(),
            "mock": True,
        }

    def _mock_sentiment_analysis(
        self, market_data: Dict, buyer_feedback: List[str]
    ) -> Dict[str, Any]:
        """Mock implementation for sentiment analysis."""
        return {
            "sentiment_analysis": """# Buyer Sentiment Analysis

## Overall Sentiment: POSITIVE (0.72)

## Key Themes
1. Quality Assurance (mentioned 15 times)
2. Price Competitiveness (12 mentions)
3. Verification Standards (10 mentions)

## Pain Points
- Concerns about delivery timelines
- Request for more payment options
- Desire for longer-term contracts

## Recommendations
1. Streamline settlement process
2. Introduce bulk purchase discounts
3. Develop forward purchase agreements
""",
            "feedback_count": len(buyer_feedback),
            "generated_at": datetime.utcnow().isoformat(),
            "mock": True,
        }

    def _mock_project_story(
        self, project_data: Dict, story_type: str, format: str
    ) -> Dict[str, Any]:
        """Mock implementation for project storytelling."""
        return {
            "story": f"""# The Story of {project_data.get('project_name', 'Our Project')}

## Opening
In the heart of rural Zimbabwe, something remarkable is happening. Communities are transforming their relationship with the land while fighting climate change.

## The Human Element
Meet Sarah, a farmer who has seen her crop yields double since implementing agroforestry practices through the carbon project.

## Impact
This project has:
- Protected 45,000 hectares of forest
- Sequestered 125,000 tonnes of CO₂
- Supported 2,450 families

## Call to Action
Join us in this journey. Every credit purchased is an investment in people and planet.

*Set GOOGLE_API_KEY for AI-generated storytelling.*
""",
            "project_id": project_data.get("project_id"),
            "story_type": story_type,
            "format": format,
            "generated_at": datetime.utcnow().isoformat(),
            "mock": True,
        }

    def _mock_nl_query(self, query: str, context: Dict, user_role: str) -> Dict[str, Any]:
        """Mock implementation for natural language queries."""
        return {
            "answer": f"""Based on your query as a {user_role}: "{query}"

Here's what I found in the available data:

{json.dumps(context, indent=2)[:500]}...

For more detailed answers, please ensure the GOOGLE_API_KEY environment variable is set for AI-powered query processing.
""",
            "query": query,
            "user_role": user_role,
            "generated_at": datetime.utcnow().isoformat(),
            "mock": True,
        }


# Singleton instance
_langchain_service: Optional[LangChainService] = None


def get_langchain_service() -> LangChainService:
    """Get or create LangChain service instance."""
    global _langchain_service
    if _langchain_service is None:
        _langchain_service = LangChainService()
    return _langchain_service
